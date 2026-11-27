import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { obtenerIniciales } from "@/components/otoch/avatar";
import {
  cargarInmueblesPublicados,
  cargarUniversidadesConCoords,
} from "@/lib/inmuebles-queries";
import { createClient } from "@/lib/supabase/server";
import { obtenerUsuarioServidor } from "@/lib/supabase/session";
import type { RolUsuario } from "@/types/database";
import { ExplorarClient } from "./explorar-client";

export const metadata: Metadata = {
  title: "Explorar inmuebles · Otoch",
};

export default async function ExplorarPage() {
  const user = await obtenerUsuarioServidor();
  if (!user) {
    redirect("/login?next=/explorar");
  }

  const supabase = await createClient();

  const [
    { data: perfil },
    { data: estudiante },
    { data: misSwipesInmuebles },
    universidades,
    inmueblesPublicados,
  ] = await Promise.all([
    supabase
      .from("perfiles")
      .select("id, rol, nombre, apellidos")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("perfiles_estudiante")
      .select("universidad_id, presupuesto_max")
      .eq("perfil_id", user.id)
      .maybeSingle(),
    supabase
      .from("swipes")
      .select("inmueble_id")
      .eq("autor_id", user.id)
      .is("perfil_objetivo_id", null)
      .not("inmueble_id", "is", null),
    cargarUniversidadesConCoords(supabase),
    cargarInmueblesPublicados(supabase),
  ]);

  if (!perfil) {
    redirect("/onboarding");
  }

  const yaEvaluadosSet = new Set(
    (misSwipesInmuebles ?? [])
      .map((s) => s.inmueble_id)
      .filter((id): id is string => Boolean(id))
  );

  const disponibles = inmueblesPublicados.filter(
    (inm) => inm.arrendador_id !== user.id && !yaEvaluadosSet.has(inm.id)
  );

  return (
    <ExplorarClient
      usuarioIniciales={obtenerIniciales(perfil.nombre, perfil.apellidos)}
      rolUsuario={perfil.rol as RolUsuario}
      universidadPreferidaId={estudiante?.universidad_id ?? null}
      presupuestoEstudiante={
        estudiante ? Number(estudiante.presupuesto_max) : null
      }
      universidades={universidades}
      inmueblesIniciales={disponibles}
    />
  );
}
