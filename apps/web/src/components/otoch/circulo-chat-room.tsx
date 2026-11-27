"use client";

import * as React from "react";
import Link from "next/link";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  AlertTriangle,
  Ban,
  ChevronLeft,
  Flag,
  Image as ImageIcon,
  MapPin,
  RefreshCw,
  Send,
  ShieldAlert,
} from "lucide-react";
import {
  bloquearUsuarioAction,
  enviarMensajeCirculoAction,
  reportarEnCirculoAction,
} from "@/app/actions/circulos";
import { OtochAvatar, obtenerIniciales } from "@/components/otoch/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type {
  MensajeChat,
  MiembroCirculoDetalle,
  MotivoReporte,
} from "@/types/database";

interface AutorResuelto {
  nombreCompleto: string;
  iniciales: string;
  esArrendador: boolean;
}

interface MensajeChatUI extends MensajeChat {
  optimista?: boolean;
}

interface CirculoChatRoomProps {
  circuloId: string;
  circuloNombre: string;
  cupoMaximo: number;
  userId: string;
  inmueble: {
    id: string;
    titulo: string;
    colonia: string;
    direccion_privada: string | null;
  };
  integrantes: MiembroCirculoDetalle[];
  mensajesIniciales: MensajeChat[];
}

function resolverUrlAdjuntoChat(ruta: string): string {
  if (
    ruta.startsWith("http://") ||
    ruta.startsWith("https://") ||
    ruta.startsWith("data:image/")
  ) {
    return ruta;
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/chat/${ruta.replace(/^\/+/, "")}`;
}

function leerArchivoComoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });
}

function formatearHoraMensaje(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function CirculoChatRoom({
  circuloId,
  circuloNombre,
  cupoMaximo,
  userId,
  inmueble,
  integrantes,
  mensajesIniciales,
}: CirculoChatRoomProps) {
  const [mensajesExtra, setMensajesExtra] = React.useState<MensajeChatUI[]>([]);
  const [autoresExtra, setAutoresExtra] = React.useState<
    Record<string, AutorResuelto>
  >({});
  const [texto, setTexto] = React.useState("");
  const [subiendoImg, setSubiendoImg] = React.useState(false);
  const [reintentoClave, setReintentoClave] = React.useState(0);
  const [estadoRealtime, setEstadoRealtime] = React.useState<
    "conectando" | "en_vivo" | "reconectando"
  >("conectando");

  // Moderación (Reportar / Bloquear)
  const [modalModeracion, setModalModeracion] = React.useState(false);
  const [perfilObjetivoMod, setPerfilObjetivoMod] = React.useState<string>("");
  const [mensajeReportadoId, setMensajeReportadoId] = React.useState<
    number | null
  >(null);
  const [motivoReporte, setMotivoReporte] =
    React.useState<MotivoReporte>("acoso");
  const [descripcionReporte, setDescripcionReporte] = React.useState("");
  const [avisoChat, setAvisoChat] = React.useState<string | null>(null);

  const bottomRef = React.useRef<HTMLDivElement>(null);
  const channelRef = React.useRef<RealtimeChannel | null>(null);
  const integrantesLookupRef = React.useRef<Map<string, AutorResuelto>>(
    new Map()
  );

  // Mapa en memoria de integrantes del círculo para resolver nombre/avatar sin JOIN en Realtime
  const integranteMap = React.useMemo(() => {
    const map = new Map<string, AutorResuelto>();
    for (const i of integrantes) {
      map.set(i.perfil_id, {
        nombreCompleto: i.nombreCompleto,
        iniciales: i.iniciales,
        esArrendador: i.rol === "arrendador",
      });
    }
    return map;
  }, [integrantes]);

  React.useEffect(() => {
    integrantesLookupRef.current = integranteMap;
  }, [integranteMap]);

  // Combinar mensajes iniciales + mensajes optimistas / Realtime evitando duplicados por id
  const mensajes = React.useMemo(() => {
    const vistos = new Set<number>();
    const combinados: MensajeChatUI[] = [];
    for (const m of [...mensajesIniciales, ...mensajesExtra]) {
      if (!m.eliminado && !vistos.has(m.id)) {
        vistos.add(m.id);
        combinados.push(m);
      }
    }
    return combinados;
  }, [mensajesIniciales, mensajesExtra]);

  // Auto-scroll suave al final de la conversación
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes.length]);

  // Suscripción única por círculo a Supabase Realtime (`circulo-chat-${circuloId}`)
  React.useEffect(() => {
    let cancelado = false;
    const supabase = createClient();
    const channelName = `circulo-chat-${circuloId}`;
    let activeChannel: RealtimeChannel | null = null;

    const resolverAutorFaltante = async (autorId: string | null) => {
      if (!autorId || integrantesLookupRef.current.has(autorId)) return;
      const { data: p } = await supabase
        .from("perfiles")
        .select("id, nombre, apellidos, rol")
        .eq("id", autorId)
        .maybeSingle();
      if (!cancelado && p) {
        setAutoresExtra((prev) =>
          prev[p.id]
            ? prev
            : {
                ...prev,
                [p.id]: {
                  nombreCompleto: `${p.nombre} ${p.apellidos}`.trim(),
                  iniciales: obtenerIniciales(p.nombre, p.apellidos),
                  esArrendador: p.rol === "arrendador",
                },
              }
        );
      }
    };

    const incorporarMensajeEntrante = (nuevo: MensajeChat) => {
      if (cancelado || !nuevo || nuevo.eliminado) return;
      void resolverAutorFaltante(nuevo.autor_id);

      setMensajesExtra((prev) => {
        if (prev.some((m) => m.id === nuevo.id)) {
          return prev;
        }
        // Si existe un mensaje optimista propio idéntico aún pendiente, reemplazarlo
        const idxOpt = prev.findIndex(
          (m) =>
            m.optimista &&
            m.autor_id === nuevo.autor_id &&
            m.tipo === nuevo.tipo &&
            m.contenido === nuevo.contenido
        );
        if (idxOpt !== -1) {
          const copia = [...prev];
          copia[idxOpt] = nuevo;
          return copia;
        }
        return [...prev, nuevo];
      });
    };

    async function conectarCanal() {
      setEstadoRealtime("conectando");

      // Garantizar que el WebSocket de Realtime reciba el JWT autenticado del usuario
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelado) return;

      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }

      const channel = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: false },
          },
        })
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "mensajes",
            filter: "circulo_id=eq." + circuloId,
          },
          (payload) => {
            incorporarMensajeEntrante(payload.new as MensajeChat);
          }
        )
        .on("broadcast", { event: "nuevo_mensaje" }, (evento) => {
          const msg = evento.payload as MensajeChat | undefined;
          if (msg && msg.circulo_id === circuloId) {
            incorporarMensajeEntrante(msg);
          }
        })
        .subscribe((status, err) => {
          console.info(`[Otoch Realtime] ${channelName}:`, status, err ?? "");
          if (cancelado) return;
          if (status === "SUBSCRIBED") {
            setEstadoRealtime("en_vivo");
          } else if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            setEstadoRealtime("reconectando");
          }
        });

      activeChannel = channel;
      channelRef.current = channel;
    }

    void conectarCanal();

    return () => {
      cancelado = true;
      channelRef.current = null;
      if (activeChannel) {
        void supabase.removeChannel(activeChannel);
      }
    };
  }, [circuloId, reintentoClave]);

  const otrosIntegrantes = integrantes.filter((i) => i.perfil_id !== userId);
  const estudiantesActivosCount = integrantes.filter(
    (i) => i.rol === "estudiante" && i.estado === "activo"
  ).length;

  const resumenParticipantes = integrantes
    .filter((i) => i.estado === "activo")
    .map((i) =>
      i.esUsuarioActual
        ? "Tú"
        : i.rol === "arrendador"
          ? `${i.nombreCompleto.split(" ")[0]} (arrendador)`
          : i.nombreCompleto.split(" ")[0]
    )
    .join(", ");

  async function handleEnviarTexto(e: React.FormEvent) {
    e.preventDefault();
    const limpio = texto.trim();
    if (!limpio) return;

    setAvisoChat(null);
    setTexto("");

    // UI Optimista: mostrar el mensaje al instante en el chat del emisor
    const tempId = -Date.now() - Math.floor(Math.random() * 1000);
    const mensajeOptimista: MensajeChatUI = {
      id: tempId,
      circulo_id: circuloId,
      autor_id: userId,
      tipo: "texto",
      contenido: limpio,
      adjunto_ruta: null,
      eliminado: false,
      creado_en: new Date().toISOString(),
      optimista: true,
    };

    setMensajesExtra((prev) => [...prev, mensajeOptimista]);

    const res = await enviarMensajeCirculoAction({
      circuloId,
      tipo: "texto",
      contenido: limpio,
    });

    if (!res.ok || !res.mensajeInsertado) {
      // Revertir burbuja optimista y devolver el texto al campo para no perderlo
      setMensajesExtra((prev) => prev.filter((m) => m.id !== tempId));
      setTexto(limpio);
      setAvisoChat(res.error ?? "No se pudo enviar el mensaje.");
      return;
    }

    const confirmado = res.mensajeInsertado;
    setMensajesExtra((prev) => {
      const yaLlegoPorRealtime = prev.some((m) => m.id === confirmado.id);
      if (yaLlegoPorRealtime) {
        return prev.filter((m) => m.id !== tempId);
      }
      return prev.map((m) => (m.id === tempId ? confirmado : m));
    });

    // Notificar también por broadcast en el mismo canal para latencia sub-30ms
    void channelRef.current?.send({
      type: "broadcast",
      event: "nuevo_mensaje",
      payload: confirmado,
    });
  }

  async function handleSubirImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setSubiendoImg(true);
    setAvisoChat(null);

    let rutaFinal = "";
    let previewOptimista = "";
    try {
      previewOptimista = await leerArchivoComoDataUrl(file);
      const supabase = createClient();
      const ext = (file.name.split(".").pop() ?? "jpg")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const path = `${userId}/${circuloId}-${crypto.randomUUID()}.${ext || "jpg"}`;

      const { error } = await supabase.storage
        .from("chat")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (!error) {
        rutaFinal = path;
      } else if (file.size <= 350_000) {
        rutaFinal = previewOptimista;
      } else {
        setAvisoChat(
          "No se pudo subir la imagen al bucket `chat` (verifica que pese menos de 5 MB)."
        );
        setSubiendoImg(false);
        return;
      }
    } catch {
      setAvisoChat("Error al procesar la imagen adjunta.");
      setSubiendoImg(false);
      return;
    }

    const tempId = -Date.now();
    const imgOptimista: MensajeChatUI = {
      id: tempId,
      circulo_id: circuloId,
      autor_id: userId,
      tipo: "imagen",
      contenido: "Imagen compartida",
      adjunto_ruta: previewOptimista || rutaFinal,
      eliminado: false,
      creado_en: new Date().toISOString(),
      optimista: true,
    };

    setMensajesExtra((prev) => [...prev, imgOptimista]);

    const res = await enviarMensajeCirculoAction({
      circuloId,
      tipo: "imagen",
      contenido: "Imagen compartida",
      adjuntoRuta: rutaFinal,
    });
    setSubiendoImg(false);

    if (!res.ok || !res.mensajeInsertado) {
      setMensajesExtra((prev) => prev.filter((m) => m.id !== tempId));
      setAvisoChat(res.error ?? "No se pudo enviar la imagen.");
      return;
    }

    const confirmado = res.mensajeInsertado;
    setMensajesExtra((prev) => {
      if (prev.some((m) => m.id === confirmado.id)) {
        return prev.filter((m) => m.id !== tempId);
      }
      return prev.map((m) => (m.id === tempId ? confirmado : m));
    });

    void channelRef.current?.send({
      type: "broadcast",
      event: "nuevo_mensaje",
      payload: confirmado,
    });
  }

  function abrirModalReporteMensaje(msg: MensajeChat) {
    setMensajeReportadoId(msg.id > 0 ? msg.id : null);
    setPerfilObjetivoMod(msg.autor_id ?? otrosIntegrantes[0]?.perfil_id ?? "");
    setDescripcionReporte("");
    setModalModeracion(true);
  }

  async function handleEnviarReporte(e: React.FormEvent) {
    e.preventDefault();
    const res = await reportarEnCirculoAction({
      perfilReportadoId: perfilObjetivoMod || null,
      inmuebleReportadoId: inmueble.id,
      mensajeId: mensajeReportadoId,
      motivo: motivoReporte,
      descripcion: descripcionReporte,
    });

    setAvisoChat(
      res.ok
        ? (res.message ?? "Reporte registrado.")
        : (res.error ?? "No se pudo enviar el reporte.")
    );
    if (res.ok) {
      setModalModeracion(false);
      setMensajeReportadoId(null);
      setDescripcionReporte("");
    }
  }

  async function handleBloquearUsuario() {
    if (!perfilObjetivoMod) return;
    const res = await bloquearUsuarioAction(perfilObjetivoMod);
    setAvisoChat(
      res.ok
        ? (res.message ?? "Usuario bloqueado.")
        : (res.error ?? "No se pudo bloquear al usuario.")
    );
    if (res.ok) {
      setModalModeracion(false);
    }
  }

  return (
    <section
      aria-label="Conversación del círculo"
      className="flex h-[calc(100dvh-180px)] min-h-[540px] flex-col overflow-hidden rounded-lg border border-border bg-canvas lg:h-[calc(100dvh-72px)]"
    >
      {/* Encabezado de chat W06 */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            href="/circulos"
            aria-label="Volver a la lista de círculos"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-pill bg-canvas text-foreground lg:hidden"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </Link>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-titulo-2 text-foreground">
                {circuloNombre}
              </h1>

              {estadoRealtime === "reconectando" ? (
                <button
                  type="button"
                  onClick={() => setReintentoClave((c) => c + 1)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-pill bg-primary-soft px-2.5 py-0.5 text-etiqueta font-semibold text-primary-strong hover:bg-primary-soft/80"
                >
                  <RefreshCw className="size-3" aria-hidden="true" />
                  Reconectar chat
                </button>
              ) : (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-etiqueta font-semibold",
                    estadoRealtime === "en_vivo"
                      ? "bg-verde-soft text-verde"
                      : "bg-sunken text-text-secondary"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-pill",
                      estadoRealtime === "en_vivo" ? "bg-verde" : "bg-oro"
                    )}
                  />
                  {estadoRealtime === "en_vivo" ? "En vivo" : "Conectando…"}
                </span>
              )}
            </div>

            <p className="truncate text-etiqueta text-verde">
              {resumenParticipantes} · Cupo {estudiantesActivosCount}/{cupoMaximo}
            </p>

            {inmueble.direccion_privada && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-etiqueta text-text-secondary">
                <MapPin className="size-3 text-primary" aria-hidden="true" />
                Dirección del círculo: {inmueble.direccion_privada} (
                {inmueble.colonia})
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/inmuebles/${inmueble.id}`}>Ver inmueble</Link>
          </Button>

          <button
            type="button"
            aria-label="Opciones de seguridad: reportar o bloquear"
            title="Reportar o bloquear"
            onClick={() => {
              setMensajeReportadoId(null);
              setPerfilObjetivoMod(otrosIntegrantes[0]?.perfil_id ?? "");
              setModalModeracion(true);
            }}
            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-pill border border-border bg-surface text-text-secondary transition-colors hover:bg-primary-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ShieldAlert className="size-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      {avisoChat && (
        <div
          role="status"
          className="flex items-center justify-between gap-2 border-b border-border bg-primary-soft px-4 py-2 text-etiqueta font-semibold text-primary-strong"
        >
          <span>{avisoChat}</span>
          <button
            type="button"
            onClick={() => setAvisoChat(null)}
            className="cursor-pointer underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Historial de mensajes en tiempo real */}
      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="text-center">
          <span className="rounded-pill bg-sunken px-3 py-1 text-etiqueta text-text-secondary">
            Conversación protegida de {inmueble.titulo}
          </span>
        </div>

        {mensajes.map((msg) => {
          if (msg.tipo === "sistema") {
            return (
              <div key={msg.id} className="my-1 text-center">
                <span className="inline-block max-w-[85%] rounded-pill bg-sunken/80 px-3.5 py-1 text-etiqueta text-text-secondary">
                  {msg.contenido}
                </span>
              </div>
            );
          }

          const esMio = msg.autor_id === userId;
          const autor = msg.autor_id
            ? (integranteMap.get(msg.autor_id) ?? autoresExtra[msg.autor_id] ?? null)
            : null;
          const esAutorArrendador = Boolean(autor?.esArrendador);

          return (
            <div
              key={msg.id}
              className={cn(
                "group flex items-end gap-2.5",
                esMio ? "justify-end" : "justify-start",
                msg.optimista && "opacity-80"
              )}
            >
              {!esMio && (
                <OtochAvatar
                  iniciales={autor?.iniciales ?? "OT"}
                  nombre={autor?.nombreCompleto}
                  size={34}
                  tone={esAutorArrendador ? "verde" : "primary"}
                />
              )}

              <div
                className={cn(
                  "max-w-[410px] px-4 py-3 shadow-subtle",
                  esMio
                    ? "rounded-[18px] rounded-br-[4px] bg-primary text-primary-foreground"
                    : "rounded-[18px] rounded-bl-[4px] border border-border bg-surface text-foreground"
                )}
              >
                {!esMio && (
                  <p
                    className={cn(
                      "mb-1 text-etiqueta font-semibold",
                      esAutorArrendador ? "text-verde" : "text-primary-strong"
                    )}
                  >
                    {autor?.nombreCompleto ?? "Integrante"}
                    {esAutorArrendador ? " · Arrendador" : ""}
                  </p>
                )}

                {msg.tipo === "imagen" && msg.adjunto_ruta && (
                  <a
                    href={resolverUrlAdjuntoChat(msg.adjunto_ruta)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-2 block overflow-hidden rounded-xs"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolverUrlAdjuntoChat(msg.adjunto_ruta)}
                      alt={msg.contenido ?? "Imagen compartida en el círculo"}
                      className="max-h-60 w-full object-cover"
                    />
                  </a>
                )}

                {msg.contenido &&
                  !(
                    msg.tipo === "imagen" &&
                    msg.contenido === "Imagen compartida"
                  ) && (
                    <p className="whitespace-pre-wrap break-words text-cuerpo">
                      {msg.contenido}
                    </p>
                  )}

                <div
                  className={cn(
                    "mt-1 flex items-center justify-end gap-2 text-etiqueta",
                    esMio
                      ? "text-primary-foreground/85"
                      : "text-text-secondary"
                  )}
                >
                  <span>
                    {msg.optimista
                      ? "Enviando…"
                      : formatearHoraMensaje(msg.creado_en)}
                  </span>
                  {!esMio && msg.id > 0 && (
                    <button
                      type="button"
                      aria-label="Reportar este mensaje"
                      title="Reportar mensaje"
                      onClick={() => abrirModalReporteMensaje(msg)}
                      className="cursor-pointer opacity-60 transition-opacity hover:text-danger hover:opacity-100"
                    >
                      <Flag className="size-3" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Barra inferior de envío W06 */}
      <form
        onSubmit={handleEnviarTexto}
        className="flex items-center gap-2.5 border-t border-border bg-surface px-4 py-3"
      >
        <label
          aria-label="Adjuntar imagen al chat"
          title="Enviar imagen"
          className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-pill bg-sunken text-foreground transition-colors hover:bg-border"
        >
          <ImageIcon className="size-5" aria-hidden="true" />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={subiendoImg}
            onChange={handleSubirImagen}
            className="sr-only"
          />
        </label>

        <input
          type="text"
          value={texto}
          maxLength={2000}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={
            subiendoImg ? "Subiendo imagen…" : "Escribe al círculo…"
          }
          aria-label="Mensaje para el círculo"
          className="h-11 flex-1 rounded-pill bg-sunken px-4 text-cuerpo text-foreground placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        <button
          type="submit"
          aria-label="Enviar mensaje"
          disabled={!texto.trim()}
          className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-pill bg-primary text-primary-foreground transition-colors hover:bg-primary-strong disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Send className="size-5" aria-hidden="true" />
        </button>
      </form>

      {/* Modal de seguridad: Reportar mensaje/usuario o Bloquear */}
      <Dialog open={modalModeracion} onOpenChange={setModalModeracion}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-danger" aria-hidden="true" />
              Seguridad y moderación
            </DialogTitle>
            <DialogDescription>
              Reporta conductas indebidas al equipo de Otoch o bloquea a un
              usuario para impedir futuras interacciones.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEnviarReporte} className="flex flex-col gap-4 pt-1">
            {otrosIntegrantes.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="mod-usuario"
                  className="text-pequeno font-semibold text-foreground"
                >
                  Integrante relacionado
                </label>
                <select
                  id="mod-usuario"
                  value={perfilObjetivoMod}
                  onChange={(e) => setPerfilObjetivoMod(e.target.value)}
                  className="h-10 rounded-btn border border-input bg-surface px-3 text-pequeno text-foreground"
                >
                  {otrosIntegrantes.map((i) => (
                    <option key={i.perfil_id} value={i.perfil_id}>
                      {i.nombreCompleto} ({i.rol})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="mod-motivo"
                className="text-pequeno font-semibold text-foreground"
              >
                Motivo del reporte
              </label>
              <select
                id="mod-motivo"
                value={motivoReporte}
                onChange={(e) =>
                  setMotivoReporte(e.target.value as MotivoReporte)
                }
                className="h-10 rounded-btn border border-input bg-surface px-3 text-pequeno text-foreground"
              >
                <option value="fraude">
                  Intento de fraude o cobro anticipado
                </option>
                <option value="acoso">Acoso o falta de respeto</option>
                <option value="contenido_inapropiado">
                  Contenido inapropiado
                </option>
                <option value="suplantacion">Suplantación de identidad</option>
                <option value="otro">Otro motivo</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="mod-desc"
                className="text-pequeno font-semibold text-foreground"
              >
                Descripción del reporte *
              </label>
              <textarea
                id="mod-desc"
                rows={3}
                minLength={5}
                maxLength={1000}
                value={descripcionReporte}
                onChange={(e) => setDescripcionReporte(e.target.value)}
                placeholder="Explica brevemente qué ocurrió para que moderación lo revise."
                className="w-full rounded-btn border border-input bg-surface px-3.5 py-2 text-pequeno text-foreground"
                required
              />
            </div>

            <DialogFooter className="flex-wrap justify-between gap-2 sm:justify-between">
              {perfilObjetivoMod && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleBloquearUsuario}
                >
                  <Ban className="size-4" aria-hidden="true" />
                  Bloquear usuario
                </Button>
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalModeracion(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm">
                  Enviar reporte
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
