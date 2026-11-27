"use client";

import * as React from "react";
import Link from "next/link";
import {
  Check,
  Clock,
  ExternalLink,
  FileText,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  actualizarEstadoReporteAdminAction,
  revisarVerificacionAdminAction,
} from "@/app/actions/admin";
import { OtochAvatar } from "@/components/otoch/avatar";
import { FilterChip } from "@/components/otoch/filter-chip";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type {
  EstadoReporte,
  MotivoReporte,
  RegistroAuditoria,
  ReporteModeracion,
  TipoVerificacion,
  VerificacionModeracion,
} from "@/types/database";

interface AdminModeracionClientProps {
  verificacionesIniciales: VerificacionModeracion[];
  reportesIniciales: ReporteModeracion[];
  auditoriaInicial: RegistroAuditoria[];
}

function etiquetaTipoVerificacion(tipo: TipoVerificacion): string {
  switch (tipo) {
    case "correo_institucional":
      return "Correo institucional";
    case "identidad":
      return "Identificación oficial";
    case "propiedad":
      return "Acreditación de propiedad";
  }
}

function etiquetaMotivoReporte(motivo: MotivoReporte): string {
  switch (motivo) {
    case "fraude":
      return "Posible fraude";
    case "acoso":
      return "Acoso o conducta hostil";
    case "contenido_inapropiado":
      return "Contenido inapropiado";
    case "suplantacion":
      return "Suplantación de identidad";
    case "otro":
      return "Otro motivo";
  }
}

function etiquetaEstadoReporte(estado: EstadoReporte): string {
  switch (estado) {
    case "abierto":
      return "Abierto";
    case "en_revision":
      return "En revisión";
    case "resuelto":
      return "Resuelto";
    case "descartado":
      return "Descartado";
  }
}

function formatearFechaHoraMX(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso;
  return fecha.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resumirDetalleAuditoria(detalle: Record<string, unknown>): string {
  const entradas = Object.entries(detalle);
  if (entradas.length === 0) return "Sin metadatos adicionales";
  return entradas
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join(" · ");
}

export function AdminModeracionClient({
  verificacionesIniciales,
  reportesIniciales,
  auditoriaInicial,
}: AdminModeracionClientProps) {
  const [verificaciones, setVerificaciones] = React.useState(
    verificacionesIniciales
  );
  const [reportes, setReportes] = React.useState(reportesIniciales);
  const [auditoria, setAuditoria] = React.useState(auditoriaInicial);

  const [filtroReporte, setFiltroReporte] = React.useState<
    "todos" | EstadoReporte
  >("todos");
  const [procesandoId, setProcesandoId] = React.useState<string | null>(null);
  const [aviso, setAviso] = React.useState<{
    tipo: "ok" | "error";
    texto: string;
  } | null>(null);

  // Estado del diálogo para motivo de rechazo
  const [rechazoObjetivo, setRechazoObjetivo] =
    React.useState<VerificacionModeracion | null>(null);
  const [motivoRechazo, setMotivoRechazo] = React.useState("");
  const [errorMotivo, setErrorMotivo] = React.useState<string | null>(null);

  const reportesAbiertosCount = React.useMemo(
    () =>
      reportes.filter(
        (r) => r.estado === "abierto" || r.estado === "en_revision"
      ).length,
    [reportes]
  );

  const reportesFiltrados = React.useMemo(() => {
    if (filtroReporte === "todos") return reportes;
    return reportes.filter((r) => r.estado === filtroReporte);
  }, [reportes, filtroReporte]);

  async function handleAprobarVerificacion(verif: VerificacionModeracion) {
    setAviso(null);
    setProcesandoId(verif.id);
    const res = await revisarVerificacionAdminAction({
      verificacionId: verif.id,
      decision: "aprobada",
    });
    setProcesandoId(null);

    if (!res.ok) {
      setAviso({
        tipo: "error",
        texto: res.error ?? "No fue posible aprobar la verificación.",
      });
      return;
    }

    setVerificaciones((prev) => prev.filter((item) => item.id !== verif.id));
    if (res.auditoriaCreada) {
      setAuditoria((prev) => [res.auditoriaCreada!, ...prev]);
    }
    setAviso({
      tipo: "ok",
      texto:
        res.message ??
        `Verificación aprobada para ${verif.solicitanteNombre}.`,
    });
  }

  async function handleConfirmarRechazo(e: React.FormEvent) {
    e.preventDefault();
    if (!rechazoObjetivo) return;

    const motivoLimpio = motivoRechazo.trim();
    if (motivoLimpio.length < 5) {
      setErrorMotivo(
        "Escribe un motivo claro (mínimo 5 caracteres) para orientar a la persona usuaria."
      );
      return;
    }

    setErrorMotivo(null);
    setAviso(null);
    setProcesandoId(rechazoObjetivo.id);

    const res = await revisarVerificacionAdminAction({
      verificacionId: rechazoObjetivo.id,
      decision: "rechazada",
      motivoRechazo: motivoLimpio,
    });

    setProcesandoId(null);

    if (!res.ok) {
      setErrorMotivo(res.error ?? "No se pudo registrar el rechazo.");
      return;
    }

    setVerificaciones((prev) =>
      prev.filter((item) => item.id !== rechazoObjetivo.id)
    );
    if (res.auditoriaCreada) {
      setAuditoria((prev) => [res.auditoriaCreada!, ...prev]);
    }
    setAviso({
      tipo: "ok",
      texto:
        res.message ??
        `Solicitud de ${rechazoObjetivo.solicitanteNombre} rechazada.`,
    });
    setRechazoObjetivo(null);
    setMotivoRechazo("");
  }

  async function handleCambiarEstadoReporte(
    reporte: ReporteModeracion,
    nuevoEstado: EstadoReporte
  ) {
    if (reporte.estado === nuevoEstado) return;
    setAviso(null);
    setProcesandoId(reporte.id);

    const res = await actualizarEstadoReporteAdminAction({
      reporteId: reporte.id,
      nuevoEstado,
    });

    setProcesandoId(null);

    if (!res.ok) {
      setAviso({
        tipo: "error",
        texto: res.error ?? "No se pudo cambiar el estado del reporte.",
      });
      return;
    }

    const ahoraIso = new Date().toISOString();
    const esTerminal =
      nuevoEstado === "resuelto" || nuevoEstado === "descartado";

    setReportes((prev) =>
      prev.map((item) =>
        item.id === reporte.id
          ? {
              ...item,
              estado: nuevoEstado,
              resuelto_en: esTerminal ? ahoraIso : null,
            }
          : item
      )
    );

    if (res.auditoriaCreada) {
      setAuditoria((prev) => [res.auditoriaCreada!, ...prev]);
    }

    setAviso({
      tipo: "ok",
      texto: res.message ?? "Estado del reporte actualizado.",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-pill bg-primary-soft px-3 py-1 text-etiqueta font-semibold text-primary-strong">
            <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
            Administración · Módulo M8
          </span>
          <h1 className="text-titulo-web text-foreground">
            Panel de moderación
          </h1>
          <p className="text-pequeno text-text-secondary">
            Revisa solicitudes de verificación, atiende reportes comunitarios y
            consulta la bitácora inmutable de auditoría.
          </p>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="gap-1 p-5">
          <span className="text-etiqueta font-semibold uppercase text-text-secondary">
            Verificaciones pendientes
          </span>
          <span className="text-titulo-web text-primary">
            {verificaciones.length}
          </span>
          <span className="text-etiqueta text-text-secondary">
            Solicitudes esperando dictamen
          </span>
        </Card>

        <Card className="gap-1 p-5">
          <span className="text-etiqueta font-semibold uppercase text-text-secondary">
            Reportes activos
          </span>
          <span className="text-titulo-web text-foreground">
            {reportesAbiertosCount}
          </span>
          <span className="text-etiqueta text-text-secondary">
            Abiertos o en revisión
          </span>
        </Card>

        <Card className="gap-1 p-5">
          <span className="text-etiqueta font-semibold uppercase text-text-secondary">
            Eventos en auditoría
          </span>
          <span className="text-titulo-web text-verde">{auditoria.length}</span>
          <span className="text-etiqueta text-text-secondary">
            Registros recientes inmutables
          </span>
        </Card>
      </div>

      {aviso && (
        <div
          role={aviso.tipo === "error" ? "alert" : "status"}
          className={cn(
            "flex items-center justify-between gap-3 rounded-sm border px-4 py-3 text-pequeno font-semibold",
            aviso.tipo === "ok"
              ? "border-verde/30 bg-verde-soft text-verde"
              : "border-danger/30 bg-primary-soft text-danger"
          )}
        >
          <span>{aviso.texto}</span>
          <button
            type="button"
            onClick={() => setAviso(null)}
            aria-label="Cerrar mensaje"
            className="cursor-pointer rounded-pill p-1 hover:bg-surface/60"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* 3 Pestañas principales */}
      <Tabs defaultValue="verificaciones" className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:w-fit">
          <TabsTrigger value="verificaciones" className="gap-2">
            Verificaciones
            {verificaciones.length > 0 && (
              <span className="inline-flex min-w-[20px] items-center justify-center rounded-pill bg-primary px-1.5 py-0.5 text-[11px] font-bold leading-none text-primary-foreground">
                {verificaciones.length}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger value="reportes" className="gap-2">
            Reportes
            {reportesAbiertosCount > 0 && (
              <span className="inline-flex min-w-[20px] items-center justify-center rounded-pill bg-oro px-1.5 py-0.5 text-[11px] font-bold leading-none text-foreground">
                {reportesAbiertosCount}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger value="auditoria">Bitácora de auditoría</TabsTrigger>
        </TabsList>

        {/* PESTAÑA 1: VERIFICACIONES */}
        <TabsContent value="verificaciones" className="mt-2">
          {verificaciones.length === 0 ? (
            <Card className="items-center gap-2 p-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-pill bg-verde-soft text-verde">
                <Check className="size-6" aria-hidden="true" />
              </span>
              <h2 className="text-titulo-2 text-foreground">
                No hay verificaciones pendientes
              </h2>
              <p className="max-w-md text-pequeno text-text-secondary">
                Todas las solicitudes de correo institucional, identidad y
                propiedad han sido atendidas.
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {verificaciones.map((verif) => {
                const ocupado = procesandoId === verif.id;
                return (
                  <Card
                    key={verif.id}
                    className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center"
                  >
                    <div className="flex items-start gap-3.5">
                      <OtochAvatar
                        iniciales={verif.solicitanteIniciales}
                        nombre={verif.solicitanteNombre}
                        size={44}
                        tone={
                          verif.solicitanteRol === "arrendador"
                            ? "verde"
                            : "primary"
                        }
                      />

                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-cuerpo font-semibold text-foreground">
                            {verif.solicitanteNombre}
                          </span>
                          <span
                            className={cn(
                              "rounded-pill px-2.5 py-0.5 text-etiqueta font-semibold",
                              verif.solicitanteRol === "arrendador"
                                ? "bg-verde-soft text-verde"
                                : "bg-primary-soft text-primary-strong"
                            )}
                          >
                            {verif.solicitanteRol === "arrendador"
                              ? "Arrendador"
                              : "Estudiante"}
                            {verif.universidadSiglas
                              ? ` · ${verif.universidadSiglas}`
                              : ""}
                          </span>
                          <span className="rounded-pill bg-sunken px-2.5 py-0.5 text-etiqueta font-semibold text-foreground">
                            {etiquetaTipoVerificacion(verif.tipo)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-pequeno text-text-secondary">
                          {verif.correoInstitucional && (
                            <span>
                              Correo inst.:{" "}
                              <strong className="font-semibold text-foreground">
                                {verif.correoInstitucional}
                              </strong>
                            </span>
                          )}
                          {verif.nombreComercial && (
                            <span>
                              Inmobiliaria:{" "}
                              <strong className="font-semibold text-foreground">
                                {verif.nombreComercial}
                              </strong>
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3.5" aria-hidden="true" />
                            {formatearFechaHoraMX(verif.creado_en)}
                          </span>
                        </div>

                        {verif.evidencia_ruta ? (
                          <p className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-xs bg-canvas px-3 py-1.5 text-etiqueta text-foreground">
                            <FileText
                              className="size-3.5 text-primary"
                              aria-hidden="true"
                            />
                            Evidencia / folio:{" "}
                            <span className="font-semibold">
                              {verif.evidencia_ruta}
                            </span>
                          </p>
                        ) : (
                          <p className="text-etiqueta text-text-secondary">
                            Sin archivo o referencia adicional adjunta.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 lg:shrink-0">
                      <Button
                        size="sm"
                        disabled={ocupado}
                        onClick={() => void handleAprobarVerificacion(verif)}
                        className="bg-verde text-primary-foreground hover:bg-verde/90"
                      >
                        <Check className="size-4" aria-hidden="true" />
                        Aprobar
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={ocupado}
                        onClick={() => {
                          setRechazoObjetivo(verif);
                          setMotivoRechazo("");
                          setErrorMotivo(null);
                        }}
                        className="border-danger/40 text-danger hover:bg-primary-soft"
                      >
                        <X className="size-4" aria-hidden="true" />
                        Rechazar
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* PESTAÑA 2: REPORTES */}
        <TabsContent value="reportes" className="mt-2 flex flex-col gap-4">
          <div
            role="group"
            aria-label="Filtrar reportes por estado"
            className="flex items-center gap-2 overflow-x-auto pb-1"
          >
            <FilterChip
              active={filtroReporte === "todos"}
              onClick={() => setFiltroReporte("todos")}
            >
              Todos ({reportes.length})
            </FilterChip>
            <FilterChip
              active={filtroReporte === "abierto"}
              onClick={() => setFiltroReporte("abierto")}
            >
              Abiertos
            </FilterChip>
            <FilterChip
              active={filtroReporte === "en_revision"}
              onClick={() => setFiltroReporte("en_revision")}
            >
              En revisión
            </FilterChip>
            <FilterChip
              active={filtroReporte === "resuelto"}
              onClick={() => setFiltroReporte("resuelto")}
            >
              Resueltos
            </FilterChip>
            <FilterChip
              active={filtroReporte === "descartado"}
              onClick={() => setFiltroReporte("descartado")}
            >
              Descartados
            </FilterChip>
          </div>

          {reportesFiltrados.length === 0 ? (
            <Card className="items-center gap-2 p-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-pill bg-sunken text-text-secondary">
                <ShieldCheck className="size-6" aria-hidden="true" />
              </span>
              <h2 className="text-titulo-2 text-foreground">
                Sin reportes en esta vista
              </h2>
              <p className="max-w-md text-pequeno text-text-secondary">
                No existen denuncias registradas con el estado seleccionado.
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {reportesFiltrados.map((rep) => {
                const ocupado = procesandoId === rep.id;
                return (
                  <Card key={rep.id} className="gap-4 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-pill bg-primary-soft px-3 py-1 text-etiqueta font-semibold text-danger">
                          {etiquetaMotivoReporte(rep.motivo)}
                        </span>
                        <span
                          className={cn(
                            "rounded-pill px-3 py-1 text-etiqueta font-semibold",
                            rep.estado === "abierto" &&
                              "bg-oro/25 text-foreground",
                            rep.estado === "en_revision" &&
                              "bg-primary-soft text-primary-strong",
                            rep.estado === "resuelto" &&
                              "bg-verde-soft text-verde",
                            rep.estado === "descartado" &&
                              "bg-sunken text-text-secondary"
                          )}
                        >
                          {etiquetaEstadoReporte(rep.estado)}
                        </span>
                        <span className="text-etiqueta text-text-secondary">
                          Reportado el {formatearFechaHoraMX(rep.creado_en)}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-2 text-pequeno text-foreground sm:grid-cols-2">
                      <p>
                        <span className="text-text-secondary">
                          Reportante:{" "}
                        </span>
                        <strong className="font-semibold">
                          {rep.reportanteNombre}
                        </strong>
                      </p>

                      {rep.perfilReportadoNombre && (
                        <p>
                          <span className="text-text-secondary">
                            Persona reportada:{" "}
                          </span>
                          <strong className="font-semibold">
                            {rep.perfilReportadoNombre}
                          </strong>
                        </p>
                      )}

                      {rep.inmueble_reportado_id && (
                        <p className="inline-flex items-center gap-1.5">
                          <span className="text-text-secondary">Anuncio: </span>
                          <Link
                            href={`/inmuebles/${rep.inmueble_reportado_id}`}
                            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                          >
                            {rep.inmuebleReportadoTitulo ?? "Ver inmueble"}
                            <ExternalLink
                              className="size-3.5"
                              aria-hidden="true"
                            />
                          </Link>
                        </p>
                      )}

                      {rep.mensajeExtracto && (
                        <p className="sm:col-span-2">
                          <span className="text-text-secondary">
                            Mensaje reportado:{" "}
                          </span>
                          <span className="rounded-xs bg-sunken px-2 py-0.5 text-etiqueta">
                            {rep.mensajeExtracto}
                          </span>
                        </p>
                      )}
                    </div>

                    {rep.descripcion && (
                      <p className="rounded-xs bg-canvas px-3.5 py-2.5 text-pequeno text-foreground">
                        {rep.descripcion}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                      <span className="mr-1 text-etiqueta font-semibold text-text-secondary">
                        Cambiar estado:
                      </span>

                      <Button
                        variant={
                          rep.estado === "en_revision" ? "secondary" : "outline"
                        }
                        size="sm"
                        disabled={ocupado || rep.estado === "en_revision"}
                        onClick={() =>
                          void handleCambiarEstadoReporte(rep, "en_revision")
                        }
                      >
                        En revisión
                      </Button>

                      <Button
                        variant={
                          rep.estado === "resuelto" ? "default" : "outline"
                        }
                        size="sm"
                        disabled={ocupado || rep.estado === "resuelto"}
                        onClick={() =>
                          void handleCambiarEstadoReporte(rep, "resuelto")
                        }
                      >
                        Resolver
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={ocupado || rep.estado === "descartado"}
                        onClick={() =>
                          void handleCambiarEstadoReporte(rep, "descartado")
                        }
                      >
                        Descartar
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* PESTAÑA 3: BITÁCORA DE AUDITORÍA */}
        <TabsContent value="auditoria" className="mt-2">
          <Card className="overflow-hidden p-0">
            {auditoria.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-cuerpo font-semibold text-foreground">
                  La bitácora de auditoría aún no tiene eventos registrados
                </p>
                <p className="mt-1 text-pequeno text-text-secondary">
                  Cada aprobación, rechazo o acción de moderación quedará
                  asentada aquí de forma inmutable.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border bg-canvas text-etiqueta font-semibold uppercase text-text-secondary">
                      <th className="px-4 py-3">Fecha y hora</th>
                      <th className="px-4 py-3">Acción</th>
                      <th className="px-4 py-3">Entidad</th>
                      <th className="px-4 py-3">Administrador</th>
                      <th className="px-4 py-3">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-pequeno">
                    {auditoria.map((item) => (
                      <tr key={item.id} className="hover:bg-sunken/40">
                        <td className="whitespace-nowrap px-4 py-3 text-etiqueta text-text-secondary">
                          {formatearFechaHoraMX(item.creado_en)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="rounded-pill bg-primary-soft px-2.5 py-0.5 text-etiqueta font-semibold text-primary-strong">
                            {item.accion}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-foreground">
                          <span className="font-semibold">{item.entidad}</span>
                          {item.entidad_id && (
                            <span className="ml-1.5 text-etiqueta text-text-secondary">
                              ({item.entidad_id.slice(0, 8)})
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-foreground">
                          {item.actorNombre}
                        </td>
                        <td className="max-w-md px-4 py-3 text-etiqueta text-text-secondary">
                          {resumirDetalleAuditoria(item.detalle)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal para capturar motivo de rechazo */}
      <Dialog
        open={Boolean(rechazoObjetivo)}
        onOpenChange={(open) => {
          if (!open) {
            setRechazoObjetivo(null);
            setMotivoRechazo("");
            setErrorMotivo(null);
          }
        }}
      >
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Rechazar solicitud de verificación</DialogTitle>
            <DialogDescription>
              Explica brevemente a{" "}
              <strong>{rechazoObjetivo?.solicitanteNombre}</strong> qué debe
              corregir para volver a enviar su documento.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmarRechazo} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="motivo-rechazo-input"
                className="text-pequeno font-semibold text-foreground"
              >
                Motivo del rechazo
              </label>
              <textarea
                id="motivo-rechazo-input"
                rows={3}
                maxLength={300}
                required
                placeholder="Ej. La imagen de la credencial no es legible o el dominio institucional no coincide."
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                className="w-full rounded-btn border border-input bg-surface px-3.5 py-2.5 text-cuerpo text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {errorMotivo && (
                <p className="text-etiqueta font-semibold text-danger">
                  {errorMotivo}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRechazoObjetivo(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={Boolean(procesandoId)}
                className="bg-danger text-primary-foreground hover:bg-danger/90"
              >
                Confirmar rechazo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
