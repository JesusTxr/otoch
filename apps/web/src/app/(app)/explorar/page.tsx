import Link from "next/link";
import { House, MapPin, ShieldCheck, Users } from "lucide-react";
import { VerifiedBadge } from "@/components/otoch/verified-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ExplorarPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-titulo-web text-foreground">Explorar</h1>
          <p className="mt-1 flex items-center gap-1.5 text-pequeno text-text-secondary">
            <MapPin className="size-4 text-primary" aria-hidden="true" />
            Mérida, Yucatán · Cuartos y casas verificadas cerca de tu escuela
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/perfil">Ver mi perfil</Link>
        </Button>
      </div>

      <Card className="items-start gap-4 rounded-xl p-8 shadow-card">
        <VerifiedBadge label="Catálogo verificado Otoch" />
        <div className="flex size-12 items-center justify-center rounded-sm bg-primary-soft text-primary-strong">
          <House className="size-6" aria-hidden="true" />
        </div>
        <h2 className="text-titulo-1 text-foreground">
          ¡Tu cuenta y perfil ya están listos!
        </h2>
        <p className="max-w-[580px] text-cuerpo text-text-secondary">
          Aquí aparecerán las tarjetas interactivas de inmuebles cercanos a tu
          universidad con filtro por distancia PostGIS y presupuesto mensual.
          Mientras tanto puedes revisar o actualizar tus preferencias en tu
          perfil.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Button asChild>
            <Link href="/perfil">Ir a mi perfil</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/roomies">
              <Users className="size-4" aria-hidden="true" />
              Ver roomies compatibles
            </Link>
          </Button>
        </div>
        <p className="flex items-center gap-1.5 text-etiqueta text-verde">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Nunca deposites antes de firmar el acuerdo dentro de Otoch.
        </p>
      </Card>
    </div>
  );
}
