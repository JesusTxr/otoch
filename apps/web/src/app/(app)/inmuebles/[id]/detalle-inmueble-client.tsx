"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bath,
  Bed,
  Bus,
  Calendar,
  Check,
  ChevronLeft,
  Heart,
  Image as ImageIcon,
  MapPin,
  PawPrint,
  ShieldCheck,
  Users,
  Wifi,
  X,
} from "lucide-react";
import {
  registrarSwipeAction,
  type MatchDetectadoInfo,
} from "@/app/actions/inmuebles";
import { ApproximateMap } from "@/components/otoch/approximate-map";
import { OtochAvatar } from "@/components/otoch/avatar";
import { MatchModal } from "@/components/otoch/match-modal";
import { VerifiedBadge } from "@/components/otoch/verified-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  calcularDistanciaKm,
  COORDENADAS_MERIDA_CENTRO,
  estimarMinutosTraslado,
} from "@/lib/geo";
import { formatearMXN } from "@/lib/inmuebles-media";
import type { UniversidadConCoords } from "@/lib/inmuebles-queries";
import type { DecisionSwipe, InmuebleConDetalle } from "@/types/database";

interface DetalleInmuebleClientProps {
  inmueble: InmuebleConDetalle;
  universidades: UniversidadConCoords[];
  usuarioIniciales: string;
  esPropietario: boolean;
  decisionInicial: DecisionSwipe | null;
}

export function DetalleInmuebleClient({
  inmueble,
  universidades,
  usuarioIniciales,
  esPropietario,
  decisionInicial,
}: DetalleInmuebleClientProps) {
  const [decisionActual, setDecisionActual] =
    React.useState<DecisionSwipe | null>(decisionInicial);
  const [galeriaAbierta, setGaleriaAbierta] = React.useState(false);
  const [procesando, setProcesando] = React.useState(false);
  const [aviso, setAviso] = React.useState<string | null>(null);
  const [matchActivo, setMatchActivo] =
    React.useState<MatchDetectadoInfo | null>(null);

  const fotos = inmueble.fotosUrls;
  const kmCentro = calcularDistanciaKm(
    inmueble.coordenadas,
    COORDENADAS_MERIDA_CENTRO
  );
  const minCentro = estimarMinutosTraslado(kmCentro);

  async function handleAccion(decision: DecisionSwipe) {
    setProcesando(true);
    setAviso(null);
    const res = await registrarSwipeAction({
      inmueble_id: inmueble.id,
      decision,
    });
    setProcesando(false);

    if (!res.ok) {
      setAviso(res.error ?? "No se pudo guardar tu decisión.");
      return;
    }

    setDecisionActual(decision);
    if (res.match) {
      setMatchActivo(res.match);
    } else {
      setAviso(
        decision === "me_interesa"
          ? "¡Guardado en tus inmuebles de interés! El arrendador recibirá tu solicitud."
          : "Inmueble marcado como descartado."
      );
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-20 lg:pb-6">
      {/* Migas de navegación W03 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/explorar"
          className="inline-flex items-center gap-1.5 text-pequeno font-semibold text-text-secondary hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Explorar / {inmueble.titulo}
        </Link>

        {esPropietario && (
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/mis-inmuebles/${inmueble.id}/editar`}>
              Editar mi anuncio
            </Link>
          </Button>
        )}
      </div>

      {/* Galería W03 */}
      <div className="grid gap-3 md:h-[380px] md:grid-cols-[minmax(0,1fr)_340px]">
        <button
          type="button"
          onClick={() => setGaleriaAbierta(true)}
          className="relative h-[260px] w-full cursor-pointer overflow-hidden rounded-md bg-sunken text-left md:h-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fotos[0]}
            alt={inmueble.titulo}
            className="size-full object-cover transition-transform duration-300 hover:scale-[1.02]"
          />
          <span className="absolute bottom-3 right-3 rounded-pill bg-foreground/75 px-3 py-1 text-etiqueta font-semibold text-surface md:hidden">
            1 / {fotos.length}
          </span>
        </button>

        <div className="hidden grid-rows-2 gap-3 md:grid">
          <div className="overflow-hidden rounded-md bg-sunken">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotos[1] ?? fotos[0]}
              alt={`${inmueble.titulo} vista 2`}
              className="size-full object-cover"
            />
          </div>

          <button
            type="button"
            onClick={() => setGaleriaAbierta(true)}
            className="relative cursor-pointer overflow-hidden rounded-md bg-sunken"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotos[2] ?? fotos[0]}
              alt={`${inmueble.titulo} galería`}
              className="size-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center gap-2 bg-foreground/55 text-pequeno font-semibold text-surface transition-colors hover:bg-foreground/65">
              <ImageIcon className="size-4" aria-hidden="true" />
              Ver las {fotos.length} fotos
            </span>
          </button>
        </div>
      </div>

      {aviso && (
        <div
          role="status"
          className="rounded-sm border border-verde/30 bg-verde-soft px-4 py-3 text-pequeno font-semibold text-verde"
        >
          {aviso}
        </div>
      )}

      {/* Dos columnas principales W03 */}
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Columna izquierda: información, amenidades, traslados y mapa */}
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-3">
            <h1 className="text-titulo-web text-foreground">
              {inmueble.titulo}
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-pequeno text-text-secondary">
                <MapPin className="size-4 text-primary" aria-hidden="true" />
                {inmueble.colonia}, Mérida ·{" "}
                <span className="capitalize">{inmueble.tipo}</span>
              </span>

              <VerifiedBadge
                estado={inmueble.arrendadorVerificado ? "verificado" : "pendiente"}
                label={
                  inmueble.arrendadorVerificado
                    ? "Arrendador verificado"
                    : "Arrendador registrado"
                }
              />
            </div>

            <p className="text-cuerpo leading-relaxed text-text-secondary">
              {inmueble.descripcion ||
                "Espacio estudiantil en Mérida listo para habitar, con buena conectividad hacia campus universitarios y servicios cercanos."}
            </p>
          </div>

          {/* Resumen físico */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex items-center gap-2.5 rounded-xs border border-border bg-surface p-3.5">
              <Bed className="size-5 text-primary" aria-hidden="true" />
              <div>
                <p className="text-pequeno font-semibold text-foreground">
                  {inmueble.habitaciones} rec.
                </p>
                <p className="text-etiqueta text-text-secondary">Habitaciones</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xs border border-border bg-surface p-3.5">
              <Bath className="size-5 text-primary" aria-hidden="true" />
              <div>
                <p className="text-pequeno font-semibold text-foreground">
                  {inmueble.banos}
                </p>
                <p className="text-etiqueta text-text-secondary">Baños</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xs border border-border bg-surface p-3.5">
              <Users className="size-5 text-primary" aria-hidden="true" />
              <div>
                <p className="text-pequeno font-semibold text-foreground">
                  {inmueble.capacidad} máx.
                </p>
                <p className="text-etiqueta text-text-secondary">Ocupantes</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xs border border-border bg-surface p-3.5">
              <Calendar className="size-5 text-primary" aria-hidden="true" />
              <div>
                <p className="text-pequeno font-semibold text-foreground">
                  {inmueble.disponible_desde}
                </p>
                <p className="text-etiqueta text-text-secondary">Disponible</p>
              </div>
            </div>
          </div>

          {/* Lo que incluye */}
          <div className="flex flex-col gap-3">
            <h2 className="text-titulo-2 text-foreground">Lo que incluye</h2>
            <div className="flex flex-wrap gap-2.5">
              {inmueble.amueblado && (
                <span className="inline-flex items-center gap-2 rounded-xs border border-border bg-surface px-3.5 py-2 text-pequeno font-semibold text-foreground">
                  <Bed className="size-4 text-primary" aria-hidden="true" />
                  Amueblado
                </span>
              )}

              {inmueble.servicios_incluidos.map((serv) => {
                const lower = serv.toLowerCase();
                return (
                  <span
                    key={serv}
                    className="inline-flex items-center gap-2 rounded-xs border border-border bg-surface px-3.5 py-2 text-pequeno font-semibold text-foreground"
                  >
                    {lower.includes("internet") ? (
                      <Wifi className="size-4 text-primary" aria-hidden="true" />
                    ) : lower.includes("mascota") ? (
                      <PawPrint className="size-4 text-primary" aria-hidden="true" />
                    ) : (
                      <Check className="size-4 text-verde" aria-hidden="true" />
                    )}
                    {serv}
                  </span>
                );
              })}

              {!inmueble.amueblado &&
                inmueble.servicios_incluidos.length === 0 && (
                  <span className="text-pequeno text-text-secondary">
                    Consulta servicios adicionales directamente en el círculo.
                  </span>
                )}
            </div>
          </div>

          {/* Reglas de convivencia */}
          {inmueble.reglas && (
            <div className="flex flex-col gap-2">
              <h2 className="text-titulo-2 text-foreground">
                Reglas de la vivienda
              </h2>
              <Card className="rounded-sm bg-canvas p-4">
                <p className="text-cuerpo text-foreground">{inmueble.reglas}</p>
              </Card>
            </div>
          )}

          {/* Traslado a tu escuela */}
          <div className="flex flex-col gap-3">
            <h2 className="text-titulo-2 text-foreground">
              Traslado a universidades en Mérida
            </h2>

            <Card className="gap-3.5 rounded-md p-5">
              {universidades.map((u) => {
                const km = calcularDistanciaKm(
                  inmueble.coordenadas,
                  u.coordenadas
                );
                const mins = estimarMinutosTraslado(km);
                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xs bg-verde-soft text-verde">
                        <Bus className="size-5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-cuerpo font-semibold text-foreground">
                          {u.siglas ? `${u.siglas} · ${u.nombre}` : u.nombre}
                        </p>
                        <p className="text-etiqueta text-text-secondary">
                          Distancia aprox. {km} km en Mérida
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-titulo-2 text-verde">
                      {mins} min
                    </span>
                  </div>
                );
              })}

              <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xs bg-verde-soft text-verde">
                    <Bus className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-cuerpo font-semibold text-foreground">
                      Centro Histórico de Mérida
                    </p>
                    <p className="text-etiqueta text-text-secondary">
                      Distancia aprox. {kmCentro} km
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-titulo-2 text-verde">
                  {minCentro} min
                </span>
              </div>
            </Card>
          </div>

          {/* Mapa de ubicación aproximada (Mapbox o fallback OpenStreetMap) */}
          <div className="flex flex-col gap-2.5">
            <h2 className="text-titulo-2 text-foreground">
              Ubicación aproximada
            </h2>
            <p className="text-etiqueta text-text-secondary">
              Por seguridad, la dirección exacta únicamente se comparte dentro
              de un círculo activo con el arrendador.
            </p>
            <ApproximateMap
              coordenadas={inmueble.coordenadas}
              semillaPrivacidad={inmueble.id}
              colonia={inmueble.colonia}
              alturaClase="h-[300px]"
            />
          </div>
        </div>

        {/* Columna derecha: tarjeta sticky de renta y acciones W03 */}
        <aside className="lg:sticky lg:top-8">
          <Card className="gap-5 rounded-lg p-6 shadow-sticky">
            <div>
              <p className="flex items-baseline gap-1.5">
                <span className="text-titulo-web text-foreground">
                  {formatearMXN(inmueble.rentaPorPersona)}
                </span>
                <span className="text-pequeno text-text-secondary">
                  por persona / mes
                </span>
              </p>
            </div>

            <div className="flex flex-col gap-2.5 rounded-sm bg-primary-soft p-4">
              <div className="flex justify-between text-pequeno">
                <span className="text-text-secondary">Renta mensual total</span>
                <span className="font-semibold text-foreground">
                  {formatearMXN(inmueble.renta_mensual)}
                </span>
              </div>

              <div className="flex justify-between text-pequeno">
                <span className="text-text-secondary">
                  Integrantes del círculo
                </span>
                <span className="font-semibold text-foreground">
                  {inmueble.capacidad}
                </span>
              </div>

              <div className="flex justify-between text-pequeno">
                <span className="text-text-secondary">Depósito en garantía</span>
                <span className="font-semibold text-foreground">
                  {formatearMXN(inmueble.deposito)}
                </span>
              </div>

              <div
                className="mt-1 grid grid-cols-3 gap-2"
                aria-label="División de renta en partes iguales"
              >
                <span className="h-2 rounded-pill bg-primary" />
                <span className="h-2 rounded-pill bg-verde" />
                <span className="h-2 rounded-pill bg-oro" />
              </div>
            </div>

            {!esPropietario && (
              <div className="flex flex-col gap-2.5">
                <Button
                  type="button"
                  disabled={procesando}
                  onClick={() => handleAccion("me_interesa")}
                  className="w-full"
                >
                  <Heart className="size-4" aria-hidden="true" />
                  {decisionActual === "me_interesa"
                    ? "Marcado como Me interesa"
                    : "Me interesa"}
                </Button>

                <div className="grid grid-cols-2 gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={procesando}
                    onClick={() => handleAccion("descartar")}
                  >
                    <X className="size-4 text-danger" aria-hidden="true" />
                    Descartar
                  </Button>

                  <Button variant="secondary" size="sm" asChild>
                    <Link href={`/roomies?inmueble=${inmueble.id}`}>
                      Buscar roomies
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 border-t border-border pt-4">
              <OtochAvatar
                iniciales={inmueble.arrendadorIniciales}
                nombre={inmueble.arrendadorNombre}
                size={44}
                tone="verde"
              />
              <div className="min-w-0">
                <p className="truncate text-cuerpo font-semibold text-foreground">
                  {inmueble.arrendadorNombre}
                </p>
                <p className="text-etiqueta text-text-secondary">
                  {inmueble.arrendadorVerificado
                    ? "Arrendador verificado en Otoch"
                    : "Arrendador registrado"}
                </p>
              </div>
            </div>

            <p className="flex items-center gap-2 text-etiqueta font-semibold text-verde">
              <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
              No pagues nada antes de firmar en Otoch
            </p>
          </Card>
        </aside>
      </div>

      {/* Barra inferior fija móvil (03-detalle.png) */}
      {!esPropietario && (
        <div className="fixed inset-x-0 bottom-[84px] z-30 flex items-center justify-between gap-3 border-t border-border bg-surface px-4 py-3 lg:hidden">
          <div>
            <p className="text-titulo-2 text-foreground">
              {formatearMXN(inmueble.rentaPorPersona)}
            </p>
            <p className="text-etiqueta text-text-secondary">por persona / mes</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Descartar inmueble"
              disabled={procesando}
              onClick={() => handleAccion("descartar")}
            >
              <X className="size-5 text-danger" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={procesando}
              onClick={() => handleAccion("me_interesa")}
            >
              Me interesa
            </Button>
          </div>
        </div>
      )}

      {/* Modal de galería completa */}
      <Dialog open={galeriaAbierta} onOpenChange={setGaleriaAbierta}>
        <DialogContent className="max-h-[90dvh] max-w-[780px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fotografías · {inmueble.titulo}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 pt-2">
            {fotos.map((src, idx) => (
              <div
                key={`${src}-${idx}`}
                className="overflow-hidden rounded-md bg-sunken"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${inmueble.titulo} foto ${idx + 1}`}
                  className="max-h-[420px] w-full object-cover"
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <MatchModal
        match={matchActivo}
        usuarioIniciales={usuarioIniciales}
        onClose={() => setMatchActivo(null)}
      />
    </div>
  );
}
