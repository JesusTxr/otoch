import { createClient } from "@/lib/supabase/server";
import { obtenerIniciales } from "@/components/otoch/avatar";
import type { RolUsuario, UsuarioSesionResumen } from "@/types/database";

export async function obtenerResumenSesion(): Promise<UsuarioSesionResumen | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: perfil } = await supabase
      .from("perfiles")
      .select("id, rol, nombre, apellidos, estado_verificacion")
      .eq("id", user.id)
      .maybeSingle();

    if (!perfil) {
      const emailPrefix = (user.email ?? "OT").split("@")[0] ?? "OT";
      return {
        id: user.id,
        email: user.email ?? "",
        nombreCompleto: emailPrefix,
        iniciales: obtenerIniciales(emailPrefix),
        rol: null,
        subtitulo: "Completar registro",
        verificado: false,
        circulosActivos: 0,
      };
    }

    let etiquetaRol =
      perfil.rol === "arrendador"
        ? "Arrendador"
        : perfil.rol === "administrador"
          ? "Admin"
          : "Estudiante";

    if (perfil.rol === "estudiante") {
      const { data: est } = await supabase
        .from("perfiles_estudiante")
        .select("universidad_id, universidades(siglas)")
        .eq("perfil_id", user.id)
        .maybeSingle();

      const uniRel = est?.universidades as
        | { siglas: string | null }
        | { siglas: string | null }[]
        | null
        | undefined;
      const siglas = Array.isArray(uniRel) ? uniRel[0]?.siglas : uniRel?.siglas;
      if (siglas) {
        etiquetaRol = siglas;
      }
    }

    const { count: circulosCount } = await supabase
      .from("miembros_circulo")
      .select("*", { count: "exact", head: true })
      .eq("perfil_id", user.id)
      .eq("estado", "activo");

    const verificado = perfil.estado_verificacion === "verificado";
    const estadoTexto = verificado
      ? "Verificado"
      : perfil.estado_verificacion === "rechazado"
        ? "Revisión pendiente"
        : "Por verificar";

    return {
      id: user.id,
      email: user.email ?? "",
      nombreCompleto: `${perfil.nombre} ${perfil.apellidos}`.trim(),
      iniciales: obtenerIniciales(perfil.nombre, perfil.apellidos),
      rol: perfil.rol as RolUsuario,
      subtitulo: `${etiquetaRol} · ${estadoTexto}`,
      verificado,
      circulosActivos: circulosCount ?? 0,
    };
  } catch {
    return null;
  }
}
