import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { obtenerUsuarioServidor } from "@/lib/supabase/session";
import type {
  Municipio,
  Perfil,
  PerfilArrendador,
  PerfilEstudiante,
  PreferenciasConvivencia,
  Universidad,
  Verificacion,
} from "@/types/database";
import { PerfilClient } from "./perfil-client";

export const metadata: Metadata = {
  title: "Mi perfil · Otoch",
};

interface PerfilPageProps {
  searchParams: Promise<{ bienvenida?: string }>;
}

export default async function PerfilPage({ searchParams }: PerfilPageProps) {
  const user = await obtenerUsuarioServidor();
  if (!user) {
    redirect("/login?next=/perfil");
  }

  const supabase = await createClient();

  // Todas las consultas independientes corren en un único bloque paralelo
  const [
    params,
    perfilRes,
    estRes,
    prefRes,
    arrRes,
    uniRes,
    munRes,
    verifRes,
    circulosCountRes,
    matchesCountRes,
    inmueblesCountRes,
  ] = await Promise.all([
    searchParams,
    supabase.from("perfiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("perfiles_estudiante")
      .select("*")
      .eq("perfil_id", user.id)
      .maybeSingle(),
    supabase
      .from("preferencias_convivencia")
      .select("*")
      .eq("perfil_id", user.id)
      .maybeSingle(),
    supabase
      .from("perfiles_arrendador")
      .select("*")
      .eq("perfil_id", user.id)
      .maybeSingle(),
    supabase
      .from("universidades")
      .select("id, nombre, siglas, campus, dominio_correo, activa")
      .eq("activa", true)
      .order("siglas", { ascending: true }),
    supabase
      .from("municipios")
      .select("id, clave_inegi, nombre, distancia_merida_km")
      .order("nombre", { ascending: true }),
    supabase
      .from("verificaciones")
      .select("*")
      .eq("perfil_id", user.id)
      .order("creado_en", { ascending: false }),
    supabase
      .from("miembros_circulo")
      .select("*", { count: "exact", head: true })
      .eq("perfil_id", user.id)
      .eq("estado", "activo"),
    supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .or(`perfil_a_id.eq.${user.id},perfil_b_id.eq.${user.id}`)
      .eq("estado", "activo"),
    supabase
      .from("inmuebles")
      .select("*", { count: "exact", head: true })
      .eq("arrendador_id", user.id),
  ]);

  if (!perfilRes.data) {
    redirect("/onboarding");
  }

  return (
    <PerfilClient
      email={user.email ?? ""}
      bienvenida={params.bienvenida === "1"}
      perfil={perfilRes.data as Perfil}
      estudiante={(estRes.data as PerfilEstudiante | null) ?? null}
      preferencias={(prefRes.data as PreferenciasConvivencia | null) ?? null}
      arrendador={(arrRes.data as PerfilArrendador | null) ?? null}
      universidades={(uniRes.data ?? []) as Universidad[]}
      municipios={(munRes.data ?? []) as Municipio[]}
      verificaciones={(verifRes.data ?? []) as Verificacion[]}
      metricas={{
        circulos: circulosCountRes.count ?? 0,
        matches: matchesCountRes.count ?? 0,
        inmuebles: inmueblesCountRes.count ?? 0,
      }}
    />
  );
}
