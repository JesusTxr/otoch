import type { SupabaseClient } from "@supabase/supabase-js";
import { obtenerIniciales } from "@/components/otoch/avatar";
import { parsearPuntoPostGIS } from "@/lib/geo";
import { obtenerGaleriaInmueble } from "@/lib/inmuebles-media";
import type {
  Coordenadas,
  EstadoInmueble,
  InmuebleConDetalle,
  TipoInmueble,
  Universidad,
} from "@/types/database";

export interface UniversidadConCoords extends Universidad {
  coordenadas: Coordenadas;
}

const COLUMNAS_PUBLICAS_INMUEBLE =
  "id, arrendador_id, titulo, descripcion, tipo, colonia, ubicacion, renta_mensual, deposito, capacidad, habitaciones, banos, amueblado, servicios_incluidos, reglas, disponible_desde, estado, creado_en, actualizado_en";

export async function cargarUniversidadesConCoords(
  supabase: SupabaseClient
): Promise<UniversidadConCoords[]> {
  const { data } = await supabase
    .from("universidades")
    .select("id, nombre, siglas, campus, dominio_correo, ubicacion, activa")
    .eq("activa", true)
    .order("siglas", { ascending: true });

  return (data ?? []).map((u) => ({
    id: u.id,
    nombre: u.nombre,
    siglas: u.siglas,
    campus: u.campus,
    dominio_correo: u.dominio_correo,
    ubicacion: u.ubicacion,
    activa: u.activa,
    coordenadas: parsearPuntoPostGIS(u.ubicacion),
  }));
}

export async function hidratarInmueblesConDetalle(
  supabase: SupabaseClient,
  filas: Record<string, unknown>[]
): Promise<InmuebleConDetalle[]> {
  if (filas.length === 0) return [];

  const inmuebleIds = filas.map((r) => String(r.id));
  const arrendadorIds = Array.from(
    new Set(filas.map((r) => String(r.arrendador_id)))
  );

  const [fotosRes, perfilesArrRes, datosArrRes] = await Promise.all([
    supabase
      .from("fotos_inmueble")
      .select("inmueble_id, ruta_storage, orden")
      .in("inmueble_id", inmuebleIds)
      .order("orden", { ascending: true }),
    supabase
      .from("perfiles")
      .select("id, nombre, apellidos, estado_verificacion")
      .in("id", arrendadorIds),
    supabase
      .from("perfiles_arrendador")
      .select(
        "perfil_id, tipo, nombre_comercial, identidad_verificada, propiedad_verificada"
      )
      .in("perfil_id", arrendadorIds),
  ]);

  const fotosMap = new Map<string, string[]>();
  for (const f of fotosRes.data ?? []) {
    const lista = fotosMap.get(f.inmueble_id) ?? [];
    lista.push(f.ruta_storage);
    fotosMap.set(f.inmueble_id, lista);
  }

  const perfilMap = new Map(
    (perfilesArrRes.data ?? []).map((p) => [p.id, p])
  );
  const arrMap = new Map(
    (datosArrRes.data ?? []).map((a) => [a.perfil_id, a])
  );

  return filas.map((raw) => {
    const id = String(raw.id);
    const arrendadorId = String(raw.arrendador_id);
    const tipo = (raw.tipo as TipoInmueble) ?? "casa";
    const colonia = String(raw.colonia ?? "Mérida");
    const rentaMensual = Number(raw.renta_mensual ?? 0);
    const capacidad = Math.max(1, Number(raw.capacidad ?? 1));

    const p = perfilMap.get(arrendadorId);
    const arr = arrMap.get(arrendadorId);

    const nombreArrendador =
      arr?.tipo === "inmobiliaria" && arr.nombre_comercial
        ? arr.nombre_comercial
        : p
          ? `${p.nombre} ${p.apellidos}`.trim()
          : "Arrendador en Otoch";

    const verificado =
      p?.estado_verificacion === "verificado" ||
      Boolean(arr?.identidad_verificada) ||
      Boolean(arr?.propiedad_verificada);

    const rutas = fotosMap.get(id) ?? [];

    return {
      id,
      arrendador_id: arrendadorId,
      titulo: String(raw.titulo ?? "Inmueble en Mérida"),
      descripcion: (raw.descripcion as string | null) ?? null,
      tipo,
      colonia,
      ubicacion: raw.ubicacion,
      renta_mensual: rentaMensual,
      deposito: Number(raw.deposito ?? 0),
      capacidad,
      habitaciones: Number(raw.habitaciones ?? 1),
      banos: Number(raw.banos ?? 1),
      amueblado: Boolean(raw.amueblado),
      servicios_incluidos: Array.isArray(raw.servicios_incluidos)
        ? (raw.servicios_incluidos as string[])
        : [],
      reglas: (raw.reglas as string | null) ?? null,
      disponible_desde: String(raw.disponible_desde ?? ""),
      estado: (raw.estado as EstadoInmueble) ?? "publicado",
      creado_en: String(raw.creado_en ?? ""),
      actualizado_en: String(raw.actualizado_en ?? ""),
      coordenadas: parsearPuntoPostGIS(raw.ubicacion, colonia),
      fotosUrls: obtenerGaleriaInmueble(rutas, tipo),
      rentaPorPersona: Math.round(rentaMensual / capacidad),
      arrendadorNombre: nombreArrendador,
      arrendadorIniciales: obtenerIniciales(
        p?.nombre ?? nombreArrendador,
        p?.apellidos
      ),
      arrendadorVerificado: verificado,
      interesadosCount: 0,
    };
  });
}

export async function cargarInmueblesPublicados(
  supabase: SupabaseClient
): Promise<InmuebleConDetalle[]> {
  const { data } = await supabase
    .from("inmuebles")
    .select(COLUMNAS_PUBLICAS_INMUEBLE)
    .eq("estado", "publicado")
    .order("creado_en", { ascending: false });

  return hidratarInmueblesConDetalle(
    supabase,
    (data ?? []) as Record<string, unknown>[]
  );
}

export async function cargarInmueblePorId(
  supabase: SupabaseClient,
  id: string
): Promise<InmuebleConDetalle | null> {
  const { data } = await supabase
    .from("inmuebles")
    .select(COLUMNAS_PUBLICAS_INMUEBLE)
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;

  const hidratados = await hidratarInmueblesConDetalle(supabase, [
    data as Record<string, unknown>,
  ]);
  return hidratados[0] ?? null;
}
