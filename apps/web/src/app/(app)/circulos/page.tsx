import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, MessageCircle } from "lucide-react";
import { CirculosSidebar } from "@/components/otoch/circulos-sidebar";
import { MatchesPanel } from "@/components/otoch/matches-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cargarBandejaCirculosYMatches } from "@/lib/circulos-queries";
import { createClient } from "@/lib/supabase/server";
import { obtenerUsuarioServidor } from "@/lib/supabase/session";

export const metadata: Metadata = {
  title: "Círculos y matches · Otoch",
};

interface CirculosIndexPageProps {
  searchParams: Promise<{ vista?: string }>;
}

export default async function CirculosPage({
  searchParams,
}: CirculosIndexPageProps) {
  const user = await obtenerUsuarioServidor();
  if (!user) {
    redirect("/login?next=/circulos");
  }

  const supabase = await createClient();

  const [params, { data: perfil }, bandeja] = await Promise.all([
    searchParams,
    supabase.from("perfiles").select("id").eq("id", user.id).maybeSingle(),
    cargarBandejaCirculosYMatches(supabase, user.id),
  ]);

  if (!perfil) {
    redirect("/onboarding");
  }

  const totalMatches =
    bandeja.matchesInmuebles.length + bandeja.matchesRoomies.length;
  const mostrarMatchesDirecto =
    params.vista === "matches" || bandeja.circulos.length === 0;
  const primerCirculoActivo = bandeja.circulos.find(
    (c) => c.miEstado === "activo"
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[310px_minmax(0,1fr)]">
      <CirculosSidebar
        circulos={bandeja.circulos}
        totalMatches={totalMatches}
        className="lg:min-h-[calc(100dvh-110px)]"
      />

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-titulo-web text-foreground">
              {mostrarMatchesDirecto
                ? "Matches y creación de círculos"
                : "Selecciona un círculo"}
            </h1>
            <p className="mt-0.5 text-pequeno text-text-secondary">
              Abre un círculo a partir de un match de inmueble o invita roomies
              compatibles para dividir la renta.
            </p>
          </div>

          {primerCirculoActivo && (
            <Button size="sm" asChild>
              <Link href={`/circulos/${primerCirculoActivo.id}`}>
                <MessageCircle className="size-4" aria-hidden="true" />
                Abrir último chat
              </Link>
            </Button>
          )}
        </div>

        {!mostrarMatchesDirecto && primerCirculoActivo && (
          <Card className="flex-col items-start justify-between gap-4 rounded-lg bg-primary-soft/60 p-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-primary text-primary-foreground">
                <Heart className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-cuerpo font-semibold text-foreground">
                  Tienes {bandeja.circulos.length} círculo(s) y {totalMatches}{" "}
                  match(es) activos
                </p>
                <p className="text-etiqueta text-text-secondary">
                  Selecciona cualquier círculo en la columna izquierda para abrir
                  el chat en tiempo real y su pre-acuerdo PDF.
                </p>
              </div>
            </div>
            <Button size="sm" asChild>
              <Link href={`/circulos/${primerCirculoActivo.id}`}>
                Entrar al chat
              </Link>
            </Button>
          </Card>
        )}

        <MatchesPanel
          circulos={bandeja.circulos}
          matchesInmuebles={bandeja.matchesInmuebles}
          matchesRoomies={bandeja.matchesRoomies}
        />
      </div>
    </div>
  );
}
