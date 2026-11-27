import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { obtenerIniciales } from "@/components/otoch/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { obtenerGaleriaInmueble } from "@/lib/inmuebles-media";
import { createClient } from "@/lib/supabase/server";
import type { EstadoInmueble, TipoInmueble } from "@/types/database";
import {
  MisInmueblesClient,
  type EstudianteInteresadoItem,
  type PropiedadArrendadorItem,
} from "./mis-inmuebles-client";

export const metadata: Metadata = {
  title: "Mis inmuebles · Otoch",
};

interface MisInmueblesPageProps {
  searchParams: Promise<{ guardado?: string }>;
}

export default async function MisInmueblesPage({
  searchParams,
}: MisInmueblesPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/mis-inmuebles");
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, rol, nombre, apellidos")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil) {
    redirect("/onboarding");
  }

  if (perfil.rol !== "arrendador") {
    return (
      <Card className="mx-auto max-w-[560px] items-start gap-4 rounded-xl p-8">
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-primary-soft px-3 py-1 text-etiqueta font-semibold text-primary-strong">
          <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
          Sección para arrendadores
        </span>
        <h1 className="text-titulo-1 text-foreground">
          Solo los arrendadores pueden administrar propiedades
        </h1>
        <p className="text-cuerpo text-text-secondary">
          Como estudiante puedes explorar inmuebles publicados y conectar con
          roomies compatibles.
        </p>
        <Button asChild>
          <Link href="/explorar">Ir a Explorar</Link>
        </Button>
      </Card>
    );
  }

  const [params, { data: misInmuebles }, { data: misDecisiones }, { data: misMatches }] =
    await Promise.all([
      searchParams,
      supabase
        .from("inmuebles")
        .select(
          "id, titulo, colonia, tipo, renta_mensual, capacidad, habitaciones, estado, disponible_desde, creado_en"
        )
        .eq("arrendador_id", user.id)
        .order("creado_en", { ascending: false }),
      supabase
        .from("swipes")
        .select("inmueble_id, perfil_objetivo_id, decision")
        .eq("autor_id", user.id)
        .not("perfil_objetivo_id", "is", null),
      supabase
        .from("matches")
        .select("inmueble_id, perfil_a_id")
        .eq("tipo", "estudiante_inmueble")
        .eq("perfil_b_id", user.id)
        .eq("estado", "activo"),
    ]);

  const listaInmuebles = misInmuebles ?? [];
  const inmuebleIds = listaInmuebles.map((i) => i.id);

  // Fotos y swipes de estudiantes sobre los inmuebles del arrendador
  const [fotosRes, swipesEstudiantesRes] =
    inmuebleIds.length > 0
      ? await Promise.all([
          supabase
            .from("fotos_inmueble")
            .select("inmueble_id, ruta_storage, orden")
            .in("inmueble_id", inmuebleIds)
            .order("orden", { ascending: true }),
          supabase
            .from("swipes")
            .select("id, autor_id, inmueble_id, decision, creado_en")
            .in("inmueble_id", inmuebleIds)
            .is("perfil_objetivo_id", null)
            .eq("decision", "me_interesa")
            .neq("autor_id", user.id)
            .order("creado_en", { ascending: false }),
        ])
      : [{ data: [] }, { data: [] }];

  const fotosPorInmueble = new Map<string, string[]>();
  for (const f of fotosRes.data ?? []) {
    const arr = fotosPorInmueble.get(f.inmueble_id) ?? [];
    arr.push(f.ruta_storage);
    fotosPorInmueble.set(f.inmueble_id, arr);
  }

  const decisionesArrendadorMap = new Map<
    string,
    "me_interesa" | "descartar"
  >();
  for (const s of misDecisiones ?? []) {
    if (s.inmueble_id && s.perfil_objetivo_id) {
      decisionesArrendadorMap.set(
        `${s.inmueble_id}:${s.perfil_objetivo_id}`,
        s.decision as "me_interesa" | "descartar"
      );
    }
  }

  const matchesSet = new Set(
    (misMatches ?? []).map((m) => `${m.inmueble_id}:${m.perfil_a_id}`)
  );

  const swipesEst = swipesEstudiantesRes.data ?? [];
  const estudianteIds = Array.from(new Set(swipesEst.map((s) => s.autor_id)));

  const [perfilesEstRes, acadEstRes, unisRes] =
    estudianteIds.length > 0
      ? await Promise.all([
          supabase
            .from("perfiles")
            .select("id, nombre, apellidos, estado_verificacion")
            .in("id", estudianteIds),
          supabase
            .from("perfiles_estudiante")
            .select("perfil_id, universidad_id, carrera, presupuesto_max")
            .in("perfil_id", estudianteIds),
          supabase.from("universidades").select("id, siglas"),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }];

  const perfilMap = new Map(
    (perfilesEstRes.data ?? []).map((p) => [p.id, p])
  );
  const acadMap = new Map(
    (acadEstRes.data ?? []).map((a) => [a.perfil_id, a])
  );
  const uniSiglasMap = new Map(
    (unisRes.data ?? []).map((u) => [u.id, u.siglas ?? "Mérida"])
  );
  const tituloInmMap = new Map(listaInmuebles.map((i) => [i.id, i.titulo]));

  const interesados: EstudianteInteresadoItem[] = swipesEst
    .filter((s) => Boolean(s.inmueble_id))
    .map((s) => {
      const p = perfilMap.get(s.autor_id);
      const acad = acadMap.get(s.autor_id);
      const key = `${s.inmueble_id}:${s.autor_id}`;
      const nombre = p ? `${p.nombre} ${p.apellidos}`.trim() : "Estudiante";
      return {
        swipeId: s.id,
        inmuebleId: s.inmueble_id!,
        inmuebleTitulo: tituloInmMap.get(s.inmueble_id!) ?? "Propiedad",
        estudianteId: s.autor_id,
        nombreCompleto: nombre,
        iniciales: obtenerIniciales(p?.nombre ?? "ES", p?.apellidos),
        carrera: acad?.carrera ?? "Estudiante universitario",
        universidadSiglas: acad?.universidad_id
          ? (uniSiglasMap.get(acad.universidad_id) ?? "Mérida")
          : "Mérida",
        presupuestoMax: acad ? Number(acad.presupuesto_max) : null,
        verificado: p?.estado_verificacion === "verificado",
        yaEvaluadoDecision: decisionesArrendadorMap.get(key) ?? null,
        esMatchActivo: matchesSet.has(key),
      };
    });

  const propiedades: PropiedadArrendadorItem[] = listaInmuebles.map((inm) => {
    const rutas = fotosPorInmueble.get(inm.id) ?? [];
    const galeria = obtenerGaleriaInmueble(rutas, inm.tipo as TipoInmueble);
    const nuevos = interesados.filter(
      (x) => x.inmuebleId === inm.id && !x.yaEvaluadoDecision
    ).length;

    return {
      id: inm.id,
      titulo: inm.titulo,
      colonia: inm.colonia,
      tipo: inm.tipo,
      renta_mensual: Number(inm.renta_mensual),
      capacidad: inm.capacidad,
      habitaciones: inm.habitaciones,
      estado: inm.estado as EstadoInmueble,
      disponible_desde: inm.disponible_desde,
      fotoPortada: galeria[0],
      interesadosPendientes: nuevos,
    };
  });

  return (
    <MisInmueblesClient
      arrendadorIniciales={obtenerIniciales(perfil.nombre, perfil.apellidos)}
      guardadoReciente={params.guardado === "1"}
      propiedades={propiedades}
      interesados={interesados}
    />
  );
}
