"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type {
  EstadoReporte,
  RegistroAuditoria,
  RolUsuario,
  TipoVerificacion,
} from "@/types/database";

const revisarVerificacionSchema = z
  .object({
    verificacionId: z.string().uuid("Identificador de verificación no válido."),
    decision: z.enum(["aprobada", "rechazada"]),
    motivoRechazo: z.string().trim().max(300).optional(),
  })
  .superRefine((val, ctx) => {
    if (
      val.decision === "rechazada" &&
      (!val.motivoRechazo || val.motivoRechazo.trim().length < 5)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["motivoRechazo"],
        message:
          "Indica el motivo del rechazo (mínimo 5 caracteres) para orientar a la persona usuaria.",
      });
    }
  });

const actualizarReporteSchema = z.object({
  reporteId: z.string().uuid("Identificador de reporte no válido."),
  nuevoEstado: z.enum(["abierto", "en_revision", "resuelto", "descartado"]),
  notaModeracion: z.string().trim().max(300).optional(),
});

export interface AdminActionResult {
  ok: boolean;
  message?: string;
  error?: string;
  auditoriaCreada?: RegistroAuditoria;
}

async function verificarSesionAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Debes iniciar sesión." };
  }

  const { data: perfilAdmin } = await supabase
    .from("perfiles")
    .select("id, rol, nombre, apellidos")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfilAdmin || perfilAdmin.rol !== "administrador") {
    return {
      ok: false as const,
      error: "Acceso restringido a administradores de Otoch.",
    };
  }

  return {
    ok: true as const,
    supabase,
    adminId: user.id,
    adminNombre: `${perfilAdmin.nombre} ${perfilAdmin.apellidos}`.trim(),
  };
}

export async function revisarVerificacionAdminAction(input: {
  verificacionId: string;
  decision: "aprobada" | "rechazada";
  motivoRechazo?: string;
}): Promise<AdminActionResult> {
  const parsed = revisarVerificacionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Revisa los datos de la resolución.",
    };
  }

  try {
    const auth = await verificarSesionAdmin();
    if (!auth.ok) {
      return { ok: false, error: auth.error };
    }

    const { supabase, adminId, adminNombre } = auth;
    const { verificacionId, decision, motivoRechazo } = parsed.data;
    const motivoLimpio =
      decision === "rechazada" && motivoRechazo?.trim()
        ? motivoRechazo.trim()
        : null;

    const { data: verif, error: errVerif } = await supabase
      .from("verificaciones")
      .select("id, perfil_id, tipo, estado, evidencia_ruta")
      .eq("id", verificacionId)
      .maybeSingle();

    if (errVerif || !verif) {
      return {
        ok: false,
        error: "No se encontró la solicitud de verificación.",
      };
    }

    if (verif.estado !== "pendiente") {
      return {
        ok: false,
        error: "Esta solicitud ya fue atendida previamente.",
      };
    }

    const { data: perfilObjetivo } = await supabase
      .from("perfiles")
      .select("id, rol, estado_verificacion")
      .eq("id", verif.perfil_id)
      .maybeSingle();

    if (!perfilObjetivo) {
      return {
        ok: false,
        error: "El perfil solicitante no existe.",
      };
    }

    const ahoraIso = new Date().toISOString();

    // 1. Actualizar solicitud en `verificaciones` (y limpiar ruta temporal de evidencia conforme a LFPDPPP)
    const { error: errUpdateVerif } = await supabase
      .from("verificaciones")
      .update({
        estado: decision,
        revisado_por: adminId,
        revisado_en: ahoraIso,
        motivo_rechazo: motivoLimpio,
        evidencia_ruta: null,
      })
      .eq("id", verificacionId);

    if (errUpdateVerif) {
      return {
        ok: false,
        error: "No se pudo actualizar el estado de la verificación.",
      };
    }

    // 2. Actualizar `perfiles.estado_verificacion`
    if (decision === "aprobada") {
      await supabase
        .from("perfiles")
        .update({ estado_verificacion: "verificado" })
        .eq("id", verif.perfil_id);
    } else {
      const { count: aprobadasPrevias } = await supabase
        .from("verificaciones")
        .select("*", { count: "exact", head: true })
        .eq("perfil_id", verif.perfil_id)
        .eq("estado", "aprobada");

      if ((aprobadasPrevias ?? 0) === 0) {
        await supabase
          .from("perfiles")
          .update({ estado_verificacion: "rechazado" })
          .eq("id", verif.perfil_id);
      }
    }

    // 3. Actualizar banderas en `perfiles_arrendador` si el solicitante es arrendador
    const rolObjetivo = perfilObjetivo.rol as RolUsuario;
    const tipoVerif = verif.tipo as TipoVerificacion;

    if (rolObjetivo === "arrendador") {
      if (tipoVerif === "identidad") {
        await supabase
          .from("perfiles_arrendador")
          .update({ identidad_verificada: decision === "aprobada" })
          .eq("perfil_id", verif.perfil_id);
      } else if (tipoVerif === "propiedad") {
        await supabase
          .from("perfiles_arrendador")
          .update({ propiedad_verificada: decision === "aprobada" })
          .eq("perfil_id", verif.perfil_id);
      }
    }

    // 4. Registrar evento inmutable en `auditoria`
    const accion =
      decision === "aprobada"
        ? "verificacion.aprobada"
        : "verificacion.rechazada";

    const detalleAuditoria: Record<string, unknown> = {
      perfil_id: verif.perfil_id,
      tipo: tipoVerif,
      rol_objetivo: rolObjetivo,
      evidencia_depurada: Boolean(verif.evidencia_ruta),
      ...(motivoLimpio ? { motivo_rechazo: motivoLimpio } : {}),
    };

    const { data: auditInsertada } = await supabase
      .from("auditoria")
      .insert({
        actor_id: adminId,
        accion,
        entidad: "verificaciones",
        entidad_id: verif.id,
        detalle: detalleAuditoria,
      })
      .select("*")
      .maybeSingle();

    revalidatePath("/admin");
    revalidatePath("/perfil");

    return {
      ok: true,
      message:
        decision === "aprobada"
          ? "Verificación aprobada y perfil actualizado."
          : "Verificación rechazada y notificación enviada a la persona usuaria.",
      auditoriaCreada: auditInsertada
        ? {
            id: Number(auditInsertada.id),
            actor_id: adminId,
            actorNombre: adminNombre,
            accion,
            entidad: "verificaciones",
            entidad_id: verif.id,
            detalle: detalleAuditoria,
            creado_en: String(auditInsertada.creado_en ?? ahoraIso),
          }
        : undefined,
    };
  } catch {
    return {
      ok: false,
      error: "Ocurrió un error inesperado al procesar la verificación.",
    };
  }
}

export async function actualizarEstadoReporteAdminAction(input: {
  reporteId: string;
  nuevoEstado: EstadoReporte;
  notaModeracion?: string;
}): Promise<AdminActionResult> {
  const parsed = actualizarReporteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Selecciona un estado de reporte válido.",
    };
  }

  try {
    const auth = await verificarSesionAdmin();
    if (!auth.ok) {
      return { ok: false, error: auth.error };
    }

    const { supabase, adminId, adminNombre } = auth;
    const { reporteId, nuevoEstado, notaModeracion } = parsed.data;

    const { data: reporteActual, error: errRep } = await supabase
      .from("reportes")
      .select("id, estado, motivo")
      .eq("id", reporteId)
      .maybeSingle();

    if (errRep || !reporteActual) {
      return { ok: false, error: "No se encontró el reporte indicado." };
    }

    if (reporteActual.estado === nuevoEstado) {
      return { ok: true, message: "El reporte ya tenía ese estado." };
    }

    const esTerminal =
      nuevoEstado === "resuelto" || nuevoEstado === "descartado";
    const ahoraIso = new Date().toISOString();

    const { error: errUpdate } = await supabase
      .from("reportes")
      .update({
        estado: nuevoEstado,
        resuelto_por: esTerminal ? adminId : null,
        resuelto_en: esTerminal ? ahoraIso : null,
      })
      .eq("id", reporteId);

    if (errUpdate) {
      return {
        ok: false,
        error: "No se pudo actualizar el estado del reporte.",
      };
    }

    const accion = `reporte.${nuevoEstado}`;
    const detalleAuditoria: Record<string, unknown> = {
      estado_anterior: reporteActual.estado,
      estado_nuevo: nuevoEstado,
      motivo: reporteActual.motivo,
      ...(notaModeracion?.trim() ? { nota: notaModeracion.trim() } : {}),
    };

    const { data: auditInsertada } = await supabase
      .from("auditoria")
      .insert({
        actor_id: adminId,
        accion,
        entidad: "reportes",
        entidad_id: reporteActual.id,
        detalle: detalleAuditoria,
      })
      .select("*")
      .maybeSingle();

    revalidatePath("/admin");

    return {
      ok: true,
      message: "Estado del reporte actualizado y registrado en auditoría.",
      auditoriaCreada: auditInsertada
        ? {
            id: Number(auditInsertada.id),
            actor_id: adminId,
            actorNombre: adminNombre,
            accion,
            entidad: "reportes",
            entidad_id: reporteActual.id,
            detalle: detalleAuditoria,
            creado_en: String(auditInsertada.creado_en ?? ahoraIso),
          }
        : undefined,
    };
  } catch {
    return {
      ok: false,
      error: "Ocurrió un error inesperado al actualizar el reporte.",
    };
  }
}
