import type { SupabaseClient } from "@supabase/supabase-js";
import { obtenerIniciales } from "@/components/otoch/avatar";
import type {
  Acuerdo,
  Aportacion,
  Circulo,
  CirculoResumenLista,
  EstadoAcuerdo,
  EstadoCirculo,
  EstadoMiembro,
  MatchInmuebleItem,
  MatchRoomieItem,
  MensajeChat,
  MiembroCirculoDetalle,
  RolCirculo,
} from "@/types/database";

export interface BandejaDatos {
  circulos: CirculoResumenLista[];
  matchesInmuebles: MatchInmuebleItem[];
  matchesRoomies: MatchRoomieItem[];
}

export interface DetalleCirculoDatos {
  circulo: Circulo;
  miEstado: EstadoMiembro;
  miRol: RolCirculo;
  inmueble: {
    id: string;
    titulo: string;
    colonia: string;
    direccion_privada: string | null;
    renta_mensual: number;
    deposito: number;
    capacidad: number;
    reglas: string | null;
  };
  integrantes: MiembroCirculoDetalle[];
  mensajesIniciales: MensajeChat[];
  acuerdoActual: Acuerdo | null;
  aportaciones: Aportacion[];
}

function formatearHoraCorta(iso: string | null | undefined): string {
  if (!iso) return "";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  const ahora = new Date();
  const mismoDia =
    fecha.getFullYear() === ahora.getFullYear() &&
    fecha.getMonth() === ahora.getMonth() &&
    fecha.getDate() === ahora.getDate();

  if (mismoDia) {
    return fecha.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
  });
}

export async function cargarBandejaCirculosYMatches(
  supabase: SupabaseClient,
  userId: string
): Promise<BandejaDatos> {
  const [misMembresiasRes, misMatchesRes] = await Promise.all([
    supabase
      .from("miembros_circulo")
      .select("circulo_id, rol, estado")
      .eq("perfil_id", userId)
      .in("estado", ["activo", "invitado"]),
    supabase
      .from("matches")
      .select("id, tipo, perfil_a_id, perfil_b_id, inmueble_id, compatibilidad, creado_en")
      .or(`perfil_a_id.eq.${userId},perfil_b_id.eq.${userId}`)
      .eq("estado", "activo")
      .order("creado_en", { ascending: false }),
  ]);

  const misMembresias = misMembresiasRes.data ?? [];
  const circuloIds = misMembresias.map((m) => m.circulo_id);
  const misMatches = misMatchesRes.data ?? [];

  // Cargar detalles de círculos donde participa o está invitado
  const [circulosRes, miembrosTodosRes, ultimosMensajesRes] =
    circuloIds.length > 0
      ? await Promise.all([
          supabase
            .from("circulos")
            .select("id, inmueble_id, creado_por, nombre, cupo, estado, actualizado_en")
            .in("id", circuloIds)
            .order("actualizado_en", { ascending: false }),
          supabase
            .from("miembros_circulo")
            .select("circulo_id, perfil_id, rol, estado")
            .in("circulo_id", circuloIds)
            .in("estado", ["activo", "invitado"]),
          supabase
            .from("mensajes")
            .select("circulo_id, contenido, tipo, creado_en")
            .in("circulo_id", circuloIds)
            .eq("eliminado", false)
            .order("creado_en", { ascending: false })
            .limit(120),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }];

  const circulosRaw = circulosRes.data ?? [];
  const miembrosTodos = miembrosTodosRes.data ?? [];

  // IDs únicos de inmuebles y perfiles involucrados tanto en círculos como en matches
  const inmuebleIdsSet = new Set<string>();
  const perfilIdsSet = new Set<string>();

  for (const c of circulosRaw) inmuebleIdsSet.add(c.inmueble_id);
  for (const m of miembrosTodos) perfilIdsSet.add(m.perfil_id);
  for (const mt of misMatches) {
    if (mt.inmueble_id) inmuebleIdsSet.add(mt.inmueble_id);
    perfilIdsSet.add(mt.perfil_a_id);
    perfilIdsSet.add(mt.perfil_b_id);
  }

  const inmuebleIds = Array.from(inmuebleIdsSet);
  const perfilIds = Array.from(perfilIdsSet);

  const [inmueblesRes, perfilesRes, estudiantesRes, unisRes] = await Promise.all(
    [
      inmuebleIds.length > 0
        ? supabase
            .from("inmuebles")
            .select("id, titulo, colonia, renta_mensual, capacidad")
            .in("id", inmuebleIds)
        : Promise.resolve({ data: [] }),
      perfilIds.length > 0
        ? supabase
            .from("perfiles")
            .select("id, nombre, apellidos, rol, estado_verificacion")
            .in("id", perfilIds)
        : Promise.resolve({ data: [] }),
      perfilIds.length > 0
        ? supabase
            .from("perfiles_estudiante")
            .select("perfil_id, universidad_id, carrera, presupuesto_max")
            .in("perfil_id", perfilIds)
        : Promise.resolve({ data: [] }),
      supabase.from("universidades").select("id, siglas"),
    ]
  );

  const inmuebleMap = new Map(
    (inmueblesRes.data ?? []).map((i) => [i.id, i])
  );
  const perfilMap = new Map((perfilesRes.data ?? []).map((p) => [p.id, p]));
  const estudianteMap = new Map(
    (estudiantesRes.data ?? []).map((e) => [e.perfil_id, e])
  );
  const uniMap = new Map(
    (unisRes.data ?? []).map((u) => [u.id, u.siglas ?? "Mérida"])
  );

  const miMembresiaMap = new Map(
    misMembresias.map((m) => [m.circulo_id, m])
  );

  const ultimoMsgPorCirculo = new Map<
    string,
    { texto: string; fecha: string }
  >();
  for (const msg of ultimosMensajesRes.data ?? []) {
    if (!ultimoMsgPorCirculo.has(msg.circulo_id)) {
      ultimoMsgPorCirculo.set(msg.circulo_id, {
        texto:
          msg.tipo === "imagen"
            ? "📷 Imagen compartida"
            : (msg.contenido ?? "Nuevo mensaje"),
        fecha: formatearHoraCorta(msg.creado_en),
      });
    }
  }

  const circulos: CirculoResumenLista[] = circulosRaw.map((c) => {
    const inm = inmuebleMap.get(c.inmueble_id);
    const miMem = miMembresiaMap.get(c.id);
    const integrantesCirc = miembrosTodos.filter((m) => m.circulo_id === c.id);
    const estActivos = integrantesCirc.filter(
      (m) => m.rol === "estudiante" && m.estado === "activo"
    ).length;

    const avatares = integrantesCirc
      .filter((m) => m.estado === "activo")
      .slice(0, 3)
      .map((m) => {
        const p = perfilMap.get(m.perfil_id);
        return {
          iniciales: obtenerIniciales(p?.nombre ?? "OT", p?.apellidos),
          nombre: p ? `${p.nombre} ${p.apellidos}`.trim() : "Integrante",
          esArrendador: m.rol === "arrendador",
        };
      });

    const ult = ultimoMsgPorCirculo.get(c.id);

    return {
      id: c.id,
      nombre: c.nombre || inm?.titulo || "Círculo Otoch",
      estado: c.estado as EstadoCirculo,
      cupo: c.cupo,
      miEstado: (miMem?.estado as EstadoMiembro) ?? "activo",
      miRol: (miMem?.rol as RolCirculo) ?? "estudiante",
      inmuebleId: c.inmueble_id,
      inmuebleTitulo: inm?.titulo ?? "Inmueble en Mérida",
      inmuebleColonia: inm?.colonia ?? "Mérida",
      rentaMensual: Number(inm?.renta_mensual ?? 0),
      avatares,
      ultimoMensajeTexto:
        miMem?.estado === "invitado"
          ? "Tienes una invitación pendiente a este círculo"
          : (ult?.texto ?? "Conversación lista para acordar renta"),
      ultimoMensajeFecha:
        ult?.fecha || formatearHoraCorta(c.actualizado_en),
      estudiantesActivos: estActivos,
    };
  });

  // Mapear inmueble -> círculo abierto del usuario (si ya creó uno)
  const circuloPorInmueble = new Map<string, string>();
  for (const c of circulos) {
    if (c.estado !== "cancelado") {
      circuloPorInmueble.set(c.inmuebleId, c.id);
    }
  }

  const matchesInmuebles: MatchInmuebleItem[] = [];
  const matchesRoomies: MatchRoomieItem[] = [];

  for (const mt of misMatches) {
    const contraparteId =
      mt.perfil_a_id === userId ? mt.perfil_b_id : mt.perfil_a_id;
    const pContra = perfilMap.get(contraparteId);
    const nombreContra = pContra
      ? `${pContra.nombre} ${pContra.apellidos}`.trim()
      : "Usuario verificado";
    const inicialesContra = obtenerIniciales(
      pContra?.nombre ?? "OT",
      pContra?.apellidos
    );

    if (mt.tipo === "estudiante_inmueble" && mt.inmueble_id) {
      const inm = inmuebleMap.get(mt.inmueble_id);
      matchesInmuebles.push({
        matchId: mt.id,
        inmuebleId: mt.inmueble_id,
        inmuebleTitulo: inm?.titulo ?? "Inmueble verificado",
        inmuebleColonia: inm?.colonia ?? "Mérida",
        rentaMensual: Number(inm?.renta_mensual ?? 0),
        capacidad: Number(inm?.capacidad ?? 2),
        contraparteId,
        contraparteNombre: nombreContra,
        contraparteIniciales: inicialesContra,
        contraparteEsArrendador: mt.perfil_b_id === contraparteId,
        circuloExistenteId: circuloPorInmueble.get(mt.inmueble_id) ?? null,
        creadoEn: formatearHoraCorta(mt.creado_en),
      });
    } else if (mt.tipo === "roomies") {
      const acad = estudianteMap.get(contraparteId);
      matchesRoomies.push({
        matchId: mt.id,
        roomieId: contraparteId,
        nombreCompleto: nombreContra,
        iniciales: inicialesContra,
        universidadSiglas: acad?.universidad_id
          ? (uniMap.get(acad.universidad_id) ?? "Mérida")
          : "Mérida",
        carrera: acad?.carrera ?? "Estudiante universitario",
        presupuestoMax: acad ? Number(acad.presupuesto_max) : null,
        compatibilidad: Math.round(Number(mt.compatibilidad ?? 85)),
        verificado: pContra?.estado_verificacion === "verificado",
        creadoEn: formatearHoraCorta(mt.creado_en),
      });
    }
  }

  return {
    circulos,
    matchesInmuebles,
    matchesRoomies,
  };
}

export async function cargarDetalleCirculoActivo(
  supabase: SupabaseClient,
  userId: string,
  circuloId: string
): Promise<DetalleCirculoDatos | null> {
  const [{ data: circulo }, { data: miembrosRaw }] = await Promise.all([
    supabase.from("circulos").select("*").eq("id", circuloId).maybeSingle(),
    supabase
      .from("miembros_circulo")
      .select("circulo_id, perfil_id, rol, estado, unido_en")
      .eq("circulo_id", circuloId)
      .in("estado", ["activo", "invitado"]),
  ]);

  if (!circulo || !miembrosRaw) return null;

  const miMem = miembrosRaw.find((m) => m.perfil_id === userId);
  if (!miMem) return null;

  const esActivo = miMem.estado === "activo";
  const perfilIds = miembrosRaw.map((m) => m.perfil_id);

  const [inmRes, perfilesRes, estRes, unisRes, mensajesRes, acuerdoRes] =
    await Promise.all([
      supabase
        .from("inmuebles")
        .select(
          esActivo
            ? "id, titulo, colonia, direccion_privada, renta_mensual, deposito, capacidad, reglas"
            : "id, titulo, colonia, renta_mensual, deposito, capacidad, reglas"
        )
        .eq("id", circulo.inmueble_id)
        .maybeSingle(),
      supabase
        .from("perfiles")
        .select("id, nombre, apellidos, telefono, estado_verificacion")
        .in("id", perfilIds),
      supabase
        .from("perfiles_estudiante")
        .select("perfil_id, universidad_id")
        .in("perfil_id", perfilIds),
      supabase.from("universidades").select("id, siglas"),
      esActivo
        ? supabase
            .from("mensajes")
            .select("*")
            .eq("circulo_id", circuloId)
            .eq("eliminado", false)
            .order("creado_en", { ascending: true })
            .limit(200)
        : Promise.resolve({ data: [] }),
      esActivo
        ? supabase
            .from("acuerdos")
            .select("*, aportaciones(*)")
            .eq("circulo_id", circuloId)
            .order("version", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const inmData = (inmRes.data as Record<string, unknown> | null) ?? null;
  if (!inmData) return null;

  const perfilMap = new Map((perfilesRes.data ?? []).map((p) => [p.id, p]));
  const estMap = new Map((estRes.data ?? []).map((e) => [e.perfil_id, e]));
  const uniMap = new Map(
    (unisRes.data ?? []).map((u) => [u.id, u.siglas ?? "Mérida"])
  );

  const integrantes: MiembroCirculoDetalle[] = miembrosRaw.map((m) => {
    const p = perfilMap.get(m.perfil_id);
    const est = estMap.get(m.perfil_id);
    const siglas = est?.universidad_id ? uniMap.get(est.universidad_id) : null;
    const nombre = p ? `${p.nombre} ${p.apellidos}`.trim() : "Integrante";
    const verificado = p?.estado_verificacion === "verificado";

    const subtitulo =
      m.rol === "arrendador"
        ? verificado
          ? "Arrendador verificado"
          : "Arrendador"
        : m.estado === "invitado"
          ? `Invitación pendiente${siglas ? ` · ${siglas}` : ""}`
          : `Estudiante${siglas ? ` · ${siglas}` : ""}`;

    return {
      circulo_id: m.circulo_id,
      perfil_id: m.perfil_id,
      rol: m.rol as RolCirculo,
      estado: m.estado as EstadoMiembro,
      unido_en: m.unido_en,
      nombreCompleto: nombre,
      iniciales: obtenerIniciales(p?.nombre ?? "OT", p?.apellidos),
      esUsuarioActual: m.perfil_id === userId,
      verificado,
      subtitulo,
      telefono: esActivo ? (p?.telefono ?? null) : null,
    };
  });

  let acuerdoActual: Acuerdo | null = null;
  let aportaciones: Aportacion[] = [];

  if (acuerdoRes.data) {
    const rawAc = acuerdoRes.data as Record<string, unknown>;
    const clausulasArr = Array.isArray(rawAc.clausulas)
      ? rawAc.clausulas.map((c: unknown) => String(c))
      : [];

    acuerdoActual = {
      id: String(rawAc.id),
      circulo_id: String(rawAc.circulo_id),
      version: Number(rawAc.version),
      renta_total: Number(rawAc.renta_total),
      deposito_total: Number(rawAc.deposito_total),
      servicios_estimados: Number(rawAc.servicios_estimados),
      fecha_inicio: String(rawAc.fecha_inicio),
      duracion_meses: Number(rawAc.duracion_meses),
      clausulas: clausulasArr,
      estado: rawAc.estado as EstadoAcuerdo,
      pdf_ruta: (rawAc.pdf_ruta as string | null) ?? null,
      creado_en: String(rawAc.creado_en),
      actualizado_en: String(rawAc.actualizado_en),
    };

    const aportRaw = Array.isArray(rawAc.aportaciones)
      ? (rawAc.aportaciones as Record<string, unknown>[])
      : [];

    aportaciones = aportRaw.map((ap) => ({
      acuerdo_id: String(ap.acuerdo_id),
      perfil_id: String(ap.perfil_id),
      porcentaje: Number(ap.porcentaje),
      monto_renta: Number(ap.monto_renta),
      monto_deposito: Number(ap.monto_deposito),
      aceptado_en: (ap.aceptado_en as string | null) ?? null,
    }));
  }

  return {
    circulo: circulo as Circulo,
    miEstado: miMem.estado as EstadoMiembro,
    miRol: miMem.rol as RolCirculo,
    inmueble: {
      id: String(inmData.id),
      titulo: String(inmData.titulo ?? "Inmueble"),
      colonia: String(inmData.colonia ?? "Mérida"),
      direccion_privada: esActivo
        ? ((inmData.direccion_privada as string | null) ?? null)
        : null,
      renta_mensual: Number(inmData.renta_mensual ?? 0),
      deposito: Number(inmData.deposito ?? 0),
      capacidad: Math.max(2, Math.min(6, Number(inmData.capacidad ?? 3))),
      reglas: (inmData.reglas as string | null) ?? null,
    },
    integrantes,
    mensajesIniciales: (mensajesRes.data ?? []) as MensajeChat[],
    acuerdoActual,
    aportaciones,
  };
}
