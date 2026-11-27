"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registroSchema } from "@/lib/validations/auth";

export interface AuthActionState {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
}

function sanitizarRutaInterna(nextRaw: string | null | undefined): string {
  if (!nextRaw) return "/explorar";
  const trimmed = nextRaw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/explorar";
  }
  return trimmed;
}

function traducirErrorSupabaseAuth(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.";
  }
  if (lower.includes("email not confirmed")) {
    return "Aún no has confirmado tu correo electrónico. Revisa tu bandeja de entrada o spam.";
  }
  if (lower.includes("user already registered")) {
    return "Este correo ya está registrado. Inicia sesión con tu contraseña.";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Demasiados intentos seguidos. Espera un minuto antes de volver a intentar.";
  }
  return "No se pudo completar la operación. Verifica tus datos e inténtalo nuevamente.";
}

export async function iniciarSesionAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const nextUrl = sanitizarRutaInterna(String(formData.get("next") ?? ""));

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      error: "Revisa los campos marcados.",
      fieldErrors,
    };
  }

  let destino = nextUrl;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data.user) {
      return {
        error: traducirErrorSupabaseAuth(error?.message ?? ""),
      };
    }

    const { data: perfil } = await supabase
      .from("perfiles")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!perfil) {
      destino = "/onboarding";
    }
  } catch {
    return {
      error: "Error de conexión con el servidor de autenticación.",
    };
  }

  revalidatePath("/", "layout");
  redirect(destino);
}

export async function registrarUsuarioAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const rolRaw = String(formData.get("rolInicial") ?? "estudiante");
  const rolInicial =
    rolRaw === "arrendador" ? "arrendador" : ("estudiante" as const);

  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    rolInicial,
  };

  const parsed = registroSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      error: "Corrige los campos marcados para continuar.",
      fieldErrors,
    };
  }

  let redirigirDirecto = false;

  try {
    const headerList = await headers();
    const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
    const proto = headerList.get("x-forwarded-proto") ?? "http";
    const siteOrigin = host
      ? `${proto}://${host}`
      : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${siteOrigin}/auth/callback?next=${encodeURIComponent(`/onboarding?rol=${rolInicial}`)}`,
        data: {
          rol_inicial: rolInicial,
        },
      },
    });

    if (error) {
      return {
        error: traducirErrorSupabaseAuth(error.message),
      };
    }

    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return {
        error: "Este correo ya tiene una cuenta registrada. Inicia sesión.",
      };
    }

    if (data.session) {
      redirigirDirecto = true;
    } else {
      return {
        success:
          "¡Cuenta creada! Revisa tu correo electrónico y abre el enlace de confirmación para completar tu perfil en Otoch.",
      };
    }
  } catch {
    return {
      error: "No se pudo conectar con el servicio de registro. Intenta nuevamente.",
    };
  }

  if (redirigirDirecto) {
    revalidatePath("/", "layout");
    redirect(`/onboarding?rol=${rolInicial}`);
  }

  return {};
}

export async function cerrarSesionAction(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Ignorar si ya expiró
  }
  revalidatePath("/", "layout");
  redirect("/");
}
