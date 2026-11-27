import Link from "next/link";
import {
  Bus,
  Check,
  Heart,
  House,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { OtochAvatar } from "@/components/otoch/avatar";
import { PublicFooter } from "@/components/otoch/public-footer";
import { PublicNavbar } from "@/components/otoch/public-navbar";
import { TabBar } from "@/components/otoch/tab-bar";
import { VerifiedBadge } from "@/components/otoch/verified-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { obtenerResumenSesion } from "@/lib/supabase/session";

export default async function HomePage() {
  const usuario = await obtenerResumenSesion();

  return (
    <div className="min-h-dvh bg-canvas pb-24 text-foreground lg:pb-0">
      <PublicNavbar usuario={usuario} variant="landing" />

      {/* Hero principal W01 */}
      <main>
        <section className="mx-auto grid max-w-[1440px] items-center gap-10 px-4 pb-12 pt-6 lg:grid-cols-[minmax(0,600px)_minmax(0,624px)] lg:justify-between lg:gap-14 lg:px-20 lg:pb-16 lg:pt-10">
          {/* Columna izquierda */}
          <div className="flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-2 rounded-pill bg-primary-soft px-4 py-1.5 text-pequeno font-semibold text-primary-strong">
              <MapPin className="size-4 text-primary" aria-hidden="true" />
              Para estudiantes foráneos en Mérida, Yucatán
            </span>

            <h1 className="text-display text-foreground lg:text-display-web">
              Tu casa cerca de la escuela, con roomies que sí cuadran.
            </h1>

            <p className="text-titulo-2 font-normal leading-7 text-text-secondary">
              Deja de perder 40 minutos en el camión. Encuentra cuartos
              verificados a menos de 20 minutos de tu escuela, haz match con
              estudiantes compatibles y dividan la renta en partes iguales.
            </p>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
              <Button size="lg" className="sm:min-w-[290px]" asChild>
                <Link
                  href={
                    usuario
                      ? "/explorar"
                      : "/registro?rol=estudiante"
                  }
                >
                  {usuario
                    ? "Ir a explorar inmuebles"
                    : "Entrar con correo institucional"}
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="sm:min-w-[180px]"
                asChild
              >
                <Link href="/registro?rol=arrendador">Soy arrendador</Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link href="/explorar">Explorar cuartos</Link>
              </Button>
            </div>

            {/* 3 sellos de confianza */}
            <div className="grid w-full gap-4 pt-2 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xs bg-verde-soft text-verde">
                  <Mail className="size-5" aria-hidden="true" />
                </span>
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
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xs bg-verde-soft text-verde">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                </span>
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
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xs bg-verde-soft text-verde">
                  <Wallet className="size-5" aria-hidden="true" />
                </span>
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
          </div>

          {/* Columna derecha: composición visual W01 con tarjetas flotantes */}
          <div className="relative mx-auto w-full max-w-[624px] py-4 lg:pl-12">
            {/* Fachada cálida estilo Mérida */}
            <div className="relative h-[460px] w-full overflow-hidden rounded-xl border border-border bg-primary-soft shadow-card sm:h-[560px]">
              {/* Ilustración arquitectónica yucateca usando tokens Otoch */}
              <div
                aria-hidden="true"
                className="absolute inset-0 flex flex-col justify-between p-6"
                style={{ background: "var(--otoch-gradient-roomie)" }}
              >
                <div className="flex justify-end">
                  <span className="inline-flex items-center gap-2 rounded-pill bg-surface px-4 py-2 text-pequeno font-semibold text-foreground shadow-card">
                    <Bus className="size-4 text-verde" />
                    18 min a la UTM
                  </span>
                </div>

                {/* Marcos arquitectónicos coloniales */}
                <div className="mx-auto grid w-full max-w-[400px] grid-cols-2 gap-5 rounded-t-lg border-x-4 border-t-4 border-canvas/80 bg-primary/35 p-6 pt-8 backdrop-blur-[2px]">
                  <div className="flex h-44 flex-col justify-between rounded-xs border-2 border-canvas/70 bg-foreground/20 p-3">
                    <div className="grid h-full grid-cols-2 gap-1.5">
                      <span className="rounded-[4px] border border-canvas/40" />
                      <span className="rounded-[4px] border border-canvas/40" />
                      <span className="rounded-[4px] border border-canvas/40" />
                      <span className="rounded-[4px] border border-canvas/40" />
                    </div>
                  </div>
                  <div className="flex h-44 flex-col items-center justify-end rounded-t-pill border-2 border-canvas/70 bg-foreground/30 p-3">
                    <House className="mb-4 size-10 text-canvas/90" />
                    <span className="text-etiqueta text-canvas/90">
                      García Ginerés · Mérida
                    </span>
                  </div>
                </div>
              </div>

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
                style={{ background: "var(--otoch-gradient-photo)" }}
              />
            </div>

            {/* Tarjeta flotante 1: ¡Es un match! */}
            <div className="relative -mt-44 ml-2 max-w-[300px] rounded-md border border-border bg-surface p-4 shadow-card sm:absolute sm:left-0 sm:top-16 sm:mt-0">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  <OtochAvatar
                    iniciales="AN"
                    nombre="Angel Noh"
                    size={40}
                    tone="primary"
                    className="border-2 border-surface"
                  />
                  <OtochAvatar
                    iniciales="MR"
                    nombre="Mariana"
                    size={40}
                    tone="verde"
                    className="border-2 border-surface"
                  />
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-cuerpo font-semibold text-foreground">
                    ¡Es un match!
                    <Heart
                      className="size-4 fill-primary text-primary"
                      aria-hidden="true"
                    />
                  </p>
                  <p className="text-pequeno font-semibold text-verde">
                    Mariana · 92% compatibles
                  </p>
                </div>
              </div>
            </div>

            {/* Tarjeta flotante 2: Renta dividida */}
            <div className="relative mt-4 ml-auto mr-2 max-w-[290px] rounded-md border border-border bg-surface p-5 shadow-card sm:absolute sm:bottom-8 sm:left-2 sm:ml-0 sm:mr-0 sm:mt-0">
              <p className="text-pequeno text-text-secondary">
                Renta total $7,350
              </p>
              <p className="mt-0.5 text-titulo-2 text-primary">
                $2,450 por roomie
              </p>
              <div
                className="mt-3 grid grid-cols-3 gap-2"
                aria-label="Renta dividida en tres partes iguales"
              >
                <span className="h-2 rounded-pill bg-primary" />
                <span className="h-2 rounded-pill bg-verde" />
                <span className="h-2 rounded-pill bg-oro" />
              </div>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section
          id="como-funciona"
          className="border-t border-border bg-surface py-14"
        >
          <div className="mx-auto max-w-[1440px] px-4 lg:px-20">
            <div className="flex flex-col gap-2">
              <span className="text-etiqueta uppercase text-primary">
                Cómo funciona Otoch
              </span>
              <h2 className="text-titulo-web text-foreground">
                De buscar solo a firmar en equipo en tres pasos
              </h2>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <Card className="bg-canvas">
                <span className="flex size-11 items-center justify-center rounded-xs bg-primary-soft text-primary-strong">
                  <House className="size-5" aria-hidden="true" />
                </span>
                <h3 className="text-titulo-2 text-foreground">
                  1. Explora cerca de tu campus
                </h3>
                <p className="text-cuerpo text-text-secondary">
                  Filtra casas, departamentos y cuartos verificados a ≤ 20
                  minutos de la UTM, UADY o ITM en Mérida.
                </p>
              </Card>

              <Card className="bg-canvas">
                <span className="flex size-11 items-center justify-center rounded-xs bg-verde-soft text-verde">
                  <Users className="size-5" aria-hidden="true" />
                </span>
                <h3 className="text-titulo-2 text-foreground">
                  2. Haz match con roomies afines
                </h3>
                <p className="text-cuerpo text-text-secondary">
                  Nuestro cuestionario compara horarios de sueño, orden, ruido,
                  mascotas y presupuesto antes de compartir casa.
                </p>
              </Card>

              <Card className="bg-canvas">
                <span className="flex size-11 items-center justify-center rounded-xs bg-sunken text-foreground">
                  <MessageCircle className="size-5 text-primary" aria-hidden="true" />
                </span>
                <h3 className="text-titulo-2 text-foreground">
                  3. Armen su círculo y dividan la renta
                </h3>
                <p className="text-cuerpo text-text-secondary">
                  Platiquen con el arrendador en tiempo real y acuerden la renta
                  dividida en partes iguales sin cobros sorpresa.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Para arrendadores y Seguridad */}
        <section
          id="arrendadores"
          className="mx-auto grid max-w-[1440px] gap-6 px-4 py-14 lg:grid-cols-2 lg:px-20"
        >
          <Card className="justify-between p-8">
            <div className="flex flex-col gap-4">
              <VerifiedBadge label="Arrendador verificado" />
              <h2 className="text-titulo-web text-foreground">
                ¿Rentas cuartos o casas para estudiantes en Mérida?
              </h2>
              <p className="text-cuerpo text-text-secondary">
                Publica tu inmueble sin costo, recibe grupos completos de
                estudiantes con correo institucional confirmado y formaliza
                pre-acuerdos claros desde un solo círculo.
              </p>
              <ul className="flex flex-col gap-2 text-cuerpo text-foreground">
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-verde" aria-hidden="true" />
                  Estudiantes verificados de UTM, UADY e ITM
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-verde" aria-hidden="true" />
                  Dirección exacta protegida hasta formar un círculo
                </li>
              </ul>
            </div>
            <div className="pt-2">
              <Button variant="outline" asChild>
                <Link href="/registro?rol=arrendador">
                  Registrarme como arrendador
                </Link>
              </Button>
            </div>
          </Card>

          <Card id="seguridad" className="justify-between bg-verde-soft/55 p-8">
            <div className="flex flex-col gap-4">
              <span className="inline-flex w-fit items-center gap-2 rounded-pill bg-surface px-3 py-1 text-etiqueta text-verde">
                <ShieldCheck className="size-4" aria-hidden="true" />
                Seguridad Otoch
              </span>
              <h2 className="text-titulo-web text-foreground">
                Cero depósitos a ciegas, cero perfiles anónimos
              </h2>
              <p className="text-cuerpo text-text-secondary">
                Validamos dominios universitarios e identidad de arrendadores.
                Tus datos personales se tratan conforme a la LFPDPPP y tu
                teléfono solo es visible dentro de tus círculos activos.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild>
                <Link href="/registro">Crear cuenta gratis</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/explorar">Explorar inmuebles</Link>
              </Button>
            </div>
          </Card>
        </section>
      </main>

      <PublicFooter />

      <TabBar
        circulosActivos={usuario?.circulosActivos ?? 0}
        rol={usuario?.rol}
      />
    </div>
  );
}
