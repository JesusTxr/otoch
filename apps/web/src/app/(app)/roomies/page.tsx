import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { obtenerIniciales } from "@/components/otoch/avatar";
import {
  calcularCompatibilidadRoomies,
  calcularEdadDesdeFecha,
} from "@/lib/compatibilidad";
import { createClient } from "@/lib/supabase/server";
import type {
  Genero,
  PreferenciasConvivencia,
  RoomieCandidato,
  Universidad,
} from "@/types/database";
import { RoomiesClient } from "./roomies-client";

export const metadata: Metadata = {
  title: "Roomies compatibles · Otoch",
};

interface RoomiesPageProps {
  searchParams: Promise<{ inmueble?: string }>;
}

export default async function RoomiesPage({ searchParams }: RoomiesPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/roomies");
  }

  const [
    params,
    { data: miPerfil },
    { data: miEst },
    { data: misPref },
    { data: misSwipesRoomies },
    { data: otrosEstudiantes },
    { data: universidades },
    { data: municipios },
  ] = await Promise.all([
    searchParams,
    supabase
      .from("perfiles")
      .select("id, nombre, apellidos, genero")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("perfiles_estudiante")
      .select("presupuesto_max")
      .eq("perfil_id", user.id)
      .maybeSingle(),
    supabase
      .from("preferencias_convivencia")
      .select("*")
      .eq("perfil_id", user.id)
      .maybeSingle(),
    supabase
      .from("swipes")
      .select("perfil_objetivo_id")
      .eq("autor_id", user.id)
      .is("inmueble_id", null)
      .not("perfil_objetivo_id", "is", null),
    supabase
      .from("perfiles_estudiante")
      .select(
        "perfil_id, universidad_id, municipio_origen_id, carrera, periodo_actual, presupuesto_max, fecha_mudanza, busca_roomies, max_roomies"
      )
      .eq("busca_roomies", true)
      .neq("perfil_id", user.id),
    supabase
      .from("universidades")
      .select("id, nombre, siglas, campus, dominio_correo, activa")
      .eq("activa", true)
      .order("siglas", { ascending: true }),
    supabase.from("municipios").select("id, nombre"),
  ]);

  if (!miPerfil) {
    redirect("/onboarding");
  }

  let inmuebleContextoTitulo: string | null = null;
  if (params.inmueble) {
    const { data: inm } = await supabase
      .from("inmuebles")
      .select("titulo")
      .eq("id", params.inmueble)
      .maybeSingle();
    inmuebleContextoTitulo = inm?.titulo ?? null;
  }

  const yaEvaluadosSet = new Set(
    (misSwipesRoomies ?? [])
      .map((s) => s.perfil_objetivo_id)
      .filter((id): id is string => Boolean(id))
  );

  const candidatosEst = (otrosEstudiantes ?? []).filter(
    (e) => !yaEvaluadosSet.has(e.perfil_id)
  );
  const candidatoIds = candidatosEst.map((e) => e.perfil_id);

  const [perfilesRes, prefsRes] =
    candidatoIds.length > 0
      ? await Promise.all([
          supabase
            .from("perfiles")
            .select(
              "id, nombre, apellidos, fecha_nacimiento, genero, biografia, estado_verificacion"
            )
            .in("id", candidatoIds)
            .is("eliminado_en", null),
          supabase
            .from("preferencias_convivencia")
            .select("*")
            .in("perfil_id", candidatoIds),
        ])
      : [{ data: [] }, { data: [] }];

  const perfilMap = new Map((perfilesRes.data ?? []).map((p) => [p.id, p]));
  const prefMap = new Map(
    (prefsRes.data ?? []).map((pr) => [
      pr.perfil_id,
      pr as PreferenciasConvivencia,
    ])
  );
  const uniMap = new Map(
    (universidades ?? []).map((u) => [u.id, u.siglas ?? u.nombre])
  );
  const munMap = new Map((municipios ?? []).map((m) => [m.id, m.nombre]));

  const misPreferencias = (misPref as PreferenciasConvivencia | null) ?? null;
  const miPresupuesto = miEst ? Number(miEst.presupuesto_max) : null;

  const candidatos: RoomieCandidato[] = [];

  for (const est of candidatosEst) {
    const p = perfilMap.get(est.perfil_id);
    const pr = prefMap.get(est.perfil_id);
    if (!p || !pr) continue;

    // Respetar preferencia de mismo género si alguno la activó y ambos indicaron género
    if (
      misPreferencias?.preferencia_roomie === "mismo_genero" &&
      miPerfil.genero &&
      p.genero &&
      miPerfil.genero !== p.genero
    ) {
      continue;
    }
    if (
      pr.preferencia_roomie === "mismo_genero" &&
      p.genero &&
      miPerfil.genero &&
      p.genero !== miPerfil.genero
    ) {
      continue;
    }

    const compat = calcularCompatibilidadRoomies(
      misPreferencias,
      pr,
      miPresupuesto,
      Number(est.presupuesto_max)
    );

    candidatos.push({
      perfilId: est.perfil_id,
      nombre: p.nombre,
      apellidos: p.apellidos,
      iniciales: obtenerIniciales(p.nombre, p.apellidos),
      edad: calcularEdadDesdeFecha(p.fecha_nacimiento),
      genero: (p.genero as Genero | null) ?? null,
      biografia: p.biografia,
      verificado: p.estado_verificacion === "verificado",
      universidadId: est.universidad_id,
      universidadSiglas: uniMap.get(est.universidad_id) ?? "Mérida",
      municipioOrigen: est.municipio_origen_id
        ? (munMap.get(est.municipio_origen_id) ?? null)
        : null,
      carrera: est.carrera ?? "Estudiante universitario",
      periodoActual: est.periodo_actual,
      presupuestoMax: Number(est.presupuesto_max),
      fechaMudanza: est.fecha_mudanza,
      maxRoomies: est.max_roomies,
      preferencias: pr,
      compatibilidadTotal: compat.total,
      desglose: {
        horarios: compat.horarios,
        limpieza: compat.limpieza,
        presupuesto: compat.presupuesto,
        ruidoVisitas: compat.ruidoVisitas,
        mascotas: compat.mascotas,
      },
    });
  }

  candidatos.sort((a, b) => b.compatibilidadTotal - a.compatibilidadTotal);

  return (
    <RoomiesClient
      usuarioIniciales={obtenerIniciales(miPerfil.nombre, miPerfil.apellidos)}
      inmuebleContextoTitulo={inmuebleContextoTitulo}
      candidatosIniciales={candidatos}
      universidades={(universidades ?? []) as Universidad[]}
    />
  );
}
