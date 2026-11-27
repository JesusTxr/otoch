"use client";

import Link from "next/link";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Heart, Wallet } from "lucide-react";
import type { MatchDetectadoInfo } from "@/app/actions/inmuebles";
import { OtochAvatar } from "@/components/otoch/avatar";
import { Button } from "@/components/ui/button";
import { formatearMXN } from "@/lib/inmuebles-media";

interface MatchModalProps {
  match: MatchDetectadoInfo | null;
  usuarioIniciales: string;
  onClose: () => void;
}

export function MatchModal({
  match,
  usuarioIniciales,
  onClose,
}: MatchModalProps) {
  return (
    <DialogPrimitive.Root
      open={Boolean(match)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-[1px]" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-[520px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-surface shadow-modal focus:outline-none">
          {/* Portada naranja con 3 anillos concéntricos blancos (W05) */}
          <div className="relative flex h-[220px] items-center justify-center overflow-hidden bg-primary">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute size-[200px] rounded-pill border border-surface/15"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute size-[300px] rounded-pill border border-surface/12"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute size-[410px] rounded-pill border border-surface/10"
            />

            <div className="relative flex items-center">
              <OtochAvatar
                iniciales={usuarioIniciales}
                size={112}
                tone="primary"
                className="border-[5px] border-surface shadow-card"
              />
              <span className="z-10 -mx-4 flex size-11 items-center justify-center rounded-pill bg-surface text-primary shadow-action">
                <Heart className="size-5 fill-primary" aria-hidden="true" />
              </span>
              <OtochAvatar
                iniciales={match?.contraparteIniciales ?? "MR"}
                size={112}
                tone="verde"
                className="border-[5px] border-surface bg-surface text-primary shadow-card"
              />
            </div>
          </div>

          {/* Cuerpo centrado W05 */}
          <div className="flex flex-col items-center gap-4 px-7 pb-8 pt-7 text-center sm:px-10">
            <DialogPrimitive.Title className="text-titulo-web text-foreground">
              ¡Es un match!
            </DialogPrimitive.Title>

            <DialogPrimitive.Description className="text-cuerpo text-text-secondary">
              {match?.tipo === "roomies"
                ? `Tú y ${match.contraparteNombre} hicieron match como roomies compatibles en Mérida. Ya pueden coordinar su círculo y buscar vivienda juntos.`
                : `Tú y ${match?.contraparteNombre} coincidieron en ${match?.inmuebleTitulo ?? "este inmueble"}. Ya pueden avanzar para armar su círculo.`}
            </DialogPrimitive.Description>

            <span className="inline-flex items-center gap-2 rounded-pill bg-verde-soft px-4 py-1.5 text-pequeno font-semibold text-verde">
              <Wallet className="size-4" aria-hidden="true" />
              {match?.rentaPorPersona
                ? `${formatearMXN(match.rentaPorPersona)} c/u`
                : "Interés mutuo confirmado"}
              {match?.compatibilidad != null
                ? ` · ${Math.round(match.compatibilidad)}% compatibles`
                : ""}
            </span>

            <div className="mt-2 grid w-full gap-3 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Seguir explorando
              </Button>
              <Button asChild>
                <Link href="/circulos?vista=matches" onClick={onClose}>
                  Ir a Matches y Círculos
                </Link>
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
