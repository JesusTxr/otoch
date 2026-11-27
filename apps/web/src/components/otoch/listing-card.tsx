"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import {
  Bed,
  Bus,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Users,
} from "lucide-react";
import { VerifiedBadge } from "@/components/otoch/verified-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatearMXN } from "@/lib/inmuebles-media";
import { cn } from "@/lib/utils";
import type { InmuebleConDetalle } from "@/types/database";

interface ListingSwipeCardProps {
  inmueble: InmuebleConDetalle;
  minutosUniversidad: number;
  siglasUniversidad: string;
  onSwipe: (decision: "me_interesa" | "descartar") => void;
  disabled?: boolean;
}

export function ListingSwipeCard({
  inmueble,
  minutosUniversidad,
  siglasUniversidad,
  onSwipe,
  disabled = false,
}: ListingSwipeCardProps) {
  const [fotoIdx, setFotoIdx] = React.useState(0);
  const fotos = inmueble.fotosUrls;
  const totalFotos = fotos.length;

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-8, 0, 8]);
  const likeOpacity = useTransform(x, [30, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-120, -30], [1, 0]);

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (disabled) return;
    if (info.offset.x > 110) {
      onSwipe("me_interesa");
    } else if (info.offset.x < -110) {
      onSwipe("descartar");
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-[500px]">
      {/* Tarjeta siguiente simulada detrás */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-3 -bottom-3 h-full rounded-lg bg-sunken lg:rounded-xl"
      />

      <motion.article
        style={{ x, rotate }}
        drag={disabled ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.75}
        onDragEnd={handleDragEnd}
        className="relative h-[470px] w-full cursor-grab select-none overflow-hidden rounded-lg bg-sunken shadow-card active:cursor-grabbing sm:h-[540px] lg:rounded-xl"
      >
        {/* Fotografía actual */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fotos[fotoIdx] ?? fotos[0]}
          alt={`${inmueble.titulo} en ${inmueble.colonia}`}
          draggable={false}
          className="size-full object-cover"
        />

        {/* Degradado inferior oficial de Otoch */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "var(--otoch-gradient-photo)" }}
        />

        {/* Sellos visuales al arrastrar */}
        <motion.span
          style={{ opacity: likeOpacity }}
          className="pointer-events-none absolute left-6 top-16 rounded-xs border-2 border-verde bg-verde-soft px-3 py-1 text-titulo-2 text-verde"
        >
          ME INTERESA
        </motion.span>
        <motion.span
          style={{ opacity: nopeOpacity }}
          className="pointer-events-none absolute right-6 top-16 rounded-xs border-2 border-danger bg-primary-soft px-3 py-1 text-titulo-2 text-danger"
        >
          DESCARTAR
        </motion.span>

        {/* Barra superior de la tarjeta: Insignia + indicadores de galería */}
        <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
          <VerifiedBadge
            estado={inmueble.arrendadorVerificado ? "verificado" : "pendiente"}
            label={
              inmueble.arrendadorVerificado
                ? "Verificado"
                : "Anuncio registrado"
            }
          />

          {totalFotos > 1 && (
            <div className="flex items-center gap-1.5" aria-label="Indicador de fotos">
              {fotos.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Ver foto ${idx + 1}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFotoIdx(idx);
                  }}
                  className={cn(
                    "h-1.5 cursor-pointer rounded-pill transition-all",
                    idx === fotoIdx
                      ? "w-6 bg-surface"
                      : "w-4 bg-surface/50 hover:bg-surface/80"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Controles laterales de galería */}
        {totalFotos > 1 && (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={(e) => {
                e.stopPropagation();
                setFotoIdx((prev) => (prev - 1 + totalFotos) % totalFotos);
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex size-9 cursor-pointer items-center justify-center rounded-pill bg-surface/80 text-foreground backdrop-blur-sm hover:bg-surface"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Foto siguiente"
              onClick={(e) => {
                e.stopPropagation();
                setFotoIdx((prev) => (prev + 1) % totalFotos);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex size-9 cursor-pointer items-center justify-center rounded-pill bg-surface/80 text-foreground backdrop-blur-sm hover:bg-surface"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </>
        )}

        {/* Información inferior sobre el degradado */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2.5 p-5 text-primary-foreground sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1 text-etiqueta text-primary-foreground/85">
                <MapPin className="size-3.5" aria-hidden="true" />
                {inmueble.colonia} · {inmueble.tipo}
              </span>
              <h2 className="mt-0.5 text-titulo-1 text-primary-foreground lg:text-titulo-web">
                <Link
                  href={`/inmuebles/${inmueble.id}`}
                  className="hover:underline focus-visible:outline-none focus-visible:underline"
                >
                  {inmueble.titulo}
                </Link>
              </h2>
            </div>

            <Link
              href={`/inmuebles/${inmueble.id}`}
              className="shrink-0 rounded-pill bg-surface/95 px-3.5 py-1.5 text-etiqueta font-semibold text-foreground shadow-subtle transition-colors hover:bg-surface"
            >
              Ver detalle
            </Link>
          </div>

          <p className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-titulo-1 text-primary-foreground">
              {formatearMXN(inmueble.rentaPorPersona)}
            </span>
            <span className="text-pequeno text-primary-foreground/90">
              / persona · renta total {formatearMXN(inmueble.renta_mensual)}
            </span>
          </p>

          <div className="flex flex-wrap items-center gap-4 text-pequeno text-primary-foreground/95">
            <span className="inline-flex items-center gap-1.5">
              <Bus className="size-4" aria-hidden="true" />
              {minutosUniversidad} min a {siglasUniversidad}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bed className="size-4" aria-hidden="true" />
              {inmueble.habitaciones}{" "}
              {inmueble.habitaciones === 1 ? "recámara" : "recámaras"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4" aria-hidden="true" />
              {inmueble.interesadosCount > 0
                ? `${inmueble.interesadosCount} buscan roomie`
                : `Hasta ${inmueble.capacidad} personas`}
            </span>
          </div>

          {inmueble.servicios_incluidos.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {inmueble.servicios_incluidos.slice(0, 4).map((serv) => (
                <span
                  key={serv}
                  className="rounded-pill bg-surface/20 px-2.5 py-0.5 text-etiqueta text-primary-foreground backdrop-blur-[2px]"
                >
                  {serv}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.article>
    </div>
  );
}

interface ListingGridCardProps {
  inmueble: InmuebleConDetalle;
  minutosUniversidad: number;
  siglasUniversidad: string;
  onMeInteresa?: () => void;
  compactHorizontal?: boolean;
}

export function ListingGridCard({
  inmueble,
  minutosUniversidad,
  siglasUniversidad,
  onMeInteresa,
  compactHorizontal = false,
}: ListingGridCardProps) {
  if (compactHorizontal) {
    return (
      <div className="flex items-center justify-between gap-3.5 rounded-sm border border-border bg-surface p-3 shadow-subtle">
        <Link
          href={`/inmuebles/${inmueble.id}`}
          className="flex min-w-0 flex-1 items-center gap-3.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={inmueble.fotosUrls[0]}
            alt={inmueble.titulo}
            className="h-20 w-24 shrink-0 rounded-xs object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-cuerpo font-semibold text-foreground">
                {inmueble.titulo}
              </h3>
              {inmueble.arrendadorVerificado && (
                <VerifiedBadge label="Verificado" />
              )}
            </div>
            <p className="mt-0.5 text-pequeno text-text-secondary">
              {formatearMXN(inmueble.rentaPorPersona)} / persona ·{" "}
              {inmueble.capacidad > 1
                ? `${inmueble.capacidad} cupos`
                : "individual"}
            </p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-etiqueta font-semibold text-verde">
              <Bus className="size-3.5" aria-hidden="true" />
              {minutosUniversidad} min a {siglasUniversidad}
            </p>
          </div>
        </Link>

        {onMeInteresa && (
          <button
            type="button"
            aria-label={`Me interesa ${inmueble.titulo}`}
            onClick={onMeInteresa}
            className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-pill border border-border bg-canvas text-foreground transition-colors hover:bg-verde-soft hover:text-verde focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Heart className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }

  return (
    <Card className="gap-4 overflow-hidden rounded-md p-0">
      <Link href={`/inmuebles/${inmueble.id}`} className="relative block h-48 w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={inmueble.fotosUrls[0]}
          alt={inmueble.titulo}
          className="size-full object-cover"
        />
        <div className="absolute left-3 top-3">
          <VerifiedBadge
            estado={inmueble.arrendadorVerificado ? "verificado" : "pendiente"}
            label={inmueble.arrendadorVerificado ? "Verificado" : inmueble.tipo}
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col justify-between gap-4 px-5 pb-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-etiqueta text-text-secondary">
            {inmueble.colonia} · {inmueble.habitaciones} rec. · {inmueble.banos}{" "}
            baños
          </span>
          <Link
            href={`/inmuebles/${inmueble.id}`}
            className="text-titulo-2 text-foreground hover:text-primary"
          >
            {inmueble.titulo}
          </Link>
          <p className="text-cuerpo font-semibold text-primary-strong">
            {formatearMXN(inmueble.rentaPorPersona)} / persona{" "}
            <span className="font-normal text-text-secondary">
              (total {formatearMXN(inmueble.renta_mensual)})
            </span>
          </p>
          <p className="inline-flex items-center gap-1.5 text-etiqueta font-semibold text-verde">
            <Bus className="size-3.5" aria-hidden="true" />
            {minutosUniversidad} min a {siglasUniversidad}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/inmuebles/${inmueble.id}`}>Ver detalle</Link>
          </Button>
          {onMeInteresa && (
            <Button
              type="button"
              size="sm"
              onClick={onMeInteresa}
              aria-label={`Me interesa ${inmueble.titulo}`}
            >
              <Heart className="size-4" aria-hidden="true" />
              Me interesa
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
