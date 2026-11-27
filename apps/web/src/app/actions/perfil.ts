"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  onboardingPayloadSchema,
  perfilArrendadorSchema,
  perfilBaseSchema,
  perfilEstudianteSchema,
  preferenciasConvivenciaSchema,
  verificacionSolicitudSchema,
  type OnboardingPayload,
} from "@/lib/validations/auth";
import type { TipoVerificacion } from "@/types/database";

export interface ActionResult {
  ok: boolean;
  message?: string;
  error?: string;
}

export async function completarOnboardingAction(
  payload: OnboardingPayload
): Promise<ActionResult> {
  const parsed = onboardingPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      ok: false,
      error: firstIssue?.message ?? "Revisa los datos ingresados en el formulario.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        ok: false,
        error: "Tu sesión expiró. Inicia sesión nuevamente.",
      };
    }

    const { perfil } = parsed.data;

    const { error: errorPerfil } = await supabase.from("perfiles").upsert(
      {
        id: user.id,
        rol: parsed.data.rol,
        nombre: perfil.nombre,
        apellidos: perfil.apellidos,
        fecha_nacimiento: perfil.fecha_nacimiento,
        genero: perfil.genero ?? null,
        telefono: perfil.telefono?.trim() ? perfil.telefono.trim() : null,
        biografia: perfil.biografia?.trim() ? perfil.biografia.trim() : null,
      },
      { onConflict: "id" }
    );

    if (errorPerfil) {
      return {
        ok: false,
        error: "No fue posible guardar tus datos generales. Verifica tu fecha de nacimiento y campos obligatorios.",
      };
    }

    if (parsed.data.rol === "estudiante") {
      const { estudiante, preferencias } = parsed.data;
      const correoLimpio = estudiante.correo_institucional?.trim()
        ? estudiante.correo_institucional.trim().toLowerCase()
        : null;

      const { error: errorEst } = await supabase
        .from("perfiles_estudiante")
        .upsert(
          {
            perfil_id: user.id,
            universidad_id: estudiante.universidad_id,
            municipio_origen_id: estudiante.municipio_origen_id ?? null,
            carrera: estudiante.carrera.trim(),
            periodo_actual: estudiante.periodo_actual,
            correo_institucional: correoLimpio,
            presupuesto_max: estudiante.presupuesto_max,
            fecha_mudanza: estudiante.fecha_mudanza?.trim()
              ? estudiante.fecha_mudanza.trim()
              : null,
            busca_roomies: estudiante.busca_roomies,
            max_roomies: estudiante.max_roomies,
          },
          { onConflict: "perfil_id" }
        );

      if (errorEst) {
        if (errorEst.code === "23505") {
          return {
            ok: false,
            error:
              "Ese correo institucional ya está vinculado a otra cuenta en Otoch.",
          };
        }
        return {
          ok: false,
          error: "No fue posible guardar tus datos académicos.",
        };
      }

      const { error: errorPref } = await supabase
        .from("preferencias_convivencia")
        .upsert(
          {
            perfil_id: user.id,
            horario_sueno: preferencias.horario_sueno,
            limpieza: preferencias.limpieza,
            tolerancia_ruido: preferencias.tolerancia_ruido,
            frecuencia_visitas: preferencias.frecuencia_visitas,
            estudia_en_casa: preferencias.estudia_en_casa,
            fuma: preferencias.fuma,
            tiene_mascota: preferencias.tiene_mascota,
            acepta_mascotas: preferencias.acepta_mascotas,
            preferencia_roomie: preferencias.preferencia_roomie,
            intereses: preferencias.intereses,
          },
          { onConflict: "perfil_id" }
        );

      if (errorPref) {
        return {
          ok: false,
          error: "No fue posible guardar tu cuestionario de convivencia.",
        };
      }
    } else {
      const { arrendador } = parsed.data;
      const { error: errorArr } = await supabase
        .from("perfiles_arrendador")
        .upsert(
          {
            perfil_id: user.id,
            tipo: arrendador.tipo,
            nombre_comercial: arrendador.nombre_comercial?.trim()
              ? arrendador.nombre_comercial.trim()
              : null,
          },
          { onConflict: "perfil_id" }
        );

      if (errorArr) {
        return {
          ok: false,
          error: "No fue posible guardar tus datos de arrendador.",
        };
      }
    }

    revalidatePath("/", "layout");
    revalidatePath("/perfil");
    revalidatePath("/explorar");

    return {
      ok: true,
      message: "¡Tu perfil quedó configurado con éxito!",
    };
  } catch {
    return {
      ok: false,
      error: "Ocurrió un error inesperado al guardar tu perfil.",
    };
  }
}

export async function actualizarPerfilAction(
  payload: OnboardingPayload
): Promise<ActionResult> {
  const parsed = onboardingPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Verifica que todos los datos sean válidos.",
    };
  }

  // Revalida también sub-esquemas individuales para mensajes claros
  const baseCheck = perfilBaseSchema.safeParse(parsed.data.perfil);
  if (!baseCheck.success) {
    return { ok: false, error: baseCheck.error.issues[0]?.message };
  }

  if (parsed.data.rol === "estudiante") {
    const estCheck = perfilEstudianteSchema.safeParse(parsed.data.estudiante);
    if (!estCheck.success) {
      return { ok: false, error: estCheck.error.issues[0]?.message };
    }
    const prefCheck = preferenciasConvivenciaSchema.safeParse(
      parsed.data.preferencias
    );
    if (!prefCheck.success) {
      return { ok: false, error: prefCheck.error.issues[0]?.message };
    }
  } else {
    const arrCheck = perfilArrendadorSchema.safeParse(parsed.data.arrendador);
    if (!arrCheck.success) {
      return { ok: false, error: arrCheck.error.issues[0]?.message };
    }
  }

  const res = await completarOnboardingAction(parsed.data);
  if (res.ok) {
    return {
      ok: true,
      message: "Cambios guardados correctamente en tu perfil.",
    };
  }
  return res;
}

export async function solicitarVerificacionAction(input: {
  tipo: TipoVerificacion;
  evidencia_ruta?: string;
}): Promise<ActionResult> {
  const parsed = verificacionSolicitudSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Selecciona un tipo de verificación válido.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        ok: false,
        error: "Debes iniciar sesión para solicitar una verificación.",
      };
    }

    const { data: existente } = await supabase
      .from("verificaciones")
      .select("id, estado")
      .eq("perfil_id", user.id)
      .eq("tipo", parsed.data.tipo)
      .in("estado", ["pendiente", "aprobada"])
      .maybeSingle();

    if (existente) {
      return {
        ok: false,
        error:
          existente.estado === "aprobada"
            ? "Esta verificación ya fue aprobada."
            : "Ya tienes una solicitud en revisión para este documento.",
      };
    }

    const { error } = await supabase.from("verificaciones").insert({
      perfil_id: user.id,
      tipo: parsed.data.tipo,
      evidencia_ruta: parsed.data.evidencia_ruta?.trim()
        ? parsed.data.evidencia_ruta.trim()
        : null,
    });

    if (error) {
      return {
        ok: false,
        error: "No se pudo registrar tu solicitud de verificación.",
      };
    }

    revalidatePath("/perfil");
    return {
      ok: true,
      message:
        "Solicitud registrada. El equipo de Otoch revisará tu verificación pronto.",
    };
  } catch {
    return {
      ok: false,
      error: "Error de conexión al registrar la verificación.",
    };
  }
}
