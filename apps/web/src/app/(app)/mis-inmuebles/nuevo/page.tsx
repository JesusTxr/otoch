import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { InmuebleForm } from "@/components/otoch/inmueble-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Publicar inmueble · Otoch",
};

export default async function NuevoInmueblePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/mis-inmuebles/nuevo");
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, rol")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil) {
    redirect("/onboarding");
  }

  if (perfil.rol !== "arrendador") {
    return (
      <Card className="mx-auto max-w-[560px] items-start gap-4 rounded-xl p-8">
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-primary-soft px-3 py-1 text-etiqueta font-semibold text-primary-strong">
          <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
          Acceso exclusivo para arrendadores
        </span>
        <h1 className="text-titulo-1 text-foreground">
          Tu cuenta está registrada como estudiante
        </h1>
        <p className="text-cuerpo text-text-secondary">
          Solo los usuarios con rol <strong>arrendador</strong> pueden publicar y
          administrar inmuebles en Otoch.
        </p>
        <Button asChild>
          <Link href="/explorar">Volver a explorar inmuebles</Link>
        </Button>
      </Card>
    );
  }

  return <InmuebleForm userId={user.id} />;
}
