"use server";

import { revalidatePath } from "next/cache";
import { obtenerIniciales } from "@/components/otoch/avatar";
import { formatearPuntoPostGIS } from "@/lib/geo";
import { createClient } from "@/lib/supabase/server";
import {
  inmuebleFormSchema,
  swipeInputSchema,
  type InmuebleFormInput,
} from "@/lib/validations/inmuebles";
import type { DecisionSwipe, EstadoInmueble } from "@/types/database";

export interface InmuebleMutationResult {
  ok: boolean;
  inmuebleId?: string;
  message?: string;
  error?: string;
}

export interface MatchDetectadoInfo {
  matchId: string;
  tipo: "estudiante_inmueble" | "roomies";
  contraparteNombre: string;
  contraparteIniciales: string;
  inmuebleTitulo?: string;
  rentaPorPersona?: number;
  compatibilidad?: number | null;
}

export interface SwipeResult {
  ok: boolean;
  error?: string;
  match?: MatchDetectadoInfo | null;
}

export async function guardarInmuebleAction(
  input: InmuebleFormInput
): Promise<InmuebleMutationResult> {
  const parsed = inmuebleFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Revisa los campos del formulario de inmueble.",
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
        error: "Debes iniciar sesión para publicar un inmueble.",
      };
    }

    const { data: perfil } = await supabase
      .from("perfiles")
      .select("id, rol")
      .eq("id", user.id)
      .maybeSingle();

    if (!perfil || perfil.rol !== "arrendador") {
      return {
        ok: false,
        error: "Solo las cuentas con rol arrendador pueden gestionar inmuebles.",
      };
    }

    // Garantiza que exista el registro en perfiles_arrendador por la llave foránea
    await supabase
      .from("perfiles_arrendador")
      .upsert(
        {
          perfil_id: user.id,
          tipo: "persona_fisica",
        },
        { onConflict: "perfil_id", ignoreDuplicates: true }
      );

    const d = parsed.data;
    const ubicacionEwkt = formatearPuntoPostGIS(d.lng, d.lat);

    const rowPayload = {
      arrendador_id: user.id,
      titulo: d.titulo,
      descripcion: d.descripcion?.trim() ? d.descripcion.trim() : null,
      tipo: d.tipo,
      colonia: d.colonia,
      direccion_privada: d.direccion_privada?.trim()
        ? d.direccion_privada.trim()
        : null,
      ubicacion: ubicacionEwkt,
      renta_mensual: d.renta_mensual,
      deposito: d.deposito,
      capacidad: d.capacidad,
      habitaciones: d.habitaciones,
      banos: d.banos,
      amueblado: d.amueblado,
      servicios_incluidos: d.servicios_incluidos,
      reglas: d.reglas?.trim() ? d.reglas.trim() : null,
      disponible_desde: d.disponible_desde,
      estado: d.estado,
    };

    let inmuebleId = d.id;

    if (inmuebleId) {
      const { error: updError } = await supabase
        .from("inmuebles")
        .update(rowPayload)
        .eq("id", inmuebleId)
        .eq("arrendador_id", user.id);

      if (updError) {
        return {
          ok: false,
          error: "No se pudo actualizar el inmueble.",
        };
      }
    } else {
      const { data: insertado, error: insError } = await supabase
        .from("inmuebles")
        .insert(rowPayload)
        .select("id")
        .single();

      if (insError || !insertado) {
        return {
          ok: false,
          error: "No se pudo registrar el inmueble en la base de datos.",
        };
      }
      inmuebleId = insertado.id;
    }

    if (d.rutas_fotos && d.rutas_fotos.length > 0 && inmuebleId) {
      const { data: actuales } = await supabase
        .from("fotos_inmueble")
        .select("ruta_storage, orden")
        .eq("inmueble_id", inmuebleId);

      const existentesSet = new Set(
        (actuales ?? []).map((f) => f.ruta_storage)
      );
      let ordenBase = (actuales ?? []).length;

      const nuevas = d.rutas_fotos
        .filter((ruta) => !existentesSet.has(ruta))
        .map((ruta) => ({
          inmueble_id: inmuebleId!,
          ruta_storage: ruta,
          orden: ordenBase++,
        }));

      if (nuevas.length > 0) {
        await supabase.from("fotos_inmueble").insert(nuevas);
      }
    }

    revalidatePath("/mis-inmuebles");
    revalidatePath("/explorar");
    if (inmuebleId) {
      revalidatePath(`/inmuebles/${inmuebleId}`);
    }

    return {
      ok: true,
      inmuebleId,
      message: d.id
        ? "Inmueble actualizado correctamente."
        : "Inmueble guardado correctamente.",
    };
  } catch {
    return {
      ok: false,
      error: "Ocurrió un error al guardar el inmueble.",
    };
  }
}

export async function cambiarEstadoInmuebleAction(
  inmuebleId: string,
  nuevoEstado: EstadoInmueble
): Promise<InmuebleMutationResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Sesión expirada." };
    }

    const { error } = await supabase
      .from("inmuebles")
      .update({ estado: nuevoEstado })
      .eq("id", inmuebleId)
      .eq("arrendador_id", user.id);

    if (error) {
      return { ok: false, error: "No se pudo cambiar el estado del inmueble." };
    }

    revalidatePath("/mis-inmuebles");
    revalidatePath("/explorar");
    revalidatePath(`/inmuebles/${inmuebleId}`);

    return {
      ok: true,
      inmuebleId,
      message: `Estado actualizado a "${nuevoEstado}".`,
    };
  } catch {
    return { ok: false, error: "Error de conexión al actualizar estado." };
  }
}

export async function registrarSwipeAction(rawInput: {
  inmueble_id?: string | null;
  perfil_objetivo_id?: string | null;
  decision: DecisionSwipe;
}): Promise<SwipeResult> {
  const parsed = swipeInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ?? "Datos de evaluación no válidos.",
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
        error: "Inicia sesión para guardar tus favoritos y hacer match.",
      };
    }

    const inmuebleId = parsed.data.inmueble_id ?? null;
    const objetivoId = parsed.data.perfil_objetivo_id ?? null;

    // Verificar si ya existe un swipe idéntico para actualizar o insertar
    let queryExistente = supabase
      .from("swipes")
      .select("id")
      .eq("autor_id", user.id);

    queryExistente = inmuebleId
      ? queryExistente.eq("inmueble_id", inmuebleId)
      : queryExistente.is("inmueble_id", null);

    queryExistente = objetivoId
      ? queryExistente.eq("perfil_objetivo_id", objetivoId)
      : queryExistente.is("perfil_objetivo_id", null);

    const { data: previo } = await queryExistente.maybeSingle();

    if (previo) {
      const { error: updErr } = await supabase
        .from("swipes")
        .update({ decision: parsed.data.decision })
        .eq("id", previo.id);
      if (updErr) {
        return { ok: false, error: "No se pudo actualizar tu decisión." };
      }
    } else {
      const { error: insErr } = await supabase.from("swipes").insert({
        autor_id: user.id,
        inmueble_id: inmuebleId,
        perfil_objetivo_id: objetivoId,
        decision: parsed.data.decision,
      });
      if (insErr) {
        return { ok: false, error: "No se pudo registrar tu decisión." };
      }
    }

    if (parsed.data.decision !== "me_interesa") {
      revalidatePath("/explorar");
      revalidatePath("/roomies");
      revalidatePath("/mis-inmuebles");
      return { ok: true, match: null };
    }

    // Si fue "me_interesa", verificar si el trigger trg_swipes_match creó un match activo
    if (objetivoId && !inmuebleId) {
      const [minId, maxId] =
        user.id < objetivoId ? [user.id, objetivoId] : [objetivoId, user.id];
      const { data: matchRoomie } = await supabase
        .from("matches")
        .select("id, tipo, compatibilidad")
        .eq("tipo", "roomies")
        .eq("perfil_a_id", minId)
        .eq("perfil_b_id", maxId)
        .maybeSingle();

      if (matchRoomie) {
        const { data: otroPerfil } = await supabase
          .from("perfiles")
          .select("nombre, apellidos")
          .eq("id", objetivoId)
          .maybeSingle();

        const nombreOtro = otroPerfil
          ? `${otroPerfil.nombre} ${otroPerfil.apellidos}`.trim()
          : "Tu nuevo roomie";

        revalidatePath("/roomies");
        revalidatePath("/perfil");
        return {
          ok: true,
          match: {
            matchId: matchRoomie.id,
            tipo: "roomies",
            contraparteNombre: nombreOtro,
            contraparteIniciales: obtenerIniciales(
              otroPerfil?.nombre ?? "RM",
              otroPerfil?.apellidos
            ),
            compatibilidad: matchRoomie.compatibilidad,
          },
        };
      }
    } else if (inmuebleId) {
      // Match estudiante-inmueble (disparado por estudiante o por arrendador)
      const { data: inmuebleData } = await supabase
        .from("inmuebles")
        .select("id, titulo, renta_mensual, capacidad, arrendador_id")
        .eq("id", inmuebleId)
        .maybeSingle();

      if (inmuebleData) {
        const estudianteId = objetivoId ?? user.id;
        const arrendadorId = inmuebleData.arrendador_id;
        const { data: matchInm } = await supabase
          .from("matches")
          .select("id, tipo")
          .eq("tipo", "estudiante_inmueble")
          .eq("perfil_a_id", estudianteId)
          .eq("perfil_b_id", arrendadorId)
          .eq("inmueble_id", inmuebleId)
          .maybeSingle();

        if (matchInm) {
          const contraparteId =
            user.id === arrendadorId ? estudianteId : arrendadorId;
          const { data: contraparte } = await supabase
            .from("perfiles")
            .select("nombre, apellidos")
            .eq("id", contraparteId)
            .maybeSingle();

          const nombreContra = contraparte
            ? `${contraparte.nombre} ${contraparte.apellidos}`.trim()
            : "Arrendador verificado";

          revalidatePath("/explorar");
          revalidatePath("/mis-inmuebles");
          revalidatePath(`/inmuebles/${inmuebleId}`);

          return {
            ok: true,
            match: {
              matchId: matchInm.id,
              tipo: "estudiante_inmueble",
              contraparteNombre: nombreContra,
              contraparteIniciales: obtenerIniciales(
                contraparte?.nombre ?? "OT",
                contraparte?.apellidos
              ),
              inmuebleTitulo: inmuebleData.titulo,
              rentaPorPersona: Math.round(
                Number(inmuebleData.renta_mensual) /
                  Math.max(1, inmuebleData.capacidad)
              ),
            },
          };
        }
      }
    }

    revalidatePath("/explorar");
    revalidatePath("/roomies");
    revalidatePath("/mis-inmuebles");
    return { ok: true, match: null };
  } catch {
    return {
      ok: false,
      error: "Error de red al guardar tu evaluación.",
    };
  }
}
