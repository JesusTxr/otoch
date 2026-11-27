import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { obtenerIniciales } from "@/components/otoch/avatar";
import { createClient } from "@/lib/supabase/server";
import { obtenerUsuarioServidor } from "@/lib/supabase/session";
import type {
  EstadoReporte,
  EstadoVerificacion,
  MotivoReporte,
  RegistroAuditoria,
  ReporteModeracion,
  RolUsuario,
  Verificacion,
  VerificacionModeracion,
} from "@/types/database";
import { AdminModeracionClient } from "./admin-client";

export const metadata: Metadata = {
  title: "Panel de moderación · Otoch",
};

export default async function AdminPage() {
  const user = await obtenerUsuarioServidor();
  if (!user) {
    redirect("/login?next=/admin");
  }

  const supabase = await createClient();

  const { data: perfilActual } = await supabase
    .from("perfiles")
    .select("id, rol")
    .eq("id", user.id)
    .maybeSingle();

  // Protección estricta: solo rol = 'administrador'; cualquier otro usuario se redirige a /explorar
  if (!perfilActual || perfilActual.rol !== "administrador") {
    redirect("/explorar");
  }

  // Consultas principales en paralelo
  const [verificacionesRes, reportesRes, auditoriaRes] = await Promise.all([
    supabase
      .from("verificaciones")
      .select("*")
      .eq("estado", "pendiente")
      .order("creado_en", { ascending: false })
      .limit(100),
    supabase
      .from("reportes")
      .select("*")
      .order("creado_en", { ascending: false })
      .limit(100),
    supabase
      .from("auditoria")
      .select("*")
      .order("creado_en", { ascending: false })
      .limit(100),
  ]);

  const verificacionesRaw = (verificacionesRes.data ?? []) as Verificacion[];
  const reportesRaw = (reportesRes.data ?? []) as {
    id: string;
    reportante_id: string;
    perfil_reportado_id: string | null;
    inmueble_reportado_id: string | null;
    mensaje_id: number | null;
    motivo: MotivoReporte;
    descripcion: string | null;
    estado: EstadoReporte;
    resuelto_por: string | null;
    creado_en: string;
    resuelto_en: string | null;
  }[];
  const auditoriaRaw = (auditoriaRes.data ?? []) as {
    id: number;
    actor_id: string | null;
    accion: string;
    entidad: string;
    entidad_id: string | null;
    detalle: Record<string, unknown> | null;
    creado_en: string;
  }[];

  // Recolectar IDs relacionados para resolver nombres y recursos en un solo bloque paralelo
  const perfilIds = new Set<string>();
  const estudianteIds = new Set<string>();
  const arrendadorIds = new Set<string>();
  const inmuebleIds = new Set<string>();
  const mensajeIds = new Set<number>();

  for (const v of verificacionesRaw) {
    perfilIds.add(v.perfil_id);
    estudianteIds.add(v.perfil_id);
    arrendadorIds.add(v.perfil_id);
  }

  for (const r of reportesRaw) {
    perfilIds.add(r.reportante_id);
    if (r.perfil_reportado_id) perfilIds.add(r.perfil_reportado_id);
    if (r.inmueble_reportado_id) inmuebleIds.add(r.inmueble_reportado_id);
    if (r.mensaje_id !== null) mensajeIds.add(Number(r.mensaje_id));
  }

  for (const a of auditoriaRaw) {
    if (a.actor_id) perfilIds.add(a.actor_id);
  }

  const [perfilesRelRes, estRelRes, arrRelRes, inmRelRes, msgRelRes] =
    await Promise.all([
      perfilIds.size > 0
        ? supabase
            .from("perfiles")
            .select("id, rol, nombre, apellidos, estado_verificacion")
            .in("id", Array.from(perfilIds))
        : Promise.resolve({ data: [] }),
      estudianteIds.size > 0
        ? supabase
            .from("perfiles_estudiante")
            .select("perfil_id, correo_institucional, universidades(siglas)")
            .in("perfil_id", Array.from(estudianteIds))
        : Promise.resolve({ data: [] }),
      arrendadorIds.size > 0
        ? supabase
            .from("perfiles_arrendador")
            .select("perfil_id, nombre_comercial")
            .in("perfil_id", Array.from(arrendadorIds))
        : Promise.resolve({ data: [] }),
      inmuebleIds.size > 0
        ? supabase
            .from("inmuebles")
            .select("id, titulo, colonia")
            .in("id", Array.from(inmuebleIds))
        : Promise.resolve({ data: [] }),
      mensajeIds.size > 0
        ? supabase
            .from("mensajes")
            .select("id, contenido, tipo")
            .in("id", Array.from(mensajeIds))
        : Promise.resolve({ data: [] }),
    ]);

  const mapaPerfiles = new Map<
    string,
    {
      nombreCompleto: string;
      iniciales: string;
      rol: RolUsuario;
      estadoVerificacion: EstadoVerificacion;
    }
  >();

  for (const p of (perfilesRelRes.data ?? []) as {
    id: string;
    rol: RolUsuario;
    nombre: string;
    apellidos: string;
    estado_verificacion: EstadoVerificacion;
  }[]) {
    mapaPerfiles.set(p.id, {
      nombreCompleto: `${p.nombre} ${p.apellidos}`.trim(),
      iniciales: obtenerIniciales(p.nombre, p.apellidos),
      rol: p.rol,
      estadoVerificacion: p.estado_verificacion,
    });
  }

  const mapaEstudiantes = new Map<
    string,
    { correoInstitucional: string | null; siglas: string | null }
  >();
  for (const e of (estRelRes.data ?? []) as {
    perfil_id: string;
    correo_institucional: string | null;
    universidades:
      | { siglas: string | null }
      | { siglas: string | null }[]
      | null;
  }[]) {
    const uni = Array.isArray(e.universidades)
      ? e.universidades[0]
      : e.universidades;
    mapaEstudiantes.set(e.perfil_id, {
      correoInstitucional: e.correo_institucional,
      siglas: uni?.siglas ?? null,
    });
  }

  const mapaArrendadores = new Map<string, string | null>();
  for (const ar of (arrRelRes.data ?? []) as {
    perfil_id: string;
    nombre_comercial: string | null;
  }[]) {
    mapaArrendadores.set(ar.perfil_id, ar.nombre_comercial);
  }

  const mapaInmuebles = new Map<string, string>();
  for (const inm of (inmRelRes.data ?? []) as {
    id: string;
    titulo: string;
    colonia: string;
  }[]) {
    mapaInmuebles.set(inm.id, `${inm.titulo} · ${inm.colonia}`);
  }

  const mapaMensajes = new Map<number, string>();
  for (const m of (msgRelRes.data ?? []) as {
    id: number;
    contenido: string | null;
    tipo: string;
  }[]) {
    mapaMensajes.set(
      Number(m.id),
      m.contenido?.trim()
        ? m.contenido.trim()
        : m.tipo === "imagen"
          ? "[Imagen adjunta en chat]"
          : "[Mensaje sin texto]"
    );
  }

  const verificaciones: VerificacionModeracion[] = verificacionesRaw.map(
    (v) => {
      const p = mapaPerfiles.get(v.perfil_id);
      const est = mapaEstudiantes.get(v.perfil_id);
      return {
        ...v,
        solicitanteNombre: p?.nombreCompleto ?? "Persona usuaria",
        solicitanteIniciales: p?.iniciales ?? "OT",
        solicitanteRol: p?.rol ?? "estudiante",
        solicitanteEstadoPerfil: p?.estadoVerificacion ?? "pendiente",
        correoInstitucional: est?.correoInstitucional ?? null,
        universidadSiglas: est?.siglas ?? null,
        nombreComercial: mapaArrendadores.get(v.perfil_id) ?? null,
      };
    }
  );

  const reportes: ReporteModeracion[] = reportesRaw.map((r) => ({
    ...r,
    reportanteNombre:
      mapaPerfiles.get(r.reportante_id)?.nombreCompleto ?? "Reportante",
    perfilReportadoNombre: r.perfil_reportado_id
      ? (mapaPerfiles.get(r.perfil_reportado_id)?.nombreCompleto ??
        "Perfil reportado")
      : null,
    inmuebleReportadoTitulo: r.inmueble_reportado_id
      ? (mapaInmuebles.get(r.inmueble_reportado_id) ?? "Inmueble")
      : null,
    mensajeExtracto:
      r.mensaje_id !== null
        ? (mapaMensajes.get(Number(r.mensaje_id)) ?? null)
        : null,
  }));

  const auditoria: RegistroAuditoria[] = auditoriaRaw.map((a) => ({
    id: Number(a.id),
    actor_id: a.actor_id,
    actorNombre: a.actor_id
      ? (mapaPerfiles.get(a.actor_id)?.nombreCompleto ?? "Administrador")
      : "Sistema",
    accion: a.accion,
    entidad: a.entidad,
    entidad_id: a.entidad_id,
    detalle: (a.detalle ?? {}) as Record<string, unknown>,
    creado_en: a.creado_en,
  }));

  return (
    <AdminModeracionClient
      verificacionesIniciales={verificaciones}
      reportesIniciales={reportes}
      auditoriaInicial={auditoria}
    />
  );
}
