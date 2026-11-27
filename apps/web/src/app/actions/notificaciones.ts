"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Notificacion } from "@/types/database";

const idNotificacionSchema = z.number().int().positive();

export interface NotificacionesResult {
  ok: boolean;
  notificaciones?: Notificacion[];
  noLeidas?: number;
  error?: string;
}

export async function listarNotificacionesAction(
  limite = 25
): Promise<NotificacionesResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Inicia sesión para consultar tus notificaciones." };
    }

    const limiteSeguro = Math.min(Math.max(limite, 1), 100);

    const [listaRes, noLeidasRes] = await Promise.all([
      supabase
        .from("notificaciones")
        .select("*")
        .eq("perfil_id", user.id)
        .order("creado_en", { ascending: false })
        .limit(limiteSeguro),
      supabase
        .from("notificaciones")
        .select("*", { count: "exact", head: true })
        .eq("perfil_id", user.id)
        .eq("leida", false),
    ]);

    if (listaRes.error) {
      return { ok: false, error: "No fue posible cargar las notificaciones." };
    }

    return {
      ok: true,
      notificaciones: (listaRes.data ?? []) as Notificacion[],
      noLeidas: noLeidasRes.count ?? 0,
    };
  } catch {
    return { ok: false, error: "Error de conexión al consultar notificaciones." };
  }
}

export async function marcarNotificacionLeidaAction(
  notificacionId: number
): Promise<{ ok: boolean; error?: string }> {
  const parsed = idNotificacionSchema.safeParse(notificacionId);
  if (!parsed.success) {
    return { ok: false, error: "Identificador de notificación no válido." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Sesión expirada." };
    }

    const { error } = await supabase
      .from("notificaciones")
      .update({ leida: true })
      .eq("id", parsed.data)
      .eq("perfil_id", user.id);

    if (error) {
      return { ok: false, error: "No se pudo actualizar la notificación." };
    }

    revalidatePath("/notificaciones");
    return { ok: true };
  } catch {
    return { ok: false, error: "Error inesperado al marcar como leída." };
  }
}

export async function marcarTodasNotificacionesLeidasAction(): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Sesión expirada." };
    }

    const { error } = await supabase
      .from("notificaciones")
      .update({ leida: true })
      .eq("perfil_id", user.id)
      .eq("leida", false);

    if (error) {
      return { ok: false, error: "No se pudieron marcar las notificaciones." };
    }

    revalidatePath("/notificaciones");
    return { ok: true };
  } catch {
    return { ok: false, error: "Error inesperado al actualizar notificaciones." };
  }
}
