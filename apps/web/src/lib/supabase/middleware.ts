import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/explorar",
  "/inmuebles",
  "/mis-inmuebles",
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

  const { pathname } = request.nextUrl;
  const isProtected = startsWithAny(pathname, PROTECTED_PREFIXES);
  const isAuthPage = AUTH_PAGES.includes(pathname);

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

  // Si hay sesión activa y visita una ruta protegida o de auth, verificar si ya completó su perfil
  if (isProtected || isAuthPage) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!perfil && pathname !== "/onboarding") {
      return redirectWithCookies("/onboarding");
    }

    if (perfil && (isAuthPage || pathname === "/onboarding")) {
      return redirectWithCookies("/explorar");
    }
  }

  return supabaseResponse;
}
