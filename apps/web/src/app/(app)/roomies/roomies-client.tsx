"use client";

import * as React from "react";
import Link from "next/link";
import { House, SlidersHorizontal, Users } from "lucide-react";
import {
  registrarSwipeAction,
  type MatchDetectadoInfo,
} from "@/app/actions/inmuebles";
import { OtochAvatar } from "@/components/otoch/avatar";
import { FilterChip } from "@/components/otoch/filter-chip";
import { MatchModal } from "@/components/otoch/match-modal";
import { RoomieSwipeCard } from "@/components/otoch/roomie-card";
import { SwipeActions } from "@/components/otoch/swipe-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RoomieCandidato, Universidad } from "@/types/database";

interface RoomiesClientProps {
  usuarioIniciales: string;
  inmuebleContextoTitulo: string | null;
  candidatosIniciales: RoomieCandidato[];
  universidades: Universidad[];
}

export function RoomiesClient({
  usuarioIniciales,
  inmuebleContextoTitulo,
  candidatosIniciales,
  universidades,
}: RoomiesClientProps) {
  const [evaluadosIds, setEvaluadosIds] = React.useState<Set<string>>(
    () => new Set()
  );
  const [universidadFiltro, setUniversidadFiltro] =
    React.useState<string>("todas");
  const [soloNoFumadores, setSoloNoFumadores] = React.useState(false);
  const [soloAceptaMascotas, setSoloAceptaMascotas] = React.useState(false);
  const [procesando, setProcesando] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [matchActivo, setMatchActivo] =
    React.useState<MatchDetectadoInfo | null>(null);

  const candidatos = React.useMemo(() => {
    return candidatosIniciales.filter((c) => {
      if (evaluadosIds.has(c.perfilId)) return false;
      if (
        universidadFiltro !== "todas" &&
        c.universidadId !== universidadFiltro
      ) {
        return false;
      }
      if (soloNoFumadores && c.preferencias.fuma) {
        return false;
      }
      if (soloAceptaMascotas && !c.preferencias.acepta_mascotas) {
        return false;
      }
      return true;
    });
  }, [
    candidatosIniciales,
    evaluadosIds,
    universidadFiltro,
    soloNoFumadores,
    soloAceptaMascotas,
  ]);

  const actual = candidatos[0] ?? null;
  const siguientes = candidatos.slice(1, 4);

  async function ejecutarSwipeRoomie(
    perfilObjetivoId: string,
    decision: "me_interesa" | "descartar"
  ) {
    if (procesando) return;
    setErrorMsg(null);
    setProcesando(true);

    setEvaluadosIds((prev) => {
      const next = new Set(prev);
      next.add(perfilObjetivoId);
      return next;
    });

    const res = await registrarSwipeAction({
      perfil_objetivo_id: perfilObjetivoId,
      decision,
    });
    setProcesando(false);

    if (!res.ok) {
      setErrorMsg(res.error ?? "No se pudo guardar tu evaluación.");
      return;
    }

    if (res.match) {
      setMatchActivo(res.match);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado W04 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-titulo-web text-foreground">Roomies</h1>
          <p className="mt-1 text-pequeno text-text-secondary">
            {inmuebleContextoTitulo
              ? `Para: ${inmuebleContextoTitulo} · `
              : "Mérida · "}
            {candidatos.length}{" "}
            {candidatos.length === 1
              ? "perfil compatible"
              : "perfiles compatibles"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {inmuebleContextoTitulo && (
            <span className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface px-4 py-2 text-pequeno font-semibold text-foreground">
              <House className="size-4 text-primary" aria-hidden="true" />
              {inmuebleContextoTitulo}
            </span>
          )}

          <div className="inline-flex items-center gap-2">
            <SlidersHorizontal
              className="size-4 text-text-secondary"
              aria-hidden="true"
            />
            <label htmlFor="roomie-uni-select" className="sr-only">
              Filtrar por universidad
            </label>
            <select
              id="roomie-uni-select"
              value={universidadFiltro}
              onChange={(e) => setUniversidadFiltro(e.target.value)}
              className="h-10 rounded-pill border border-border bg-surface px-3.5 text-pequeno font-semibold text-foreground"
            >
              <option value="todas">Todas las escuelas</option>
              {universidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.siglas ?? u.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filtros rápidos de hábitos */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <FilterChip
          active={
            universidadFiltro === "todas" &&
            !soloNoFumadores &&
            !soloAceptaMascotas
          }
          onClick={() => {
            setUniversidadFiltro("todas");
            setSoloNoFumadores(false);
            setSoloAceptaMascotas(false);
          }}
        >
          Todos
        </FilterChip>
        <FilterChip
          active={soloNoFumadores}
          onClick={() => setSoloNoFumadores((p) => !p)}
        >
          No fuma
        </FilterChip>
        <FilterChip
          active={soloAceptaMascotas}
          onClick={() => setSoloAceptaMascotas((p) => !p)}
        >
          Mascotas OK
        </FilterChip>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="rounded-sm border border-danger/30 bg-primary-soft px-4 py-3 text-pequeno font-semibold text-danger"
        >
          {errorMsg}
        </div>
      )}

      {!actual ? (
        <Card className="items-center gap-4 rounded-xl p-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-pill bg-verde-soft text-verde">
            <Users className="size-6" aria-hidden="true" />
          </span>
          <h2 className="text-titulo-1 text-foreground">
            No hay más perfiles por evaluar en este momento
          </h2>
          <p className="max-w-[500px] text-cuerpo text-text-secondary">
            Ya revisaste todos los estudiantes compatibles disponibles con tus
            filtros actuales. Explora inmuebles o vuelve pronto para ver nuevos
            perfiles verificados.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-1">
            {(universidadFiltro !== "todas" ||
              soloNoFumadores ||
              soloAceptaMascotas) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUniversidadFiltro("todas");
                  setSoloNoFumadores(false);
                  setSoloAceptaMascotas(false);
                }}
              >
                Quitar filtros
              </Button>
            )}
            <Button asChild>
              <Link href="/explorar">Explorar inmuebles</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,680px)_minmax(0,1fr)]">
          {/* Columna izquierda: tarjeta swipe roomie + botones */}
          <div className="flex flex-col items-center gap-6">
            <RoomieSwipeCard
              key={actual.perfilId}
              roomie={actual}
              disabled={procesando}
              onSwipe={(decision) =>
                ejecutarSwipeRoomie(actual.perfilId, decision)
              }
            />

            <SwipeActions
              disabled={procesando}
              onDescartar={() =>
                ejecutarSwipeRoomie(actual.perfilId, "descartar")
              }
              onMeInteresa={() =>
                ejecutarSwipeRoomie(actual.perfilId, "me_interesa")
              }
            />
          </div>

          {/* Columna derecha W04: Por qué hacen match + Siguientes en tu fila */}
          <div className="flex flex-col gap-6">
            <Card className="gap-4 rounded-lg p-6">
              <h2 className="text-titulo-2 text-foreground">
                Por qué hacen match
              </h2>

              {(
                [
                  { label: "Horarios", valor: actual.desglose.horarios },
                  {
                    label: "Orden y limpieza",
                    valor: actual.desglose.limpieza,
                  },
                  { label: "Presupuesto", valor: actual.desglose.presupuesto },
                  {
                    label: "Ruido y visitas",
                    valor: actual.desglose.ruidoVisitas,
                  },
                  { label: "Mascotas", valor: actual.desglose.mascotas },
                ] as const
              ).map((barra) => {
                const esAlto = barra.valor >= 85;
                return (
                  <div key={barra.label} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-pequeno">
                      <span className="font-semibold text-foreground">
                        {barra.label}
                      </span>
                      <span
                        className={cn(
                          "font-semibold",
                          esAlto ? "text-verde" : "text-oro"
                        )}
                      >
                        {barra.valor}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-pill bg-sunken">
                      <div
                        className={cn(
                          "h-full rounded-pill transition-all",
                          esAlto ? "bg-verde" : "bg-oro"
                        )}
                        style={{ width: `${barra.valor}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </Card>

            <Card className="gap-4 rounded-lg p-6">
              <h2 className="text-titulo-2 text-foreground">
                Siguientes en tu fila
              </h2>

              {siguientes.length === 0 ? (
                <p className="text-pequeno text-text-secondary">
                  No hay más perfiles pendientes detrás de esta tarjeta.
                </p>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {siguientes.map((cand, idx) => (
                    <div
                      key={cand.perfilId}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <OtochAvatar
                          iniciales={cand.iniciales}
                          nombre={cand.nombre}
                          size={40}
                          tone={idx % 2 === 0 ? "primary" : "verde"}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-pequeno font-semibold text-foreground">
                            {cand.nombre}, {cand.edad}
                          </p>
                          <p className="truncate text-etiqueta text-text-secondary">
                            {cand.carrera} · {cand.universidadSiglas}
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 text-pequeno font-semibold text-verde">
                        {cand.compatibilidadTotal}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      <MatchModal
        match={matchActivo}
        usuarioIniciales={usuarioIniciales}
        onClose={() => setMatchActivo(null)}
      />
    </div>
  );
}
