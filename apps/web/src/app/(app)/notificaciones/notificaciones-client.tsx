"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Bell, Check, CheckCheck, ChevronRight } from "lucide-react";
import {
  marcarNotificacionLeidaAction,
  marcarTodasNotificacionesLeidasAction,
} from "@/app/actions/notificaciones";
import { FilterChip } from "@/components/otoch/filter-chip";
import { IconoCategoriaNotificacion } from "@/components/otoch/notification-bell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  etiquetaCategoriaNotificacion,
  formatearTiempoRelativoMX,
  resolverDestinoNotificacion,
} from "@/lib/notificaciones-utils";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Notificacion } from "@/types/database";

type FiltroNotif =
  | "todas"
  | "no_leidas"
  | "nuevo_match"
  | "mensaje"
  | "acuerdo"
  | "verificacion";

interface NotificacionesClientProps {
  usuarioId: string;
  notificacionesIniciales: Notificacion[];
}

export function NotificacionesClient({
  usuarioId,
  notificacionesIniciales,
}: NotificacionesClientProps) {
  const router = useRouter();
  const [notificaciones, setNotificaciones] = React.useState<Notificacion[]>(
    notificacionesIniciales
  );
  const [filtro, setFiltro] = React.useState<FiltroNotif>("todas");
  const [marcandoTodas, setMarcandoTodas] = React.useState(false);

  // Sincronización en tiempo real en la página completa
  React.useEffect(() => {
    const supabase = createClient();
    let cancelado = false;
    let canalActivo: RealtimeChannel | null = null;

    async function suscribir() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelado) return;

      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }

      canalActivo = supabase
        .channel(`notificaciones-pagina-${usuarioId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notificaciones",
            filter: `perfil_id=eq.${usuarioId}`,
          },
          (payload) => {
            const nueva = payload.new as Notificacion;
            setNotificaciones((prev) => {
              if (prev.some((n) => n.id === nueva.id)) return prev;
              return [nueva, ...prev];
            });
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notificaciones",
            filter: `perfil_id=eq.${usuarioId}`,
          },
          (payload) => {
            const actualizada = payload.new as Notificacion;
            setNotificaciones((prev) =>
              prev.map((n) => (n.id === actualizada.id ? actualizada : n))
            );
          }
        )
        .subscribe();
    }

    void suscribir();

    return () => {
      cancelado = true;
      if (canalActivo) {
        void supabase.removeChannel(canalActivo);
      }
    };
  }, [usuarioId]);

  const totalNoLeidas = React.useMemo(
    () => notificaciones.filter((n) => !n.leida).length,
    [notificaciones]
  );

  const notificacionesFiltradas = React.useMemo(() => {
    if (filtro === "todas") return notificaciones;
    if (filtro === "no_leidas") return notificaciones.filter((n) => !n.leida);
    return notificaciones.filter((n) => n.tipo === filtro);
  }, [notificaciones, filtro]);

  async function handleMarcarIndividual(
    e: React.MouseEvent,
    notif: Notificacion
  ) {
    e.stopPropagation();
    if (notif.leida) return;
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, leida: true } : n))
    );
    await marcarNotificacionLeidaAction(notif.id);
  }

  async function handleMarcarTodas() {
    if (totalNoLeidas === 0 || marcandoTodas) return;
    setMarcandoTodas(true);
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    await marcarTodasNotificacionesLeidasAction();
    setMarcandoTodas(false);
  }

  function handleAbrirNotificacion(notif: Notificacion) {
    const destino = resolverDestinoNotificacion(notif);
    if (!notif.leida) {
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, leida: true } : n))
      );
      void marcarNotificacionLeidaAction(notif.id);
    }
    router.push(destino);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-titulo-web text-foreground">Notificaciones</h1>
          <p className="text-pequeno text-text-secondary">
            {totalNoLeidas > 0
              ? `Tienes ${totalNoLeidas} ${
                  totalNoLeidas === 1
                    ? "notificación pendiente"
                    : "notificaciones pendientes"
                } de revisar.`
              : "Estás al día con tus matches, círculos y verificaciones."}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={totalNoLeidas === 0 || marcandoTodas}
          onClick={() => void handleMarcarTodas()}
        >
          <CheckCheck className="size-4" aria-hidden="true" />
          Marcar todas como leídas
        </Button>
      </div>

      {/* Filtros por categoría */}
      <div
        role="group"
        aria-label="Filtrar notificaciones"
        className="flex items-center gap-2 overflow-x-auto pb-1"
      >
        <FilterChip
          active={filtro === "todas"}
          onClick={() => setFiltro("todas")}
        >
          Todas ({notificaciones.length})
        </FilterChip>
        <FilterChip
          active={filtro === "no_leidas"}
          onClick={() => setFiltro("no_leidas")}
        >
          Sin leer ({totalNoLeidas})
        </FilterChip>
        <FilterChip
          active={filtro === "nuevo_match"}
          onClick={() => setFiltro("nuevo_match")}
        >
          Matches
        </FilterChip>
        <FilterChip
          active={filtro === "mensaje"}
          onClick={() => setFiltro("mensaje")}
        >
          Mensajes
        </FilterChip>
        <FilterChip
          active={filtro === "acuerdo"}
          onClick={() => setFiltro("acuerdo")}
        >
          Acuerdos
        </FilterChip>
        <FilterChip
          active={filtro === "verificacion"}
          onClick={() => setFiltro("verificacion")}
        >
          Verificaciones
        </FilterChip>
      </div>

      {notificacionesFiltradas.length === 0 ? (
        <Card className="items-center gap-3 p-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-pill bg-sunken text-text-secondary">
            <Bell className="size-6" aria-hidden="true" />
          </span>
          <h2 className="text-titulo-2 text-foreground">
            {filtro === "no_leidas"
              ? "No tienes notificaciones sin leer"
              : "Aún no hay notificaciones en esta categoría"}
          </h2>
          <p className="max-w-md text-cuerpo text-text-secondary">
            Cuando hagas match con un cuarto o roomie, recibas mensajes en un
            círculo o concluya la revisión de tus documentos aparecerán aquí al
            instante.
          </p>
          <div className="pt-2">
            <Button asChild>
              <Link href="/explorar">Explorar inmuebles</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="divide-y divide-border overflow-hidden p-0">
          {notificacionesFiltradas.map((notif) => (
            <div
              key={notif.id}
              role="button"
              tabIndex={0}
              onClick={() => handleAbrirNotificacion(notif)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleAbrirNotificacion(notif);
                }
              }}
              className={cn(
                "flex cursor-pointer items-start gap-4 px-5 py-4 transition-colors hover:bg-sunken/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                !notif.leida && "bg-primary-soft/30"
              )}
            >
              <IconoCategoriaNotificacion tipo={notif.tipo} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-pill bg-sunken px-2.5 py-0.5 text-etiqueta font-semibold text-foreground">
                    {etiquetaCategoriaNotificacion(notif.tipo)}
                  </span>
                  {!notif.leida && (
                    <span className="inline-flex items-center gap-1 text-etiqueta font-semibold text-primary">
                      <span
                        className="size-2 rounded-pill bg-primary"
                        aria-hidden="true"
                      />
                      Nueva
                    </span>
                  )}
                  <span className="ml-auto text-etiqueta text-text-secondary">
                    {formatearTiempoRelativoMX(notif.creado_en)}
                  </span>
                </div>

                <p className="mt-1 text-cuerpo font-semibold text-foreground">
                  {notif.titulo}
                </p>

                {notif.cuerpo && (
                  <p className="mt-0.5 text-pequeno text-text-secondary">
                    {notif.cuerpo}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2 self-center">
                {!notif.leida && (
                  <button
                    type="button"
                    onClick={(e) => void handleMarcarIndividual(e, notif)}
                    aria-label={`Marcar "${notif.titulo}" como leída`}
                    title="Marcar como leída"
                    className="inline-flex size-9 cursor-pointer items-center justify-center rounded-pill border border-border bg-surface text-verde transition-colors hover:bg-verde-soft"
                  >
                    <Check className="size-4" aria-hidden="true" />
                  </button>
                )}
                <ChevronRight
                  className="size-4 text-text-secondary"
                  aria-hidden="true"
                />
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
