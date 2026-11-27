import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const ONBOARDING_COOKIE = "otoch_perfil_ok";

const PROTECTED_PREFIXES = [
  "/explorar",
  "/inmuebles",
  "/mis-inmuebles",
  "/matches",
  "/roomies",
  "/circulos",
  "/perfil",
  "/onboarding",
];

const AUTH_PAGES = ["/login", "/registro"];

function startsWithAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = startsWithAny(pathname, PROTECTED_PREFIXES);
  const isAuthPage = AUTH_PAGES.includes(pathname);

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  // Salida rápida en rutas públicas si ni siquiera existen cookies de sesión de Supabase
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-"));

  if (!hasAuthCookie) {
    if (isProtected) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.search =
        pathname !== "/onboarding"
          ? `?next=${encodeURIComponent(pathname)}`
          : "";
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirectWithCookies = (targetPath: string) => {
    const redirectUrl = request.nextUrl.clone();
    const [pathOnly, queryString] = targetPath.split("?");
    redirectUrl.pathname = pathOnly;
    redirectUrl.search = queryString ? `?${queryString}` : "";
    const response = NextResponse.redirect(redirectUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie);
    });
    return response;
  };

  if (!user) {
    if (isProtected) {
      const nextParam =
        pathname !== "/onboarding"
          ? `?next=${encodeURIComponent(pathname)}`
          : "";
      return redirectWithCookies(`/login${nextParam}`);
    }
    return supabaseResponse;
  }

  if (!isProtected && !isAuthPage) {
    return supabaseResponse;
  }

  // Flag ligero en cookie: evita consultar `perfiles` en cada cambio de pestaña
  const perfilConfirmadoEnCookie =
    request.cookies.get(ONBOARDING_COOKIE)?.value === user.id;

  if (perfilConfirmadoEnCookie) {
    if (isAuthPage || pathname === "/onboarding") {
      return redirectWithCookies("/explorar");
    }
    return supabaseResponse;
  }

  // Solo consulta `perfiles` una vez cuando aún no existe el flag para este usuario
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil) {
    if (pathname !== "/onboarding") {
      return redirectWithCookies("/onboarding");
    }
    return supabaseResponse;
  }

  // Guardar flag ligero por 30 días para no volver a consultar `perfiles` en el middleware
  supabaseResponse.cookies.set(ONBOARDING_COOKIE, user.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  if (isAuthPage || pathname === "/onboarding") {
    return redirectWithCookies("/explorar");
  }

  return supabaseResponse;
}
