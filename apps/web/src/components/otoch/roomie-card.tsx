"use client";

import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import {
  BookOpen,
  Calendar,
  Clock,
  Moon,
  PawPrint,
  Wallet,
} from "lucide-react";
import { VerifiedBadge } from "@/components/otoch/verified-badge";
import { formatearMXN } from "@/lib/inmuebles-media";
import type { RoomieCandidato } from "@/types/database";

interface RoomieSwipeCardProps {
  roomie: RoomieCandidato;
  onSwipe: (decision: "me_interesa" | "descartar") => void;
  disabled?: boolean;
}

export function RoomieSwipeCard({
  roomie,
  onSwipe,
  disabled = false,
}: RoomieSwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-7, 0, 7]);

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (disabled) return;
    if (info.offset.x > 105) {
      onSwipe("me_interesa");
    } else if (info.offset.x < -105) {
      onSwipe("descartar");
    }
  }

  const etiquetaSueno =
    roomie.preferencias.horario_sueno === "temprano"
      ? "Madrugador(a)"
      : roomie.preferencias.horario_sueno === "nocturno"
        ? "Nocturno(a)"
        : "Horario regular";

  const etiquetaRuido =
    roomie.preferencias.tolerancia_ruido <= 2
      ? "Silencio después de 11"
      : roomie.preferencias.tolerancia_ruido >= 4
        ? "Ambiente sociable"
        : "Ruido moderado";

  return (
    <motion.article
      style={{ x, rotate }}
      drag={disabled ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.75}
      onDragEnd={handleDragEnd}
      className="mx-auto grid w-full max-w-[680px] cursor-grab select-none overflow-hidden rounded-xl border border-border bg-surface shadow-card active:cursor-grabbing md:min-h-[450px] md:grid-cols-[240px_minmax(0,1fr)]"
    >
      {/* Panel izquierdo con degradado roomie W04 */}
      <div
        className="relative flex flex-col items-center justify-center gap-4 p-6"
        style={{ background: "var(--otoch-gradient-roomie)" }}
      >
        <div className="flex size-[124px] items-center justify-center rounded-pill border-[5px] border-surface bg-surface text-display text-primary shadow-card">
          {roomie.iniciales}
        </div>

        <div className="rounded-sm bg-surface px-5 py-2.5 text-center shadow-subtle">
          <p className="text-titulo-1 text-verde">
            {roomie.compatibilidadTotal}%
          </p>
          <p className="text-etiqueta text-text-secondary">compatible</p>
        </div>
      </div>

      {/* Panel derecho de detalles del estudiante */}
      <div className="flex flex-col justify-between gap-4 p-6 sm:p-7">
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-titulo-web text-foreground">
              {roomie.nombre}, {roomie.edad}
            </h2>
            <VerifiedBadge
              estado={roomie.verificado ? "verificado" : "pendiente"}
              label={roomie.verificado ? "Verificado" : "Estudiante"}
            />
          </div>

          <p className="flex items-center gap-2 text-pequeno text-text-secondary">
            <BookOpen className="size-4 shrink-0" aria-hidden="true" />
            <span>
              {roomie.carrera} · {roomie.universidadSiglas}
              {roomie.periodoActual ? ` · ${roomie.periodoActual}º periodo` : ""}
            </span>
          </p>

          <p className="text-cuerpo text-foreground">
            {roomie.biografia ||
              `${roomie.municipioOrigen ? `Soy de ${roomie.municipioOrigen}, ` : ""}estudio en ${roomie.universidadSiglas} y busco roomies compatibles para compartir renta en Mérida.`}
          </p>

          {/* Chips de hábitos e intereses */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-sunken px-3 py-1.5 text-etiqueta font-semibold text-foreground">
              <Clock className="size-3.5" aria-hidden="true" />
              {etiquetaSueno}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-pill bg-sunken px-3 py-1.5 text-etiqueta font-semibold text-foreground">
              <Moon className="size-3.5" aria-hidden="true" />
              {etiquetaRuido}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-pill bg-sunken px-3 py-1.5 text-etiqueta font-semibold text-foreground">
              <PawPrint className="size-3.5" aria-hidden="true" />
              {roomie.preferencias.acepta_mascotas
                ? "Mascotas OK"
                : "Sin mascotas"}
            </span>

            <span className="inline-flex items-center rounded-pill bg-sunken px-3 py-1.5 text-etiqueta font-semibold text-foreground">
              {roomie.preferencias.fuma ? "Fuma" : "No fuma"}
            </span>

            <span className="inline-flex items-center rounded-pill bg-sunken px-3 py-1.5 text-etiqueta font-semibold text-foreground">
              Limpieza {roomie.preferencias.limpieza}/5
            </span>

            {roomie.preferencias.intereses.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-pill bg-primary-soft/60 px-3 py-1.5 text-etiqueta font-semibold text-primary-strong"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Bloque inferior de presupuesto y mudanza */}
        <div className="flex items-center justify-between gap-3 rounded-sm bg-primary-soft px-4 py-3.5">
          <div>
            <p className="text-etiqueta text-text-secondary">
              Presupuesto mensual máx.
            </p>
            <p className="text-titulo-2 text-primary-strong">
              Hasta {formatearMXN(roomie.presupuestoMax)} / mes
            </p>
            {roomie.fechaMudanza && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-etiqueta text-text-secondary">
                <Calendar className="size-3" aria-hidden="true" />
                Mudanza: {roomie.fechaMudanza}
              </p>
            )}
          </div>
          <Wallet className="size-6 shrink-0 text-primary" aria-hidden="true" />
        </div>
      </div>
    </motion.article>
  );
}
