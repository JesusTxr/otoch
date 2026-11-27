import Link from "next/link";
import {
  Bus,
  House,
  Mail,
  MapPin,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-canvas text-foreground">
      {/* Barra superior */}
      <header className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-5 lg:px-20">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
            <House className="size-5 stroke-[2]" aria-hidden="true" />
          </div>
          <span className="text-titulo-1 text-foreground">otoch</span>
        </div>

        <nav
          aria-label="Navegación principal"
          className="flex items-center gap-6"
        >
          <span className="hidden text-cuerpo font-semibold text-text-secondary md:inline">
            Cómo funciona
          </span>
          <span className="hidden text-cuerpo font-semibold text-text-secondary md:inline">
            Para arrendadores
          </span>
          <span className="hidden text-cuerpo font-semibold text-text-secondary md:inline">
            Seguridad
          </span>
          <Button variant="outline" size="sm" type="button">
            Iniciar sesión
          </Button>
        </nav>
      </header>

      {/* Hero temporal de verificación visual de tokens */}
      <main className="mx-auto grid max-w-[1440px] items-center gap-10 px-4 py-8 lg:grid-cols-2 lg:gap-14 lg:px-20 lg:py-12">
        <section className="flex max-w-[600px] flex-col items-start gap-6">
          <Badge variant="secondary" className="px-3.5 py-1.5 text-pequeno font-semibold">
            <MapPin className="size-4 text-primary" aria-hidden="true" />
            Para estudiantes foráneos en Mérida, Yucatán
          </Badge>

          <h1 className="text-display lg:text-display-web text-foreground">
            Tu casa cerca de la escuela, con roomies que sí cuadran.
          </h1>

          <p className="text-cuerpo text-text-secondary">
            Deja de perder 40 minutos en el camión. Encuentra cuartos
            verificados a menos de 20 minutos de tu escuela, haz match con
            estudiantes compatibles y dividan la renta en partes iguales.
          </p>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button size="lg" type="button">
              Entrar con correo institucional
            </Button>
            <Button variant="outline" size="lg" type="button">
              Soy arrendador
            </Button>
          </div>

          <div className="grid w-full gap-4 pt-2 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xs bg-verde-soft text-verde">
                <Mail className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-pequeno font-semibold text-foreground">
                  Solo correos .edu.mx
                </p>
                <p className="text-etiqueta text-text-secondary">
                  Estudiantes verificados
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xs bg-verde-soft text-verde">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-pequeno font-semibold text-foreground">
                  Arrendadores con INE
                </p>
                <p className="text-etiqueta text-text-secondary">
                  Revisados por Otoch
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xs bg-verde-soft text-verde">
                <Wallet className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-pequeno font-semibold text-foreground">
                  Renta dividida
                </p>
                <p className="text-etiqueta text-text-secondary">
                  En partes iguales
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Panel derecho: muestra del sistema de diseño Otoch */}
        <section className="flex flex-col gap-5">
          <Card className="rounded-xl p-7 shadow-card">
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="verified">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  Arrendador verificado
                </Badge>
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-sunken px-3 py-1 text-etiqueta text-foreground">
                  <Bus className="size-3.5 text-verde" aria-hidden="true" />
                  18 min a la UTM
                </span>
              </div>
              <CardTitle className="text-titulo-web">
                Casa en García Ginerés
              </CardTitle>
              <CardDescription>
                Vista previa inicial · Tokens de diseño y tipografía Plus Jakarta
                Sans activos
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-5">
              <div className="rounded-sm bg-primary-soft p-4">
                <p className="text-pequeno text-text-secondary">
                  Renta total $7,350 · 3 integrantes del círculo
                </p>
                <p className="mt-1 text-titulo-1 text-primary-strong">
                  $2,450{" "}
                  <span className="text-cuerpo font-semibold">
                    por persona / mes
                  </span>
                </p>
                <div
                  className="mt-3 grid grid-cols-3 gap-2"
                  aria-label="División de renta en tres partes iguales"
                >
                  <div className="h-2 rounded-pill bg-primary" />
                  <div className="h-2 rounded-pill bg-verde" />
                  <div className="h-2 rounded-pill bg-oro" />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <span className="flex size-9 items-center justify-center rounded-pill border-2 border-surface bg-primary-soft text-pequeno font-semibold text-primary-strong">
                      AN
                    </span>
                    <span className="flex size-9 items-center justify-center rounded-pill border-2 border-surface bg-verde-soft text-pequeno font-semibold text-verde">
                      MR
                    </span>
                  </div>
                  <span className="text-pequeno font-semibold text-verde">
                    Mariana · 92% compatibles
                  </span>
                </div>

                <Button variant="secondary" size="sm" asChild>
                  <Link href="/api/health">Ver /api/health</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
