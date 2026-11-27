import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicNavbar } from "@/components/otoch/public-navbar";
import { createClient } from "@/lib/supabase/server";
import { obtenerResumenSesion } from "@/lib/supabase/session";
import type { Municipio, RolRegistro, Universidad } from "@/types/database";
import { OnboardingWizard } from "./onboarding-wizard";

export const metadata: Metadata = {
  title: "Completar perfil · Otoch",
};

interface OnboardingPageProps {
  searchParams: Promise<{ rol?: string }>;
}

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfilExistente } = await supabase
    .from("perfiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (perfilExistente) {
    redirect("/perfil");
  }

  const [params, usuarioResumen, uniRes, munRes] = await Promise.all([
    searchParams,
    obtenerResumenSesion(),
    supabase
      .from("universidades")
      .select("id, nombre, siglas, campus, dominio_correo, activa")
      .eq("activa", true)
      .order("siglas", { ascending: true }),
    supabase
      .from("municipios")
      .select("id, clave_inegi, nombre, distancia_merida_km")
      .order("nombre", { ascending: true }),
  ]);

  const rolMeta = user.user_metadata?.rol_inicial;
  const rolSugerido: RolRegistro =
    params.rol === "arrendador" || rolMeta === "arrendador"
      ? "arrendador"
      : "estudiante";

  return (
    <div className="min-h-dvh bg-canvas text-foreground">
      <PublicNavbar usuario={usuarioResumen} variant="compact" />
      <main className="mx-auto max-w-[1440px] px-4 py-8 lg:py-12">
        <OnboardingWizard
          emailUsuario={user.email ?? ""}
          rolSugerido={rolSugerido}
          universidades={(uniRes.data ?? []) as Universidad[]}
          municipios={(munRes.data ?? []) as Municipio[]}
        />
      </main>
    </div>
  );
}
