import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { MatchesPanel } from "@/components/otoch/matches-panel";
import { Button } from "@/components/ui/button";
import { cargarBandejaCirculosYMatches } from "@/lib/circulos-queries";
import { createClient } from "@/lib/supabase/server";
import { obtenerUsuarioServidor } from "@/lib/supabase/session";

export const metadata: Metadata = {
  title: "Mis matches · Otoch",
};

export default async function MatchesPage() {
  const user = await obtenerUsuarioServidor();
  if (!user) {
    redirect("/login?next=/matches");
  }

  const supabase = await createClient();

  const [{ data: perfil }, bandeja] = await Promise.all([
    supabase.from("perfiles").select("id").eq("id", user.id).maybeSingle(),
    cargarBandejaCirculosYMatches(supabase, user.id),
  ]);

  if (!perfil) {
    redirect("/onboarding");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-titulo-web text-foreground">Mis matches</h1>
          <p className="mt-1 text-pequeno text-text-secondary">
            Inmuebles y roomies compatibles con quienes hiciste match mutuo
          </p>
        </div>

        <Button variant="outline" size="sm" asChild>
          <Link href="/circulos">
            <MessageCircle className="size-4" aria-hidden="true" />
            Ir a bandeja de círculos ({bandeja.circulos.length})
          </Link>
        </Button>
      </div>

      <MatchesPanel
        circulos={bandeja.circulos}
        matchesInmuebles={bandeja.matchesInmuebles}
        matchesRoomies={bandeja.matchesRoomies}
      />
    </div>
  );
}
