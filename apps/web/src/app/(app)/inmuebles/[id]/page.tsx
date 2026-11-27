import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { obtenerIniciales } from "@/components/otoch/avatar";
import {
  cargarInmueblePorId,
  cargarUniversidadesConCoords,
  hidratarInmueblesConDetalle,
} from "@/lib/inmuebles-queries";
import { createClient } from "@/lib/supabase/server";
import type { DecisionSwipe } from "@/types/database";
import { DetalleInmuebleClient } from "./detalle-inmueble-client";

export const metadata: Metadata = {
  title: "Detalle de inmueble · Otoch",
};

interface DetalleInmueblePageProps {
  params: Promise<{ id: string }>;
}

export default async function DetalleInmueblePage({
  params,
}: DetalleInmueblePageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/inmuebles/${id}`);
  }

  const [{ data: perfil }, universidades] = await Promise.all([
    supabase
      .from("perfiles")
      .select("id, nombre, apellidos")
      .eq("id", user.id)
      .maybeSingle(),
    cargarUniversidadesConCoords(supabase),
  ]);

  if (!perfil) {
    redirect("/onboarding");
  }

  let inmueble = await cargarInmueblePorId(supabase, id);

  // Si no está publicado pero pertenece al propio arrendador, permitir previsualización
  if (!inmueble) {
    const { data: propio } = await supabase
      .from("inmuebles")
      .select("*")
      .eq("id", id)
      .eq("arrendador_id", user.id)
      .maybeSingle();

    if (propio) {
      const lista = await hidratarInmueblesConDetalle(supabase, [
        propio as Record<string, unknown>,
      ]);
      inmueble = lista[0] ?? null;
    }
  }

  if (!inmueble) {
    notFound();
  }

  const { data: swipePrevio } = await supabase
    .from("swipes")
    .select("decision")
    .eq("autor_id", user.id)
    .eq("inmueble_id", id)
    .is("perfil_objetivo_id", null)
    .maybeSingle();

  return (
    <DetalleInmuebleClient
      inmueble={inmueble}
      universidades={universidades}
      usuarioIniciales={obtenerIniciales(perfil.nombre, perfil.apellidos)}
      esPropietario={inmueble.arrendador_id === user.id}
      decisionInicial={(swipePrevio?.decision as DecisionSwipe | undefined) ?? null}
    />
  );
}
