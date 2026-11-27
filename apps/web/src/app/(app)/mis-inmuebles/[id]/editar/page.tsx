import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { InmuebleForm } from "@/components/otoch/inmueble-form";
import { parsearPuntoPostGIS } from "@/lib/geo";
import { createClient } from "@/lib/supabase/server";
import type { EstadoInmueble, TipoInmueble } from "@/types/database";

export const metadata: Metadata = {
  title: "Editar inmueble · Otoch",
};

interface EditarInmueblePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarInmueblePage({
  params,
}: EditarInmueblePageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/mis-inmuebles/${id}/editar`);
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, rol")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil || perfil.rol !== "arrendador") {
    redirect("/explorar");
  }

  const [{ data: inm }, { data: fotos }] = await Promise.all([
    supabase
      .from("inmuebles")
      .select("*")
      .eq("id", id)
      .eq("arrendador_id", user.id)
      .maybeSingle(),
    supabase
      .from("fotos_inmueble")
      .select("ruta_storage, orden")
      .eq("inmueble_id", id)
      .order("orden", { ascending: true }),
  ]);

  if (!inm) {
    notFound();
  }

  const coords = parsearPuntoPostGIS(inm.ubicacion, inm.colonia);

  return (
    <InmuebleForm
      userId={user.id}
      initialValues={{
        id: inm.id,
        titulo: inm.titulo,
        descripcion: inm.descripcion ?? "",
        tipo: inm.tipo as TipoInmueble,
        colonia: inm.colonia,
        direccion_privada: inm.direccion_privada ?? "",
        lat: coords.lat,
        lng: coords.lng,
        renta_mensual: Number(inm.renta_mensual),
        deposito: Number(inm.deposito),
        capacidad: inm.capacidad,
        habitaciones: inm.habitaciones,
        banos: Number(inm.banos),
        amueblado: inm.amueblado,
        servicios_incluidos: inm.servicios_incluidos ?? [],
        reglas: inm.reglas ?? "",
        disponible_desde: inm.disponible_desde,
        estado: inm.estado as EstadoInmueble,
        rutas_fotos_existentes: (fotos ?? []).map((f) => f.ruta_storage),
      }}
    />
  );
}
