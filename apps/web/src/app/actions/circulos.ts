"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  bloquearUsuarioSchema,
  crearCirculoSchema,
  crearReporteSchema,
  enviarMensajeSchema,
  guardarAcuerdoSchema,
  invitarRoomieSchema,
  responderInvitacionSchema,
} from "@/lib/validations/circulos";
import type { MotivoReporte } from "@/types/database";

export interface CirculoActionResult {
  ok: boolean;
  circuloId?: string;
  acuerdoId?: string;
  message?: string;
  error?: string;
}

export async function crearCirculoDesdeMatchAction(rawInput: {
  matchId: string;
  nombre: string;
  cupo: number;
}): Promise<CirculoActionResult> {
  const parsed = crearCirculoSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Revisa el nombre y el cupo del círculo.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Tu sesión expiró. Inicia sesión nuevamente." };
    }

    const { data: match } = await supabase
      .from("matches")
      .select("id, tipo, perfil_a_id, perfil_b_id, inmueble_id, estado")
      .eq("id", parsed.data.matchId)
      .maybeSingle();

    if (
      !match ||
      match.tipo !== "estudiante_inmueble" ||
      !match.inmueble_id ||
      (match.perfil_a_id !== user.id && match.perfil_b_id !== user.id)
    ) {
      return {
        ok: false,
        error: "El match de inmueble seleccionado no es válido.",
      };
    }

    // Crear el círculo
    const { data: nuevoCirculo, error: errCirculo } = await supabase
      .from("circulos")
      .insert({
        inmueble_id: match.inmueble_id,
        creado_por: user.id,
        nombre: parsed.data.nombre,
        cupo: parsed.data.cupo,
        estado: "abierto",
      })
      .select("id")
      .single();

    if (errCirculo || !nuevoCirculo) {
      return {
        ok: false,
        error: "No fue posible crear el círculo en este momento.",
      };
    }

    const ahora = new Date().toISOString();
    // En matches estudiante_inmueble: perfil_a_id es estudiante, perfil_b_id es arrendador
    const { error: errMiembros } = await supabase
      .from("miembros_circulo")
      .insert([
        {
          circulo_id: nuevoCirculo.id,
          perfil_id: match.perfil_a_id,
          rol: "estudiante",
          estado: "activo",
          unido_en: ahora,
        },
        {
          circulo_id: nuevoCirculo.id,
          perfil_id: match.perfil_b_id,
          rol: "arrendador",
          estado: "activo",
          unido_en: ahora,
        },
      ]);

    if (errMiembros) {
      return {
        ok: false,
        error: "Se creó el círculo pero ocurrió un problema al agregar integrantes.",
      };
    }

    await supabase.from("mensajes").insert({
      circulo_id: nuevoCirculo.id,
      autor_id: user.id,
      tipo: "sistema",
      contenido: "Círculo abierto para acordar visita, reglas y renta dividida.",
    });

    revalidatePath("/", "layout");
    revalidatePath("/circulos");
    revalidatePath("/matches");

    return {
      ok: true,
      circuloId: nuevoCirculo.id,
      message: "¡Círculo creado con éxito!",
    };
  } catch {
    return {
      ok: false,
      error: "Ocurrió un error al crear el círculo.",
    };
  }
}

export async function invitarRoomieACirculoAction(rawInput: {
  circuloId: string;
  roomieId: string;
}): Promise<CirculoActionResult> {
  const parsed = invitarRoomieSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos de invitación no válidos.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Debes iniciar sesión." };
    }

    const { circuloId, roomieId } = parsed.data;

    // Verificar que existe match activo de roomies entre ambos
    const [minId, maxId] =
      user.id < roomieId ? [user.id, roomieId] : [roomieId, user.id];

    const [{ data: matchRoomie }, { data: circulo }, { data: miembros }, { data: perfilInvitado }] =
      await Promise.all([
        supabase
          .from("matches")
          .select("id")
          .eq("tipo", "roomies")
          .eq("estado", "activo")
          .eq("perfil_a_id", minId)
          .eq("perfil_b_id", maxId)
          .maybeSingle(),
        supabase
          .from("circulos")
          .select("id, cupo, estado")
          .eq("id", circuloId)
          .maybeSingle(),
        supabase
          .from("miembros_circulo")
          .select("perfil_id, rol, estado")
          .eq("circulo_id", circuloId),
        supabase
          .from("perfiles")
          .select("nombre, apellidos")
          .eq("id", roomieId)
          .maybeSingle(),
      ]);

    if (!matchRoomie) {
      return {
        ok: false,
        error: "Solo puedes invitar estudiantes con quienes tengas match activo.",
      };
    }

    if (!circulo || circulo.estado === "cerrado" || circulo.estado === "cancelado") {
      return { ok: false, error: "Este círculo ya no admite invitaciones." };
    }

    const listaMiembros = miembros ?? [];
    const existente = listaMiembros.find((m) => m.perfil_id === roomieId);
    if (existente && existente.estado !== "salio") {
      return {
        ok: false,
        error:
          existente.estado === "activo"
            ? "Este estudiante ya forma parte del círculo."
            : "Este estudiante ya tiene una invitación pendiente.",
      };
    }

    const estudiantesOcupandoCupo = listaMiembros.filter(
      (m) => m.rol === "estudiante" && (m.estado === "activo" || m.estado === "invitado")
    ).length;

    if (estudiantesOcupandoCupo >= circulo.cupo) {
      return {
        ok: false,
        error: `El círculo ya alcanzó su cupo máximo de ${circulo.cupo} estudiantes.`,
      };
    }

    const { error: errInv } = await supabase.from("miembros_circulo").upsert(
      {
        circulo_id: circuloId,
        perfil_id: roomieId,
        rol: "estudiante",
        estado: "invitado",
        unido_en: null,
      },
      { onConflict: "circulo_id,perfil_id" }
    );

    if (errInv) {
      return { ok: false, error: "No fue posible enviar la invitación." };
    }

    const nombreRoomie = perfilInvitado
      ? `${perfilInvitado.nombre} ${perfilInvitado.apellidos}`.trim()
      : "Un roomie";

    await supabase.from("mensajes").insert({
      circulo_id: circuloId,
      autor_id: user.id,
      tipo: "sistema",
      contenido: `Se invitó a ${nombreRoomie} a unirse al círculo.`,
    });

    revalidatePath(`/circulos/${circuloId}`);
    revalidatePath("/circulos");

    return {
      ok: true,
      message: `Invitación enviada a ${nombreRoomie}.`,
    };
  } catch {
    return { ok: false, error: "Error al enviar la invitación." };
  }
}

export async function responderInvitacionCirculoAction(rawInput: {
  circuloId: string;
  aceptar: boolean;
}): Promise<CirculoActionResult> {
  const parsed = responderInvitacionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Solicitud inválida." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Debes iniciar sesión." };
    }

    const { circuloId, aceptar } = parsed.data;

    if (aceptar) {
      const [{ data: circulo }, { data: activos }, { data: miPerfil }] =
        await Promise.all([
          supabase
            .from("circulos")
            .select("id, cupo")
            .eq("id", circuloId)
            .maybeSingle(),
          supabase
            .from("miembros_circulo")
            .select("perfil_id")
            .eq("circulo_id", circuloId)
            .eq("rol", "estudiante")
            .eq("estado", "activo"),
          supabase
            .from("perfiles")
            .select("nombre")
            .eq("id", user.id)
            .maybeSingle(),
        ]);

      if (circulo && (activos ?? []).length >= circulo.cupo) {
        return {
          ok: false,
          error: "El círculo ya llenó todos sus lugares activos.",
        };
      }

      const { error } = await supabase
        .from("miembros_circulo")
        .update({
          estado: "activo",
          unido_en: new Date().toISOString(),
        })
        .eq("circulo_id", circuloId)
        .eq("perfil_id", user.id);

      if (error) {
        return { ok: false, error: "No se pudo aceptar la invitación." };
      }

      await supabase.from("mensajes").insert({
        circulo_id: circuloId,
        autor_id: user.id,
        tipo: "sistema",
        contenido: `${miPerfil?.nombre ?? "Nuevo integrante"} se unió al círculo.`,
      });

      // Si existe un acuerdo en borrador/propuesto, recalcular automáticamente partes iguales
      const { data: acuerdoVigente } = await supabase
        .from("acuerdos")
        .select("id")
        .eq("circulo_id", circuloId)
        .in("estado", ["borrador", "propuesto"])
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (acuerdoVigente) {
        await supabase.rpc("repartir_partes_iguales", {
          p_acuerdo: acuerdoVigente.id,
        });
      }

      revalidatePath("/", "layout");
      revalidatePath("/circulos");
      revalidatePath(`/circulos/${circuloId}`);

      return {
        ok: true,
        circuloId,
        message: "¡Te uniste al círculo!",
      };
    }

    const { error } = await supabase
      .from("miembros_circulo")
      .update({ estado: "salio" })
      .eq("circulo_id", circuloId)
      .eq("perfil_id", user.id);

    if (error) {
      return { ok: false, error: "No se pudo rechazar la invitación." };
    }

    revalidatePath("/circulos");
    return {
      ok: true,
      message: "Invitación rechazada.",
    };
  } catch {
    return { ok: false, error: "Error al procesar la invitación." };
  }
}

export async function enviarMensajeCirculoAction(rawInput: {
  circuloId: string;
  tipo: "texto" | "imagen";
  contenido?: string;
  adjuntoRuta?: string;
}): Promise<CirculoActionResult> {
  const parsed = enviarMensajeSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Mensaje no válido.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Sesión expirada." };
    }

    const { error } = await supabase.from("mensajes").insert({
      circulo_id: parsed.data.circuloId,
      autor_id: user.id,
      tipo: parsed.data.tipo,
      contenido: parsed.data.contenido?.trim()
        ? parsed.data.contenido.trim()
        : parsed.data.tipo === "imagen"
          ? "Imagen compartida"
          : null,
      adjunto_ruta: parsed.data.adjuntoRuta?.trim()
        ? parsed.data.adjuntoRuta.trim()
        : null,
    });

    if (error) {
      return {
        ok: false,
        error: "No se pudo enviar el mensaje. Verifica que seas miembro activo.",
      };
    }

    revalidatePath(`/circulos/${parsed.data.circuloId}`);
    revalidatePath("/circulos");
    return { ok: true };
  } catch {
    return { ok: false, error: "Error de conexión al enviar el mensaje." };
  }
}

export async function guardarPreAcuerdoAction(rawInput: {
  circuloId: string;
  renta_total: number;
  deposito_total: number;
  servicios_estimados: number;
  fecha_inicio: string;
  duracion_meses: number;
  clausulas: string[];
}): Promise<CirculoActionResult> {
  const parsed = guardarAcuerdoSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Verifica los montos y fechas del pre-acuerdo.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Sesión expirada." };
    }

    const d = parsed.data;

    // Verificar que haya al menos 1 estudiante activo antes de invocar repartir_partes_iguales
    const [{ data: estActivos }, { data: ultimoAcuerdo }, { data: autorPerfil }] =
      await Promise.all([
        supabase
          .from("miembros_circulo")
          .select("perfil_id")
          .eq("circulo_id", d.circuloId)
          .eq("rol", "estudiante")
          .eq("estado", "activo"),
        supabase
          .from("acuerdos")
          .select("id, version, estado")
          .eq("circulo_id", d.circuloId)
          .order("version", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("perfiles")
          .select("nombre")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

    if (!estActivos || estActivos.length === 0) {
      return {
        ok: false,
        error: "El círculo necesita al menos un estudiante activo para calcular el reparto.",
      };
    }

    let acuerdoId: string;
    let versionNum: number;

    if (
      ultimoAcuerdo &&
      (ultimoAcuerdo.estado === "borrador" ||
        ultimoAcuerdo.estado === "propuesto")
    ) {
      acuerdoId = ultimoAcuerdo.id;
      versionNum = ultimoAcuerdo.version;

      const { error: updErr } = await supabase
        .from("acuerdos")
        .update({
          renta_total: d.renta_total,
          deposito_total: d.deposito_total,
          servicios_estimados: d.servicios_estimados,
          fecha_inicio: d.fecha_inicio,
          duracion_meses: d.duracion_meses,
          clausulas: d.clausulas,
          estado: "propuesto",
        })
        .eq("id", acuerdoId);

      if (updErr) {
        return { ok: false, error: "No se pudo actualizar el pre-acuerdo." };
      }
    } else {
      versionNum = (ultimoAcuerdo?.version ?? 0) + 1;
      const { data: nuevoAcuerdo, error: insErr } = await supabase
        .from("acuerdos")
        .insert({
          circulo_id: d.circuloId,
          version: versionNum,
          renta_total: d.renta_total,
          deposito_total: d.deposito_total,
          servicios_estimados: d.servicios_estimados,
          fecha_inicio: d.fecha_inicio,
          duracion_meses: d.duracion_meses,
          clausulas: d.clausulas,
          estado: "propuesto",
        })
        .select("id")
        .single();

      if (insErr || !nuevoAcuerdo) {
        return { ok: false, error: "No se pudo crear el pre-acuerdo." };
      }
      acuerdoId = nuevoAcuerdo.id;
    }

    // Invocar función RPC de negocio en PostgreSQL para calcular partes iguales
    const { error: rpcErr } = await supabase.rpc("repartir_partes_iguales", {
      p_acuerdo: acuerdoId,
    });

    if (rpcErr) {
      return {
        ok: false,
        error: "Se guardó el acuerdo pero falló el cálculo RPC de partes iguales.",
      };
    }

    await Promise.all([
      supabase
        .from("circulos")
        .update({ estado: "en_acuerdo" })
        .eq("id", d.circuloId),
      supabase.from("mensajes").insert({
        circulo_id: d.circuloId,
        autor_id: user.id,
        tipo: "sistema",
        contenido: `${autorPerfil?.nombre ?? "Un integrante"} actualizó el pre-acuerdo v${versionNum} y calculó la renta en partes iguales.`,
      }),
    ]);

    revalidatePath(`/circulos/${d.circuloId}`);
    revalidatePath("/circulos");

    return {
      ok: true,
      acuerdoId,
      message: "Pre-acuerdo guardado y reparto calculado en partes iguales.",
    };
  } catch {
    return {
      ok: false,
      error: "Ocurrió un error al guardar el pre-acuerdo.",
    };
  }
}

export async function aceptarRepartoAcuerdoAction(
  acuerdoId: string,
  circuloId: string
): Promise<CirculoActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Debes iniciar sesión." };
    }

    const { error: updErr } = await supabase
      .from("aportaciones")
      .update({ aceptado_en: new Date().toISOString() })
      .eq("acuerdo_id", acuerdoId)
      .eq("perfil_id", user.id);

    if (updErr) {
      return {
        ok: false,
        error: "Solo los estudiantes incluidos en el reparto pueden aceptarlo.",
      };
    }

    const [{ data: todasAportaciones }, { data: miPerfil }] = await Promise.all([
      supabase
        .from("aportaciones")
        .select("perfil_id, aceptado_en")
        .eq("acuerdo_id", acuerdoId),
      supabase.from("perfiles").select("nombre").eq("id", user.id).maybeSingle(),
    ]);

    const lista = todasAportaciones ?? [];
    const todosAceptaron =
      lista.length > 0 && lista.every((a) => Boolean(a.aceptado_en));

    if (todosAceptaron) {
      await supabase
        .from("acuerdos")
        .update({ estado: "aceptado" })
        .eq("id", acuerdoId);
    }

    await supabase.from("mensajes").insert({
      circulo_id: circuloId,
      autor_id: user.id,
      tipo: "sistema",
      contenido: todosAceptaron
        ? `¡${miPerfil?.nombre ?? "El último integrante"} aceptó su parte! Todos los estudiantes aprobaron el reparto.`
        : `${miPerfil?.nombre ?? "Un estudiante"} aceptó su reparto de renta y reglas de la casa.`,
    });

    revalidatePath(`/circulos/${circuloId}`);
    revalidatePath("/circulos");

    return {
      ok: true,
      message: todosAceptaron
        ? "¡Todos los integrantes aceptaron el pre-acuerdo!"
        : "¡Tu aceptación quedó registrada!",
    };
  } catch {
    return { ok: false, error: "No se pudo registrar tu aceptación." };
  }
}

export async function reportarEnCirculoAction(rawInput: {
  perfilReportadoId?: string | null;
  inmuebleReportadoId?: string | null;
  mensajeId?: number | null;
  motivo: MotivoReporte;
  descripcion: string;
}): Promise<CirculoActionResult> {
  const parsed = crearReporteSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Completa el motivo del reporte.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Debes iniciar sesión." };
    }

    const { error } = await supabase.from("reportes").insert({
      reportante_id: user.id,
      perfil_reportado_id: parsed.data.perfilReportadoId ?? null,
      inmueble_reportado_id: parsed.data.inmuebleReportadoId ?? null,
      mensaje_id: parsed.data.mensajeId ?? null,
      motivo: parsed.data.motivo,
      descripcion: parsed.data.descripcion,
    });

    if (error) {
      return { ok: false, error: "No se pudo enviar el reporte." };
    }

    return {
      ok: true,
      message: "Reporte enviado al equipo de moderación de Otoch.",
    };
  } catch {
    return { ok: false, error: "Error de conexión al enviar el reporte." };
  }
}

export async function bloquearUsuarioAction(
  bloqueadoId: string
): Promise<CirculoActionResult> {
  const parsed = bloquearUsuarioSchema.safeParse({ bloqueadoId });
  if (!parsed.success) {
    return { ok: false, error: "Usuario inválido." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id === parsed.data.bloqueadoId) {
      return { ok: false, error: "Operación no permitida." };
    }

    const { error } = await supabase.from("bloqueos").upsert(
      {
        bloqueador_id: user.id,
        bloqueado_id: parsed.data.bloqueadoId,
      },
      { onConflict: "bloqueador_id,bloqueado_id", ignoreDuplicates: true }
    );

    if (error) {
      return { ok: false, error: "No se pudo bloquear al usuario." };
    }

    revalidatePath("/circulos");
    revalidatePath("/roomies");
    revalidatePath("/explorar");

    return {
      ok: true,
      message: "Usuario bloqueado. Ya no podrán verse ni enviarse mensajes.",
    };
  } catch {
    return { ok: false, error: "Error al bloquear al usuario." };
  }
}
