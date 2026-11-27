"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search, ShieldCheck } from "lucide-react";
import { OtochAvatar } from "@/components/otoch/avatar";
import { cn } from "@/lib/utils";
import type { CirculoResumenLista } from "@/types/database";

interface CirculosSidebarProps {
  circulos: CirculoResumenLista[];
  circuloActivoId?: string;
  totalMatches: number;
  className?: string;
}

function etiquetaEstadoCirculo(item: CirculoResumenLista): {
  texto: string;
  clases: string;
} {
  if (item.miEstado === "invitado") {
    return {
      texto: "Invitación pendiente",
      clases: "bg-oro/20 text-foreground",
    };
  }
  switch (item.estado) {
    case "en_acuerdo":
      return {
        texto: "Acordando contrato",
        clases: "bg-primary-soft text-primary-strong",
      };
    case "abierto":
      return {
        texto: "Círculo activo",
        clases: "bg-verde-soft text-verde",
      };
    case "cerrado":
      return {
        texto: "Cerrado",
        clases: "bg-foreground text-surface",
      };
    default:
      return {
        texto: "Cancelado",
        clases: "bg-sunken text-text-secondary",
      };
  }
}

export function CirculosSidebar({
  circulos,
  circuloActivoId,
  totalMatches,
  className,
}: CirculosSidebarProps) {
  const [busqueda, setBusqueda] = React.useState("");

  const filtrados = React.useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return circulos;
    return circulos.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.inmuebleColonia.toLowerCase().includes(q)
    );
  }, [circulos, busqueda]);

  return (
    <aside
      aria-label="Lista de círculos"
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-border bg-surface p-4",
        className
      )}
    >
      {/* Encabezado W06 */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-titulo-1 text-foreground">Círculos</h2>
          <p className="text-etiqueta text-text-secondary">
            Tus grupos para acordar la renta
          </p>
        </div>

        <Link
          href="/circulos?vista=matches"
          aria-label="Crear círculo desde tus matches"
          title="Ver matches y crear círculo"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-pill bg-primary text-primary-foreground shadow-subtle transition-colors hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-5" aria-hidden="true" />
        </Link>
      </div>

      {/* Buscador pill */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-secondary"
          aria-hidden="true"
        />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar círculo"
          aria-label="Buscar círculo"
          className="h-10 w-full rounded-pill bg-sunken pl-9 pr-4 text-pequeno text-foreground placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Acceso rápido a Matches */}
      <Link
        href="/matches"
        className="flex items-center justify-between rounded-xs border border-border bg-canvas px-3.5 py-2 text-pequeno font-semibold text-foreground transition-colors hover:bg-primary-soft/60"
      >
        <span>Ver mis matches activos</span>
        <span className="rounded-pill bg-primary px-2 py-0.5 text-etiqueta text-primary-foreground">
          {totalMatches}
        </span>
      </Link>

      {/* Lista de círculos */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {filtrados.length === 0 ? (
          <div className="rounded-sm bg-canvas p-5 text-center">
            <p className="text-pequeno font-semibold text-foreground">
              Sin círculos todavía
            </p>
            <p className="mt-1 text-etiqueta text-text-secondary">
              Usa el botón + para abrir un círculo a partir de un match de
              inmueble.
            </p>
          </div>
        ) : (
          filtrados.map((item) => {
            const seleccionado = item.id === circuloActivoId;
            const pill = etiquetaEstadoCirculo(item);

            return (
              <Link
                key={item.id}
                href={`/circulos/${item.id}`}
                className={cn(
                  "flex items-start gap-3 rounded-sm p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  seleccionado
                    ? "bg-primary-soft"
                    : "hover:bg-sunken/60"
                )}
              >
                {/* Avatares apilados */}
                <div className="mt-0.5 flex shrink-0 -space-x-2.5">
                  {item.avatares.slice(0, 2).map((av, idx) => (
                    <OtochAvatar
                      key={`${item.id}-${idx}`}
                      iniciales={av.iniciales}
                      nombre={av.nombre}
                      size={36}
                      tone={av.esArrendador ? "verde" : "primary"}
                      className="border-2 border-surface"
                    />
                  ))}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-pequeno font-semibold text-foreground">
                      {item.nombre}
                    </p>
                    <span className="shrink-0 text-etiqueta text-text-secondary">
                      {item.ultimoMensajeFecha}
                    </span>
                  </div>

                  <p className="mt-0.5 truncate text-etiqueta text-text-secondary">
                    {item.ultimoMensajeTexto}
                  </p>

                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "inline-flex rounded-pill px-2.5 py-0.5 text-etiqueta font-semibold",
                        pill.clases
                      )}
                    >
                      {pill.texto}
                    </span>
                    <span className="text-etiqueta text-text-secondary">
                      {item.estudiantesActivos}/{item.cupo} est.
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Aviso de seguridad 06-circulos.png */}
      <div className="flex items-start gap-2 rounded-sm bg-verde-soft p-3 text-etiqueta font-semibold text-verde">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>Nunca deposites antes de firmar el contrato dentro de Otoch.</span>
      </div>
    </aside>
  );
}
