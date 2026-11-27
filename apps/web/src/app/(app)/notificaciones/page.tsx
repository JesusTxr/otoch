import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { obtenerUsuarioServidor } from "@/lib/supabase/session";
import type { Notificacion } from "@/types/database";
import { NotificacionesClient } from "./notificaciones-client";

export const metadata: Metadata = {
  title: "Notificaciones · Otoch",
};

export default async function NotificacionesPage() {
  const user = await obtenerUsuarioServidor();
  if (!user) {
    redirect("/login?next=/notificaciones");
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("notificaciones")
    .select("*")
    .eq("perfil_id", user.id)
    .order("creado_en", { ascending: false })
    .limit(60);

  return (
    <NotificacionesClient
      usuarioId={user.id}
      notificacionesIniciales={(data ?? []) as Notificacion[]}
    />
  );
}
