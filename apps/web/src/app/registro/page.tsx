import type { Metadata } from "next";
import { PublicNavbar } from "@/components/otoch/public-navbar";
import { obtenerResumenSesion } from "@/lib/supabase/session";
import type { RolRegistro } from "@/types/database";
import { RegistroForm } from "./registro-form";

export const metadata: Metadata = {
  title: "Crear cuenta · Otoch",
};

interface RegistroPageProps {
  searchParams: Promise<{ rol?: string }>;
}

export default async function RegistroPage({
  searchParams,
}: RegistroPageProps) {
  const [params, usuario] = await Promise.all([
    searchParams,
    obtenerResumenSesion(),
  ]);

  const rolInicial: RolRegistro =
    params.rol === "arrendador" ? "arrendador" : "estudiante";

  return (
    <div className="min-h-dvh bg-canvas text-foreground">
      <PublicNavbar usuario={usuario} variant="compact" />
      <main className="mx-auto flex max-w-[1440px] flex-col items-center justify-center px-4 py-10 lg:py-14">
        <RegistroForm rolInicial={rolInicial} />
      </main>
    </div>
  );
}
