import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function sanitizarSiguiente(nextRaw: string | null): string {
  if (!nextRaw) return "/explorar";
  if (!nextRaw.startsWith("/") || nextRaw.startsWith("//")) {
    return "/explorar";
  }
  return nextRaw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextPath = sanitizarSiguiente(searchParams.get("next"));

  try {
    const supabase = await createClient();

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(
          `${origin}/login?error=No+se+pudo+validar+tu+sesion`
        );
      }
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });
      if (error) {
        return NextResponse.redirect(
          `${origin}/login?error=El+enlace+de+confirmacion+expiro+o+no+es+valido`
        );
      }
    } else {
      return NextResponse.redirect(`${origin}/login`);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${origin}/login`);
    }

    const { data: perfil } = await supabase
      .from("perfiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!perfil) {
      const rolMeta =
        user.user_metadata?.rol_inicial === "arrendador"
          ? "?rol=arrendador"
          : "";
      return NextResponse.redirect(`${origin}/onboarding${rolMeta}`);
    }

    return NextResponse.redirect(`${origin}${nextPath}`);
  } catch {
    return NextResponse.redirect(
      `${origin}/login?error=Error+al+procesar+la+autenticacion`
    );
  }
}
