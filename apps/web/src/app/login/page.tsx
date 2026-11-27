import type { Metadata } from "next";
import { PublicFooter } from "@/components/otoch/public-footer";
import { PublicNavbar } from "@/components/otoch/public-navbar";
import { obtenerResumenSesion } from "@/lib/supabase/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión · Otoch",
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [params, usuario] = await Promise.all([
    searchParams,
    obtenerResumenSesion(),
  ]);

  const nextPath =
    params.next && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/explorar";

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-foreground">
      <PublicNavbar usuario={usuario} variant="compact" />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col items-center justify-center px-4 py-10 lg:py-16">
        <LoginForm nextPath={nextPath} initialError={params.error} />
      </main>
      <PublicFooter />
    </div>
  );
}
