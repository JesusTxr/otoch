import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { obtenerIniciales } from "@/components/otoch/avatar";
import { createClient } from "@/lib/supabase/server";
import type { RolUsuario, UsuarioSesionResumen } from "@/types/database";

/**
 * Deduplica `supabase.auth.getUser()` dentro del mismo render RSC (Layout + Page).
 */
export const obtenerUsuarioServidor = cache(async (): Promise<User | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
});

/**
 * Obtiene el resumen de sesión en un solo bloque paralelo (`Promise.all`) y cacheado por request.
 */
export const obtenerResumenSesion = cache(
  async (): Promise<UsuarioSesionResumen | null> => {
    try {
      const user = await obtenerUsuarioServidor();
      if (!user) {
        return null;
      }

      const supabase = await createClient();
      const [perfilRes, estRes, circulosCountRes] = await Promise.all([
        supabase
          .from("perfiles")
          .select("id, rol, nombre, apellidos, estado_verificacion")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("perfiles_estudiante")
          .select("universidad_id, universidades(siglas)")
          .eq("perfil_id", user.id)
          .maybeSingle(),
        supabase
          .from("miembros_circulo")
          .select("*", { count: "exact", head: true })
          .eq("perfil_id", user.id)
          .eq("estado", "activo"),
      ]);

      const perfil = perfilRes.data;
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

      if (perfil.rol === "estudiante" && estRes.data) {
        const uniRel = estRes.data.universidades as
          | { siglas: string | null }
          | { siglas: string | null }[]
          | null
          | undefined;
        const siglas = Array.isArray(uniRel)
          ? uniRel[0]?.siglas
          : uniRel?.siglas;
        if (siglas) {
          etiquetaRol = siglas;
        }
      }

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
        circulosActivos: circulosCountRes.count ?? 0,
      };
    } catch {
      return null;
    }
  }
);
