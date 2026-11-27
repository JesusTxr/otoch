"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bed,
  BookOpen,
  Check,
  Heart,
  House,
  MapPin,
  Plus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  cambiarEstadoInmuebleAction,
  registrarSwipeAction,
  type MatchDetectadoInfo,
} from "@/app/actions/inmuebles";
import { OtochAvatar } from "@/components/otoch/avatar";
import { MatchModal } from "@/components/otoch/match-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatearMXN } from "@/lib/inmuebles-media";
import { cn } from "@/lib/utils";
import type { EstadoInmueble } from "@/types/database";

export interface PropiedadArrendadorItem {
  id: string;
  titulo: string;
  colonia: string;
  tipo: string;
  renta_mensual: number;
  capacidad: number;
  habitaciones: number;
  estado: EstadoInmueble;
  disponible_desde: string;
  fotoPortada: string;
  interesadosPendientes: number;
}

export interface EstudianteInteresadoItem {
  swipeId: number;
  inmuebleId: string;
  inmuebleTitulo: string;
  estudianteId: string;
  nombreCompleto: string;
  iniciales: string;
  carrera: string;
  universidadSiglas: string;
  presupuestoMax: number | null;
  verificado: boolean;
  yaEvaluadoDecision: "me_interesa" | "descartar" | null;
  esMatchActivo: boolean;
}

interface MisInmueblesClientProps {
  arrendadorIniciales: string;
  guardadoReciente: boolean;
  propiedades: PropiedadArrendadorItem[];
  interesados: EstudianteInteresadoItem[];
}

const ESTADO_ESTILOS: Record<EstadoInmueble, string> = {
  publicado: "bg-verde-soft text-verde",
  borrador: "bg-sunken text-text-secondary",
  pausado: "bg-primary-soft text-primary-strong",
  rentado: "bg-foreground text-surface",
};

export function MisInmueblesClient({
  arrendadorIniciales,
  guardadoReciente,
  propiedades,
  interesados,
}: MisInmueblesClientProps) {
  const router = useRouter();
  const [procesandoId, setProcesandoId] = React.useState<string | null>(null);
  const [matchActivo, setMatchActivo] =
    React.useState<MatchDetectadoInfo | null>(null);
  const [aviso, setAviso] = React.useState<string | null>(
    guardadoReciente ? "¡Inmueble guardado correctamente!" : null
  );

  async function handleCambioEstado(id: string, nuevoEstado: EstadoInmueble) {
    setProcesandoId(id);
    const res = await cambiarEstadoInmuebleAction(id, nuevoEstado);
    setProcesandoId(null);
    if (res.ok) {
      setAviso(res.message ?? "Estado actualizado.");
      router.refresh();
    } else {
      setAviso(res.error ?? "No se pudo cambiar el estado.");
    }
  }

  async function handleResponderInteresado(
    item: EstudianteInteresadoItem,
    decision: "me_interesa" | "descartar"
  ) {
    const key = `${item.inmuebleId}-${item.estudianteId}`;
    setProcesandoId(key);
    const res = await registrarSwipeAction({
      inmueble_id: item.inmuebleId,
      perfil_objetivo_id: item.estudianteId,
      decision,
    });
    setProcesandoId(null);

    if (!res.ok) {
      setAviso(res.error ?? "No se pudo guardar la respuesta.");
      return;
    }

    if (res.match) {
      setMatchActivo(res.match);
    } else {
      setAviso(
        decision === "me_interesa"
          ? `Aceptaste a ${item.nombreCompleto}.`
          : `Descartaste la solicitud de ${item.nombreCompleto}.`
      );
    }
    router.refresh();
  }

  const pendientesCount = interesados.filter(
    (i) => !i.yaEvaluadoDecision
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-titulo-web text-foreground">Mis inmuebles</h1>
          <p className="mt-1 text-pequeno text-text-secondary">
            Administra tus propiedades y revisa a los estudiantes interesados
          </p>
        </div>

        <Button asChild>
          <Link href="/mis-inmuebles/nuevo">
            <Plus className="size-4" aria-hidden="true" />
            Publicar inmueble
          </Link>
        </Button>
      </div>

      {aviso && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-sm border border-verde/30 bg-verde-soft px-4 py-3 text-pequeno font-semibold text-verde"
        >
          <span>{aviso}</span>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => setAviso(null)}
            className="cursor-pointer rounded-pill p-1 hover:bg-surface/60"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <Tabs defaultValue="propiedades">
        <TabsList>
          <TabsTrigger value="propiedades">
            Propiedades ({propiedades.length})
          </TabsTrigger>
          <TabsTrigger value="interesados">
            Interesados ({interesados.length}
            {pendientesCount > 0 ? ` · ${pendientesCount} nuevos` : ""})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="propiedades" className="pt-2">
          {propiedades.length === 0 ? (
            <Card className="items-start gap-4 rounded-xl p-8">
              <span className="flex size-12 items-center justify-center rounded-sm bg-primary-soft text-primary-strong">
                <House className="size-6" aria-hidden="true" />
              </span>
              <h2 className="text-titulo-1 text-foreground">
                Aún no has publicado ningún inmueble
              </h2>
              <p className="max-w-[540px] text-cuerpo text-text-secondary">
                Publica tu casa, departamento o cuarto estudiantil en Mérida para
                aparecer en el feed de Explorar y recibir estudiantes verificados.
              </p>
              <Button asChild>
                <Link href="/mis-inmuebles/nuevo">
                  <Plus className="size-4" aria-hidden="true" />
                  Crear mi primer anuncio
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {propiedades.map((prop) => {
                const porPersona = Math.round(
                  prop.renta_mensual / Math.max(1, prop.capacidad)
                );
                return (
                  <Card
                    key={prop.id}
                    className="gap-4 overflow-hidden rounded-lg p-0"
                  >
                    <div className="relative h-48 w-full bg-sunken">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={prop.fotoPortada}
                        alt={prop.titulo}
                        className="size-full object-cover"
                      />
                      <span
                        className={cn(
                          "absolute left-3 top-3 rounded-pill px-3 py-1 text-etiqueta font-semibold capitalize",
                          ESTADO_ESTILOS[prop.estado]
                        )}
                      >
                        {prop.estado}
                      </span>
                    </div>

                    <div className="flex flex-col gap-4 px-5 pb-5">
                      <div>
                        <p className="flex items-center gap-1 text-etiqueta text-text-secondary">
                          <MapPin className="size-3.5 text-primary" aria-hidden="true" />
                          {prop.colonia} · {prop.tipo}
                        </p>
                        <h3 className="mt-0.5 text-titulo-2 text-foreground">
                          {prop.titulo}
                        </h3>
                        <p className="mt-1 text-pequeno font-semibold text-primary-strong">
                          {formatearMXN(prop.renta_mensual)} / mes ·{" "}
                          <span className="font-normal text-text-secondary">
                            {formatearMXN(porPersona)} por persona ({prop.capacidad}{" "}
                            cupos)
                          </span>
                        </p>
                        <div className="mt-2 flex flex-wrap gap-3 text-etiqueta text-text-secondary">
                          <span className="inline-flex items-center gap-1">
                            <Bed className="size-3.5" aria-hidden="true" />
                            {prop.habitaciones} rec.
                          </span>
                          <span className="inline-flex items-center gap-1 text-verde font-semibold">
                            <Users className="size-3.5" aria-hidden="true" />
                            {prop.interesadosPendientes} interesados nuevos
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`estado-${prop.id}`}
                            className="sr-only"
                          >
                            Cambiar estado de {prop.titulo}
                          </label>
                          <select
                            id={`estado-${prop.id}`}
                            value={prop.estado}
                            disabled={procesandoId === prop.id}
                            onChange={(e) =>
                              handleCambioEstado(
                                prop.id,
                                e.target.value as EstadoInmueble
                              )
                            }
                            className="h-9 rounded-btn border border-input bg-surface px-2.5 text-etiqueta font-semibold text-foreground"
                          >
                            <option value="publicado">Publicado</option>
                            <option value="borrador">Borrador</option>
                            <option value="pausado">Pausado</option>
                            <option value="rentado">Rentado</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/inmuebles/${prop.id}`}>Ver</Link>
                          </Button>
                          <Button variant="secondary" size="sm" asChild>
                            <Link href={`/mis-inmuebles/${prop.id}/editar`}>
                              Editar
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="interesados" className="pt-2">
          {interesados.length === 0 ? (
            <Card className="items-start gap-3 rounded-xl p-8">
              <Users className="size-8 text-primary" aria-hidden="true" />
              <h2 className="text-titulo-2 text-foreground">
                Aún no hay swipes de estudiantes interesados
              </h2>
              <p className="max-w-[540px] text-cuerpo text-text-secondary">
                Cuando un estudiante deslice a la derecha o pulse{" "}
                <strong>Me interesa</strong> en alguno de tus inmuebles
                publicados, aparecerá aquí para que puedas aceptarlo y generar el
                match mutuo.
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {interesados.map((item) => {
                const key = `${item.inmuebleId}-${item.estudianteId}`;
                const cargando = procesandoId === key;

                return (
                  <Card
                    key={item.swipeId}
                    className="flex-col justify-between gap-4 rounded-lg p-5 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-3.5">
                      <OtochAvatar
                        iniciales={item.iniciales}
                        nombre={item.nombreCompleto}
                        size={44}
                        tone={item.verificado ? "verde" : "primary"}
                      />
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-cuerpo font-semibold text-foreground">
                            {item.nombreCompleto}
                          </p>
                          <span className="rounded-pill bg-primary-soft px-2.5 py-0.5 text-etiqueta font-semibold text-primary-strong">
                            Interesado en: {item.inmuebleTitulo}
                          </span>
                        </div>

                        <p className="flex flex-wrap items-center gap-3 text-pequeno text-text-secondary">
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="size-3.5" aria-hidden="true" />
                            {item.carrera} · {item.universidadSiglas}
                          </span>
                          {item.presupuestoMax && (
                            <span className="inline-flex items-center gap-1">
                              <Wallet className="size-3.5" aria-hidden="true" />
                              Presupuesto: {formatearMXN(item.presupuestoMax)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {item.esMatchActivo ||
                      item.yaEvaluadoDecision === "me_interesa" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-pill bg-verde-soft px-3.5 py-1.5 text-pequeno font-semibold text-verde">
                          <Check className="size-4" aria-hidden="true" />
                          ¡Match confirmado!
                        </span>
                      ) : item.yaEvaluadoDecision === "descartar" ? (
                        <span className="rounded-pill bg-sunken px-3.5 py-1.5 text-pequeno text-text-secondary">
                          Descartado
                        </span>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={cargando}
                            onClick={() =>
                              handleResponderInteresado(item, "descartar")
                            }
                          >
                            <X className="size-4 text-danger" aria-hidden="true" />
                            Descartar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={cargando}
                            onClick={() =>
                              handleResponderInteresado(item, "me_interesa")
                            }
                          >
                            <Heart className="size-4" aria-hidden="true" />
                            Me interesa (Match)
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <MatchModal
        match={matchActivo}
        usuarioIniciales={arrendadorIniciales}
        onClose={() => setMatchActivo(null)}
      />
    </div>
  );
}
