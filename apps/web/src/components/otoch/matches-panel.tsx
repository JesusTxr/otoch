"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Check,
  Heart,
  House,
  MessageCircle,
  Plus,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  crearCirculoDesdeMatchAction,
  invitarRoomieACirculoAction,
  responderInvitacionCirculoAction,
} from "@/app/actions/circulos";
import { OtochAvatar } from "@/components/otoch/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatearMXN } from "@/lib/inmuebles-media";
import type {
  CirculoResumenLista,
  MatchInmuebleItem,
  MatchRoomieItem,
} from "@/types/database";

interface MatchesPanelProps {
  circulos: CirculoResumenLista[];
  matchesInmuebles: MatchInmuebleItem[];
  matchesRoomies: MatchRoomieItem[];
}

export function MatchesPanel({
  circulos,
  matchesInmuebles,
  matchesRoomies,
}: MatchesPanelProps) {
  const router = useRouter();
  const [matchSeleccionado, setMatchSeleccionado] =
    React.useState<MatchInmuebleItem | null>(null);
  const [nombreCirculo, setNombreCirculo] = React.useState("");
  const [cupoCirculo, setCupoCirculo] = React.useState<number>(3);
  const [circuloDestinoInvitacion, setCirculoDestinoInvitacion] =
    React.useState<string>("");
  const [procesando, setProcesando] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  const invitacionesPendientes = circulos.filter(
    (c) => c.miEstado === "invitado"
  );
  const circulosAbiertosConCupo = circulos.filter(
    (c) =>
      c.miEstado === "activo" &&
      (c.estado === "abierto" || c.estado === "en_acuerdo") &&
      c.estudiantesActivos < c.cupo
  );

  const circuloDestinoEfectivo =
    circuloDestinoInvitacion || circulosAbiertosConCupo[0]?.id || "";

  function abrirModalCrearCirculo(item: MatchInmuebleItem) {
    setMatchSeleccionado(item);
    setNombreCirculo(item.inmuebleTitulo);
    setCupoCirculo(Math.max(2, Math.min(6, item.capacidad || 3)));
    setFeedback(null);
  }

  async function handleCrearCirculo(e: React.FormEvent) {
    e.preventDefault();
    if (!matchSeleccionado) return;

    setProcesando(matchSeleccionado.matchId);
    const res = await crearCirculoDesdeMatchAction({
      matchId: matchSeleccionado.matchId,
      nombre: nombreCirculo,
      cupo: Number(cupoCirculo),
    });
    setProcesando(null);

    if (!res.ok) {
      setFeedback({
        ok: false,
        msg: res.error ?? "No se pudo crear el círculo.",
      });
      return;
    }

    setMatchSeleccionado(null);
    if (res.circuloId) {
      router.push(`/circulos/${res.circuloId}`);
      router.refresh();
    }
  }

  async function handleInvitarRoomie(roomieId: string) {
    if (!circuloDestinoEfectivo) {
      setFeedback({
        ok: false,
        msg: "Primero crea un círculo desde un match de inmueble para poder invitar roomies.",
      });
      return;
    }

    setProcesando(roomieId);
    const res = await invitarRoomieACirculoAction({
      circuloId: circuloDestinoEfectivo,
      roomieId,
    });
    setProcesando(null);

    setFeedback({
      ok: res.ok,
      msg: res.ok
        ? (res.message ?? "Invitación enviada.")
        : (res.error ?? "No se pudo enviar la invitación."),
    });
    if (res.ok) router.refresh();
  }

  async function handleResponderInvitacion(
    circuloId: string,
    aceptar: boolean
  ) {
    setProcesando(circuloId);
    const res = await responderInvitacionCirculoAction({ circuloId, aceptar });
    setProcesando(null);

    if (!res.ok) {
      setFeedback({
        ok: false,
        msg: res.error ?? "No se pudo procesar la invitación.",
      });
      return;
    }

    if (aceptar) {
      router.push(`/circulos/${circuloId}`);
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Invitaciones recibidas pendientes */}
      {invitacionesPendientes.length > 0 && (
        <Card className="gap-3.5 border-primary/40 bg-primary-soft/55 p-5">
          <p className="text-titulo-2 text-foreground">
            Invitaciones pendientes a círculos ({invitacionesPendientes.length})
          </p>
          <div className="flex flex-col gap-3">
            {invitacionesPendientes.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-sm bg-surface p-4 shadow-subtle"
              >
                <div>
                  <p className="text-cuerpo font-semibold text-foreground">
                    {inv.nombre}
                  </p>
                  <p className="text-etiqueta text-text-secondary">
                    {inv.inmuebleColonia} · Renta total{" "}
                    {formatearMXN(inv.rentaMensual)} · Cupo {inv.cupo}{" "}
                    estudiantes
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={procesando === inv.id}
                    onClick={() => handleResponderInvitacion(inv.id, false)}
                  >
                    <X className="size-4 text-danger" aria-hidden="true" />
                    Rechazar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={procesando === inv.id}
                    onClick={() => handleResponderInvitacion(inv.id, true)}
                  >
                    <Check className="size-4" aria-hidden="true" />
                    Aceptar e ingresar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {feedback && (
        <div
          role={feedback.ok ? "status" : "alert"}
          className={`flex items-center justify-between gap-3 rounded-sm border px-4 py-3 text-pequeno font-semibold ${
            feedback.ok
              ? "border-verde/30 bg-verde-soft text-verde"
              : "border-danger/30 bg-primary-soft text-danger"
          }`}
        >
          <span>{feedback.msg}</span>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => setFeedback(null)}
            className="cursor-pointer rounded-pill p-1"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <Tabs defaultValue="inmuebles">
        <TabsList>
          <TabsTrigger value="inmuebles">
            Inmuebles ({matchesInmuebles.length})
          </TabsTrigger>
          <TabsTrigger value="roomies">
            Roomies ({matchesRoomies.length})
          </TabsTrigger>
        </TabsList>

        {/* Pestaña 1: Matches de Inmuebles -> Crear Círculo */}
        <TabsContent value="inmuebles" className="pt-2">
          {matchesInmuebles.length === 0 ? (
            <Card className="items-start gap-3.5 rounded-lg p-7">
              <span className="flex size-11 items-center justify-center rounded-sm bg-primary-soft text-primary">
                <House className="size-5" aria-hidden="true" />
              </span>
              <h3 className="text-titulo-2 text-foreground">
                Aún no tienes matches de inmuebles
              </h3>
              <p className="text-pequeno text-text-secondary">
                Desliza en Explorar sobre las viviendas que te gusten; cuando el
                arrendador también acepte tu solicitud, aparecerá aquí para abrir
                su círculo de negociación.
              </p>
              <Button size="sm" asChild>
                <Link href="/explorar">Explorar inmuebles</Link>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {matchesInmuebles.map((item) => {
                const estimado = Math.round(
                  item.rentaMensual / Math.max(2, item.capacidad)
                );
                return (
                  <Card
                    key={item.matchId}
                    className="justify-between gap-4 rounded-lg p-5"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-pill bg-verde-soft px-3 py-1 text-etiqueta font-semibold text-verde">
                          <Heart
                            className="size-3.5 fill-verde"
                            aria-hidden="true"
                          />
                          Match inmueble
                        </span>
                        <span className="text-etiqueta text-text-secondary">
                          {item.creadoEn}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-titulo-2 text-foreground">
                          {item.inmuebleTitulo}
                        </h3>
                        <p className="text-pequeno text-text-secondary">
                          {item.inmuebleColonia} · Renta total{" "}
                          {formatearMXN(item.rentaMensual)} (~
                          {formatearMXN(estimado)} c/u)
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 rounded-sm bg-canvas p-3">
                        <OtochAvatar
                          iniciales={item.contraparteIniciales}
                          nombre={item.contraparteNombre}
                          size={36}
                          tone="verde"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-pequeno font-semibold text-foreground">
                            {item.contraparteNombre}
                          </p>
                          <p className="text-etiqueta text-text-secondary">
                            {item.contraparteEsArrendador
                              ? "Arrendador del inmueble"
                              : "Estudiante interesado"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {item.circuloExistenteId ? (
                        <Button className="w-full" size="sm" asChild>
                          <Link href={`/circulos/${item.circuloExistenteId}`}>
                            <MessageCircle
                              className="size-4"
                              aria-hidden="true"
                            />
                            Abrir círculo activo
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          className="w-full"
                          onClick={() => abrirModalCrearCirculo(item)}
                        >
                          <Plus className="size-4" aria-hidden="true" />
                          Crear círculo
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Pestaña 2: Matches de Roomies -> Invitar a Círculo */}
        <TabsContent value="roomies" className="pt-2">
          {matchesRoomies.length > 0 && circulosAbiertosConCupo.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-sm bg-canvas p-3.5">
              <label
                htmlFor="select-circulo-destino"
                className="text-pequeno font-semibold text-foreground"
              >
                Invitar al círculo:
              </label>
              <select
                id="select-circulo-destino"
                value={circuloDestinoEfectivo}
                onChange={(e) => setCirculoDestinoInvitacion(e.target.value)}
                className="h-9 rounded-btn border border-input bg-surface px-3 text-pequeno text-foreground"
              >
                {circulosAbiertosConCupo.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.estudiantesActivos}/{c.cupo} estudiantes)
                  </option>
                ))}
              </select>
            </div>
          )}

          {matchesRoomies.length === 0 ? (
            <Card className="items-start gap-3.5 rounded-lg p-7">
              <span className="flex size-11 items-center justify-center rounded-sm bg-verde-soft text-verde">
                <Users className="size-5" aria-hidden="true" />
              </span>
              <h3 className="text-titulo-2 text-foreground">
                Aún no tienes matches con otros roomies
              </h3>
              <p className="text-pequeno text-text-secondary">
                Explora perfiles compatibles en Roomies para encontrar compañeros
                de casa con horarios y presupuesto afines e invitarlos a tu
                círculo.
              </p>
              <Button size="sm" variant="outline" asChild>
                <Link href="/roomies">Ir a Roomies</Link>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {matchesRoomies.map((rm) => (
                <Card
                  key={rm.matchId}
                  className="justify-between gap-4 rounded-lg p-5"
                >
                  <div className="flex items-start gap-3.5">
                    <OtochAvatar
                      iniciales={rm.iniciales}
                      nombre={rm.nombreCompleto}
                      size={44}
                      tone="primary"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="truncate text-cuerpo font-semibold text-foreground">
                          {rm.nombreCompleto}
                        </h3>
                        <span className="rounded-pill bg-verde-soft px-2.5 py-0.5 text-etiqueta font-semibold text-verde">
                          {rm.compatibilidad}% compatibles
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-etiqueta text-text-secondary">
                        <BookOpen className="size-3.5" aria-hidden="true" />
                        {rm.carrera} · {rm.universidadSiglas}
                      </p>
                      {rm.presupuestoMax && (
                        <p className="mt-1 flex items-center gap-1.5 text-etiqueta text-text-secondary">
                          <Wallet className="size-3.5" aria-hidden="true" />
                          Presupuesto máx. {formatearMXN(rm.presupuestoMax)}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={procesando === rm.roomieId}
                    onClick={() => handleInvitarRoomie(rm.roomieId)}
                    className="w-full"
                  >
                    <UserPlus className="size-4" aria-hidden="true" />
                    {procesando === rm.roomieId
                      ? "Enviando invitación…"
                      : "Invitar a círculo"}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal para configurar y crear un círculo desde un match de inmueble */}
      <Dialog
        open={Boolean(matchSeleccionado)}
        onOpenChange={(open) => {
          if (!open) setMatchSeleccionado(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear círculo de convivencia</DialogTitle>
            <DialogDescription>
              Se agregará automáticamente al arrendador y a ti como integrantes
              activos para platicar en tiempo real y dividir la renta.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCrearCirculo} className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="circulo-nombre"
                className="text-pequeno font-semibold text-foreground"
              >
                Nombre del círculo
              </label>
              <Input
                id="circulo-nombre"
                value={nombreCirculo}
                onChange={(e) => setNombreCirculo(e.target.value)}
                maxLength={80}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="circulo-cupo"
                className="text-pequeno font-semibold text-foreground"
              >
                Cupo máximo de estudiantes (2 a 6)
              </label>
              <Input
                id="circulo-cupo"
                type="number"
                min={2}
                max={6}
                value={cupoCirculo}
                onChange={(e) => setCupoCirculo(Number(e.target.value))}
                required
              />
              <span className="text-etiqueta text-text-secondary">
                Podrás invitar hasta {cupoCirculo} estudiantes con match para
                dividir la renta en partes iguales.
              </span>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMatchSeleccionado(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={Boolean(procesando)}>
                {procesando ? "Creando…" : "Abrir círculo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
