"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  Bell,
  Check,
  CheckCheck,
  FileText,
  Heart,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import {
  listarNotificacionesAction,
  marcarNotificacionLeidaAction,
  marcarTodasNotificacionesLeidasAction,
} from "@/app/actions/notificaciones";
import {
  etiquetaCategoriaNotificacion,
  formatearTiempoRelativoMX,
  resolverDestinoNotificacion,
} from "@/lib/notificaciones-utils";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Notificacion } from "@/types/database";

interface NotificationBellProps {
  usuarioId: string;
  inicialNoLeidas: number;
  placement?: "sidebar" | "header";
}

export function IconoCategoriaNotificacion({ tipo }: { tipo: string }) {
  switch (tipo) {
    case "nuevo_match":
      return (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-primary-soft text-primary">
          <Heart className="size-4" aria-hidden="true" />
        </span>
      );
    case "mensaje":
      return (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-primary-soft text-primary-strong">
          <MessageCircle className="size-4" aria-hidden="true" />
        </span>
      );
    case "acuerdo":
      return (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-verde-soft text-verde">
          <FileText className="size-4" aria-hidden="true" />
        </span>
      );
    case "verificacion":
      return (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-verde-soft text-verde">
          <ShieldCheck className="size-4" aria-hidden="true" />
        </span>
      );
    default:
      return (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-sunken text-foreground">
          <Bell className="size-4" aria-hidden="true" />
        </span>
      );
  }
}

export function NotificationBell({
  usuarioId,
  inicialNoLeidas,
  placement = "header",
}: NotificationBellProps) {
  const router = useRouter();
  const contenedorRef = React.useRef<HTMLDivElement>(null);
  const [abierto, setAbierto] = React.useState(false);
  const [cargando, setCargando] = React.useState(false);
  const [cargadoInicial, setCargadoInicial] = React.useState(false);
  const [noLeidas, setNoLeidas] = React.useState(inicialNoLeidas);
  const [prevInicial, setPrevInicial] = React.useState(inicialNoLeidas);
  const [notificaciones, setNotificaciones] = React.useState<Notificacion[]>([]);

  if (prevInicial !== inicialNoLeidas) {
    setPrevInicial(inicialNoLeidas);
    setNoLeidas(inicialNoLeidas);
  }

  // Cierre con clic fuera o tecla Escape
  React.useEffect(() => {
    if (!abierto) return;

    function handleOutside(e: MouseEvent) {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(e.target as Node)
      ) {
        setAbierto(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setAbierto(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [abierto]);

  // Suscripción en tiempo real a `public.notificaciones`
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
        .channel(`notificaciones-usuario-${usuarioId}-${placement}`)
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
              return [nueva, ...prev].slice(0, 25);
            });
            if (!nueva.leida) {
              setNoLeidas((c) => c + 1);
            }
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
  }, [usuarioId, placement]);

  async function cargarLista() {
    setCargando(true);
    const res = await listarNotificacionesAction(15);
    setCargando(false);
    if (res.ok && res.notificaciones) {
      setNotificaciones(res.notificaciones);
      if (typeof res.noLeidas === "number") {
        setNoLeidas(res.noLeidas);
      }
      setCargadoInicial(true);
    }
  }

  function handleToggle() {
    const siguiente = !abierto;
    setAbierto(siguiente);
    if (siguiente && !cargadoInicial) {
      void cargarLista();
    }
  }

  async function handleMarcarIndividual(
    e: React.MouseEvent,
    notif: Notificacion
  ) {
    e.stopPropagation();
    if (notif.leida) return;

    setNotificaciones((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, leida: true } : n))
    );
    setNoLeidas((c) => Math.max(0, c - 1));
    await marcarNotificacionLeidaAction(notif.id);
  }

  async function handleMarcarTodas() {
    if (noLeidas === 0) return;
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    setNoLeidas(0);
    await marcarTodasNotificacionesLeidasAction();
  }

  function handleSeleccionar(notif: Notificacion) {
    const destino = resolverDestinoNotificacion(notif);
    if (!notif.leida) {
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, leida: true } : n))
      );
      setNoLeidas((c) => Math.max(0, c - 1));
      void marcarNotificacionLeidaAction(notif.id);
    }
    setAbierto(false);
    router.push(destino);
  }

  const etiquetaContador = noLeidas > 9 ? "9+" : String(noLeidas);

  return (
    <div ref={contenedorRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label={
          noLeidas > 0
            ? `Notificaciones (${noLeidas} sin leer)`
            : "Notificaciones"
        }
        aria-expanded={abierto}
        aria-haspopup="dialog"
        className="relative inline-flex size-10 cursor-pointer items-center justify-center rounded-pill border border-border bg-surface text-foreground transition-colors hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bell className="size-[19px] stroke-[2]" aria-hidden="true" />
        {noLeidas > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[20px] items-center justify-center rounded-pill bg-primary px-1.5 py-0.5 text-[11px] font-bold leading-none text-primary-foreground">
            {etiquetaContador}
          </span>
        )}
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Bandeja rápida de notificaciones"
          className={cn(
            "absolute z-50 mt-2 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-md border border-border bg-surface shadow-card",
            placement === "sidebar" ? "left-0" : "right-0"
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-cuerpo font-semibold text-foreground">
                Notificaciones
              </span>
              {noLeidas > 0 && (
                <span className="inline-flex items-center rounded-pill bg-primary-soft px-2 py-0.5 text-etiqueta font-semibold text-primary-strong">
                  {noLeidas} nuevas
                </span>
              )}
            </div>

            {noLeidas > 0 && (
              <button
                type="button"
                onClick={handleMarcarTodas}
                className="inline-flex cursor-pointer items-center gap-1 rounded-xs px-2 py-1 text-etiqueta font-semibold text-primary transition-colors hover:bg-primary-soft"
              >
                <CheckCheck className="size-3.5" aria-hidden="true" />
                Leer todas
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {cargando ? (
              <div className="flex flex-col gap-3 p-4">
                {[1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="flex animate-pulse items-start gap-3 rounded-xs bg-sunken/70 p-3"
                  >
                    <div className="size-9 shrink-0 rounded-pill bg-sunken" />
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="h-3.5 w-3/4 rounded-pill bg-sunken" />
                      <div className="h-3 w-full rounded-pill bg-sunken" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
                <span className="flex size-11 items-center justify-center rounded-pill bg-sunken text-text-secondary">
                  <Bell className="size-5" aria-hidden="true" />
                </span>
                <p className="text-pequeno font-semibold text-foreground">
                  No tienes notificaciones nuevas
                </p>
                <p className="text-etiqueta text-text-secondary">
                  Aquí verás tus nuevos matches, mensajes de círculo, acuerdos y
                  revisiones de verificación.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {notificaciones.map((notif) => (
                  <li key={notif.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSeleccionar(notif)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSeleccionar(notif);
                        }
                      }}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-sunken/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                        !notif.leida && "bg-primary-soft/35"
                      )}
                    >
                      <IconoCategoriaNotificacion tipo={notif.tipo} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-primary-strong">
                            {etiquetaCategoriaNotificacion(notif.tipo)}
                          </span>
                          <span className="shrink-0 text-etiqueta text-text-secondary">
                            {formatearTiempoRelativoMX(notif.creado_en)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-pequeno font-semibold text-foreground">
                          {notif.titulo}
                        </p>
                        {notif.cuerpo && (
                          <p className="mt-0.5 line-clamp-2 text-etiqueta text-text-secondary">
                            {notif.cuerpo}
                          </p>
                        )}
                      </div>

                      {!notif.leida && (
                        <button
                          type="button"
                          onClick={(e) => void handleMarcarIndividual(e, notif)}
                          aria-label={`Marcar "${notif.titulo}" como leída`}
                          title="Marcar como leída"
                          className="mt-0.5 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-pill border border-border bg-surface text-verde transition-colors hover:bg-verde-soft"
                        >
                          <Check className="size-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border bg-canvas px-4 py-2.5 text-center">
            <Link
              href="/notificaciones"
              onClick={() => setAbierto(false)}
              className="text-pequeno font-semibold text-primary hover:underline"
            >
              Ver todas las notificaciones
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
