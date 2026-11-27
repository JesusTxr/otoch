"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Clock,
  Download,
  FileText,
  Plus,
  UserPlus,
  X,
} from "lucide-react";
import {
  aceptarRepartoAcuerdoAction,
  guardarPreAcuerdoAction,
  invitarRoomieACirculoAction,
} from "@/app/actions/circulos";
import { OtochAvatar } from "@/components/otoch/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatearMXN } from "@/lib/inmuebles-media";
import { descargarPreAcuerdoPdf } from "@/lib/preacuerdo-pdf";
import { CLAUSULAS_SUGERIDAS } from "@/lib/validations/circulos";
import { cn } from "@/lib/utils";
import type {
  Acuerdo,
  Aportacion,
  MatchRoomieItem,
  MiembroCirculoDetalle,
} from "@/types/database";

interface AcuerdoPanelProps {
  circuloId: string;
  circuloNombre: string;
  cupoMaximo: number;
  userId: string;
  miRol: "estudiante" | "arrendador";
  inmueble: {
    id: string;
    titulo: string;
    colonia: string;
    direccion_privada: string | null;
    renta_mensual: number;
    deposito: number;
    reglas: string | null;
  };
  integrantes: MiembroCirculoDetalle[];
  acuerdoActual: Acuerdo | null;
  aportaciones: Aportacion[];
  matchesRoomiesDisponibles: MatchRoomieItem[];
  abrirEditorInicial?: boolean;
  className?: string;
}

export function AcuerdoPanel({
  circuloId,
  circuloNombre,
  cupoMaximo,
  userId,
  miRol,
  inmueble,
  integrantes,
  acuerdoActual,
  aportaciones,
  matchesRoomiesDisponibles,
  abrirEditorInicial = false,
  className,
}: AcuerdoPanelProps) {
  const router = useRouter();
  const hoyIso = new Date().toISOString().slice(0, 10);

  const [modalAcuerdo, setModalAcuerdo] = React.useState(abrirEditorInicial);
  const [modalInvitar, setModalInvitar] = React.useState(false);

  // Campos de calculadora / pre-acuerdo
  const [rentaTotal, setRentaTotal] = React.useState<string>(
    String(acuerdoActual?.renta_total ?? inmueble.renta_mensual)
  );
  const [depositoTotal, setDepositoTotal] = React.useState<string>(
    String(acuerdoActual?.deposito_total ?? inmueble.deposito)
  );
  const [serviciosEstimados, setServiciosEstimados] = React.useState<string>(
    String(acuerdoActual?.servicios_estimados ?? 900)
  );
  const [fechaInicio, setFechaInicio] = React.useState<string>(
    acuerdoActual?.fecha_inicio ?? hoyIso
  );
  const [duracionMeses, setDuracionMeses] = React.useState<number>(
    acuerdoActual?.duracion_meses ?? 6
  );
  const [clausulas, setClausulas] = React.useState<string[]>(
    acuerdoActual?.clausulas && acuerdoActual.clausulas.length > 0
      ? acuerdoActual.clausulas
      : [...CLAUSULAS_SUGERIDAS.slice(0, 3)]
  );
  const [nuevaClausula, setNuevaClausula] = React.useState("");

  const [guardando, setGuardando] = React.useState(false);
  const [aceptando, setAceptando] = React.useState(false);
  const [invitandoId, setInvitandoId] = React.useState<string | null>(null);
  const [aviso, setAviso] = React.useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  const estudiantesActivos = integrantes.filter(
    (m) => m.rol === "estudiante" && m.estado === "activo"
  );
  const estudiantesOcupando = integrantes.filter(
    (m) =>
      m.rol === "estudiante" &&
      (m.estado === "activo" || m.estado === "invitado")
  );
  const arrendador = integrantes.find((m) => m.rol === "arrendador");

  const nEstudiantes = Math.max(1, estudiantesActivos.length);
  const rentaViva = Number(rentaTotal) || 0;
  const depositoVivo = Number(depositoTotal) || 0;
  const serviciosVivos = Number(serviciosEstimados) || 0;

  const rentaPorPersonaVista = acuerdoActual
    ? Math.round(acuerdoActual.renta_total / nEstudiantes)
    : Math.round(inmueble.renta_mensual / nEstudiantes);

  const aportacionMap = new Map(aportaciones.map((a) => [a.perfil_id, a]));
  const miAportacion = aportacionMap.get(userId) ?? null;

  const totalAceptadas = aportaciones.filter((a) =>
    Boolean(a.aceptado_en)
  ).length;
  const todosAceptaron =
    aportaciones.length > 0 && totalAceptadas === aportaciones.length;

  // Pasos visuales W06 (X de 4)
  const pasos = [
    {
      label: `Renta dividida: ${formatearMXN(rentaPorPersonaVista)} c/u`,
      completado: Boolean(acuerdoActual),
    },
    {
      label: `Depósito: ${formatearMXN(acuerdoActual?.deposito_total ?? inmueble.deposito)}, reembolsable`,
      completado: Boolean(acuerdoActual),
    },
    {
      label: `Reglas de convivencia (${acuerdoActual?.clausulas.length ?? 0} cláusulas)`,
      completado: Boolean(
        acuerdoActual && acuerdoActual.clausulas.length > 0
      ),
    },
    {
      label: `Aceptación del reparto (${totalAceptadas}/${aportaciones.length || nEstudiantes})`,
      completado: todosAceptaron,
    },
  ];
  const pasosCompletos = pasos.filter((p) => p.completado).length;

  function agregarClausula() {
    const limpia = nuevaClausula.trim();
    if (limpia.length < 3) return;
    setClausulas((prev) => [...prev, limpia].slice(0, 20));
    setNuevaClausula("");
  }

  async function handleGuardarAcuerdo(e: React.FormEvent) {
    e.preventDefault();
    setAviso(null);
    setGuardando(true);

    const res = await guardarPreAcuerdoAction({
      circuloId,
      renta_total: Number(rentaTotal),
      deposito_total: Number(depositoTotal),
      servicios_estimados: Number(serviciosEstimados),
      fecha_inicio: fechaInicio,
      duracion_meses: Number(duracionMeses),
      clausulas,
    });
    setGuardando(false);

    if (!res.ok) {
      setAviso({
        ok: false,
        msg: res.error ?? "No se pudo guardar el pre-acuerdo.",
      });
      return;
    }

    setModalAcuerdo(false);
    setAviso({
      ok: true,
      msg: res.message ?? "Pre-acuerdo actualizado.",
    });
    router.refresh();
  }

  async function handleAceptarMiReparto() {
    if (!acuerdoActual) return;
    setAceptando(true);
    setAviso(null);
    const res = await aceptarRepartoAcuerdoAction(acuerdoActual.id, circuloId);
    setAceptando(false);

    setAviso({
      ok: res.ok,
      msg: res.ok
        ? (res.message ?? "¡Aceptaste tu reparto!")
        : (res.error ?? "No se pudo aceptar el reparto."),
    });
    if (res.ok) router.refresh();
  }

  async function handleInvitarRoomie(roomieId: string) {
    setInvitandoId(roomieId);
    const res = await invitarRoomieACirculoAction({ circuloId, roomieId });
    setInvitandoId(null);

    setAviso({
      ok: res.ok,
      msg: res.ok
        ? (res.message ?? "Invitación enviada.")
        : (res.error ?? "No se pudo enviar la invitación."),
    });
    if (res.ok) {
      setModalInvitar(false);
      router.refresh();
    }
  }

  function handleDescargarPdf() {
    const rentaBase = acuerdoActual?.renta_total ?? inmueble.renta_mensual;
    const depBase = acuerdoActual?.deposito_total ?? inmueble.deposito;
    const servBase = acuerdoActual?.servicios_estimados ?? 0;

    const filasIntegrantes = estudiantesActivos.map((est) => {
      const ap = aportacionMap.get(est.perfil_id);
      return {
        nombre: est.nombreCompleto,
        porcentaje: ap ? ap.porcentaje : 100 / nEstudiantes,
        montoRenta: ap ? ap.monto_renta : Math.round(rentaBase / nEstudiantes),
        montoDeposito: ap
          ? ap.monto_deposito
          : Math.round(depBase / nEstudiantes),
        montoServicios: Math.round(servBase / nEstudiantes),
        aceptado: Boolean(ap?.aceptado_en),
      };
    });

    descargarPreAcuerdoPdf({
      folio: circuloId.slice(0, 8).toUpperCase(),
      version: acuerdoActual?.version ?? 1,
      circuloNombre,
      inmuebleTitulo: inmueble.titulo,
      inmuebleColonia: inmueble.colonia,
      direccionPrivada: inmueble.direccion_privada,
      arrendadorNombre: arrendador?.nombreCompleto ?? "Arrendador en Otoch",
      fechaInicio: acuerdoActual?.fecha_inicio ?? hoyIso,
      duracionMeses: acuerdoActual?.duracion_meses ?? 6,
      rentaTotal: rentaBase,
      depositoTotal: depBase,
      serviciosEstimados: servBase,
      integrantes: filasIntegrantes,
      clausulas:
        acuerdoActual?.clausulas ??
        (inmueble.reglas ? [inmueble.reglas] : [...CLAUSULAS_SUGERIDAS.slice(0, 3)]),
    });
  }

  const idsYaEnCirculo = new Set(integrantes.map((m) => m.perfil_id));
  const roomiesInvitables = matchesRoomiesDisponibles.filter(
    (rm) => !idsYaEnCirculo.has(rm.roomieId)
  );

  return (
    <aside
      aria-label="Acuerdo del círculo"
      className={cn(
        "flex flex-col gap-5 rounded-lg border border-border bg-surface p-5",
        className
      )}
    >
      {/* Encabezado progreso W06 */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-titulo-2 text-foreground">Acuerdo del círculo</h2>
          <span className="text-pequeno font-semibold text-primary">
            {pasosCompletos} de 4
          </span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-pill bg-sunken">
          <div
            className="h-full rounded-pill bg-primary transition-all"
            style={{ width: `${(pasosCompletos / 4) * 100}%` }}
          />
        </div>
      </div>

      {aviso && (
        <div
          role={aviso.ok ? "status" : "alert"}
          className={cn(
            "rounded-xs px-3 py-2 text-etiqueta font-semibold",
            aviso.ok
              ? "bg-verde-soft text-verde"
              : "bg-primary-soft text-danger"
          )}
        >
          {aviso.msg}
        </div>
      )}

      {/* Checklist 4 pasos W06 */}
      <div className="flex flex-col gap-2.5">
        {pasos.map((paso) => (
          <div key={paso.label} className="flex items-center gap-2.5">
            <span
              className={cn(
                "flex size-[22px] shrink-0 items-center justify-center rounded-pill",
                paso.completado
                  ? "bg-verde text-primary-foreground"
                  : "border border-border bg-surface text-transparent"
              )}
            >
              <Check className="size-3.5 stroke-[2.5]" aria-hidden="true" />
            </span>
            <span
              className={cn(
                "text-pequeno",
                paso.completado
                  ? "text-text-secondary"
                  : "font-semibold text-foreground"
              )}
            >
              {paso.label}
            </span>
          </div>
        ))}
      </div>

      {/* Acciones principales del acuerdo */}
      <div className="flex flex-col gap-2">
        {miRol === "estudiante" && acuerdoActual && miAportacion && !miAportacion.aceptado_en && (
          <Button
            type="button"
            disabled={aceptando}
            onClick={handleAceptarMiReparto}
            className="w-full"
          >
            <Check className="size-4" aria-hidden="true" />
            {aceptando
              ? "Registrando aceptación…"
              : `Aceptar mi reparto (${formatearMXN(miAportacion.monto_renta)})`}
          </Button>
        )}

        <Button
          type="button"
          variant={
            miRol === "estudiante" && acuerdoActual && miAportacion && !miAportacion.aceptado_en
              ? "outline"
              : "default"
          }
          size="sm"
          onClick={() => setModalAcuerdo(true)}
          className="w-full"
        >
          {acuerdoActual
            ? "Editar calculadora / pre-acuerdo"
            : "Proponer pre-acuerdo y reparto"}
        </Button>
      </div>

      {/* Lista de integrantes y su estado de aceptación */}
      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-pequeno font-semibold text-foreground">
            Integrantes ({estudiantesActivos.length}/{cupoMaximo} est.)
          </h3>

          {estudiantesOcupando.length < cupoMaximo && (
            <button
              type="button"
              onClick={() => setModalInvitar(true)}
              className="inline-flex cursor-pointer items-center gap-1 text-etiqueta font-semibold text-primary hover:underline"
            >
              <UserPlus className="size-3.5" aria-hidden="true" />
              Invitar roomie
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          {integrantes.map((integ) => {
            const ap = aportacionMap.get(integ.perfil_id);
            return (
              <div
                key={integ.perfil_id}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <OtochAvatar
                    iniciales={integ.iniciales}
                    nombre={integ.nombreCompleto}
                    size={36}
                    tone={integ.rol === "arrendador" ? "verde" : "primary"}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-pequeno font-semibold text-foreground">
                      {integ.esUsuarioActual
                        ? `Tú (${integ.nombreCompleto.split(" ")[0]})`
                        : integ.nombreCompleto}
                    </p>
                    <p
                      className={cn(
                        "truncate text-etiqueta",
                        integ.rol === "arrendador"
                          ? "font-semibold text-verde"
                          : "text-text-secondary"
                      )}
                    >
                      {integ.subtitulo}
                    </p>
                  </div>
                </div>

                {integ.rol === "estudiante" && integ.estado === "activo" && ap ? (
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-pill px-2 py-0.5 text-etiqueta font-semibold",
                      ap.aceptado_en
                        ? "bg-verde-soft text-verde"
                        : "bg-sunken text-text-secondary"
                    )}
                  >
                    {ap.aceptado_en ? (
                      <>
                        <Check className="size-3" aria-hidden="true" />
                        {formatearMXN(ap.monto_renta)}
                      </>
                    ) : (
                      <>
                        <Clock className="size-3 text-oro" aria-hidden="true" />
                        {formatearMXN(ap.monto_renta)}
                      </>
                    )}
                  </span>
                ) : integ.estado === "invitado" ? (
                  <span className="rounded-pill bg-oro/20 px-2 py-0.5 text-etiqueta font-semibold text-foreground">
                    Invitado
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Documentos y descarga de Pre-acuerdo PDF W06 */}
      <div className="flex flex-col gap-2.5 border-t border-border pt-4">
        <h3 className="text-pequeno font-semibold text-foreground">
          Documentos
        </h3>

        <div className="flex items-center gap-3 rounded-sm border border-border bg-canvas p-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xs bg-primary-soft text-primary">
            <FileText className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-pequeno font-semibold text-foreground">
              Pre_acuerdo_v{acuerdoActual?.version ?? 1}.pdf
            </p>
            <p className="text-etiqueta text-text-secondary">
              {acuerdoActual
                ? `${acuerdoActual.duracion_meses} meses · Inicio ${acuerdoActual.fecha_inicio}`
                : "Borrador preliminar en partes iguales"}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleDescargarPdf}
          className="w-full"
        >
          <Download className="size-4" aria-hidden="true" />
          Descargar Pre-acuerdo PDF
        </Button>
      </div>

      {/* Modal Calculadora de Reparto y Pre-acuerdo */}
      <Dialog open={modalAcuerdo} onOpenChange={setModalAcuerdo}>
        <DialogContent className="max-h-[90dvh] max-w-[620px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Calculadora de reparto y pre-acuerdo</DialogTitle>
            <DialogDescription>
              Al guardar se ejecuta la función RPC{" "}
              <code>repartir_partes_iguales</code> en Supabase para dividir la
              renta y el depósito equitativamente entre los{" "}
              {nEstudiantes} estudiante(s) activo(s).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGuardarAcuerdo} className="flex flex-col gap-4 pt-1">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="ac-renta"
                  className="text-etiqueta font-semibold text-foreground"
                >
                  Renta mensual total (MXN)
                </label>
                <Input
                  id="ac-renta"
                  type="number"
                  min={500}
                  step={50}
                  value={rentaTotal}
                  onChange={(e) => setRentaTotal(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="ac-deposito"
                  className="text-etiqueta font-semibold text-foreground"
                >
                  Depósito total (MXN)
                </label>
                <Input
                  id="ac-deposito"
                  type="number"
                  min={0}
                  step={50}
                  value={depositoTotal}
                  onChange={(e) => setDepositoTotal(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="ac-servicios"
                  className="text-etiqueta font-semibold text-foreground"
                >
                  Servicios estimados (MXN)
                </label>
                <Input
                  id="ac-servicios"
                  type="number"
                  min={0}
                  step={50}
                  value={serviciosEstimados}
                  onChange={(e) => setServiciosEstimados(e.target.value)}
                />
              </div>
            </div>

            {/* Vista previa en vivo del reparto en partes iguales */}
            <div className="rounded-sm bg-primary-soft p-4">
              <p className="text-etiqueta font-semibold text-primary-strong">
                Cálculo en vivo ({nEstudiantes} estudiante
                {nEstudiantes === 1 ? "" : "s"} activo
                {nEstudiantes === 1 ? "" : "s"} ·{" "}
                {(100 / nEstudiantes).toFixed(2)}% c/u)
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xs bg-surface p-2.5">
                  <p className="text-titulo-2 text-primary-strong">
                    {formatearMXN(rentaViva / nEstudiantes)}
                  </p>
                  <p className="text-etiqueta text-text-secondary">
                    Renta / persona
                  </p>
                </div>
                <div className="rounded-xs bg-surface p-2.5">
                  <p className="text-titulo-2 text-foreground">
                    {formatearMXN(depositoVivo / nEstudiantes)}
                  </p>
                  <p className="text-etiqueta text-text-secondary">
                    Depósito / persona
                  </p>
                </div>
                <div className="rounded-xs bg-surface p-2.5">
                  <p className="text-titulo-2 text-verde">
                    ~{formatearMXN(serviciosVivos / nEstudiantes)}
                  </p>
                  <p className="text-etiqueta text-text-secondary">
                    Servicios / persona
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="ac-inicio"
                  className="text-etiqueta font-semibold text-foreground"
                >
                  Fecha de inicio
                </label>
                <Input
                  id="ac-inicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="ac-duracion"
                  className="text-etiqueta font-semibold text-foreground"
                >
                  Duración en meses (1 a 24)
                </label>
                <Input
                  id="ac-duracion"
                  type="number"
                  min={1}
                  max={24}
                  value={duracionMeses}
                  onChange={(e) => setDuracionMeses(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* Cláusulas JSONB */}
            <div className="flex flex-col gap-2">
              <span className="text-etiqueta font-semibold text-foreground">
                Cláusulas de convivencia ({clausulas.length})
              </span>

              <div className="flex flex-col gap-1.5">
                {clausulas.map((cl, idx) => (
                  <div
                    key={`${cl}-${idx}`}
                    className="flex items-start justify-between gap-2 rounded-xs bg-canvas px-3 py-2 text-etiqueta text-foreground"
                  >
                    <span>
                      {idx + 1}. {cl}
                    </span>
                    <button
                      type="button"
                      aria-label={`Eliminar cláusula ${idx + 1}`}
                      onClick={() =>
                        setClausulas((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      className="shrink-0 cursor-pointer text-text-secondary hover:text-danger"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={nuevaClausula}
                  onChange={(e) => setNuevaClausula(e.target.value)}
                  placeholder="Agregar regla o cláusula acordada…"
                  className="h-10"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={agregarClausula}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Añadir
                </Button>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalAcuerdo(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando
                  ? "Calculando reparto…"
                  : "Guardar y calcular partes iguales"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para invitar roomies con match activo */}
      <Dialog open={modalInvitar} onOpenChange={setModalInvitar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar roomies al círculo</DialogTitle>
            <DialogDescription>
              Selecciona entre los estudiantes con quienes tienes match activo
              (cupo disponible: {cupoMaximo - estudiantesOcupando.length}).
            </DialogDescription>
          </DialogHeader>

          {roomiesInvitables.length === 0 ? (
            <p className="py-4 text-pequeno text-text-secondary">
              No tienes otros roomies con match activo pendientes de invitar.
              Explora la sección Roomies para conectar con más estudiantes.
            </p>
          ) : (
            <div className="flex flex-col gap-3 py-2">
              {roomiesInvitables.map((rm) => (
                <div
                  key={rm.roomieId}
                  className="flex items-center justify-between gap-3 rounded-sm bg-canvas p-3"
                >
                  <div className="flex items-center gap-2.5">
                    <OtochAvatar
                      iniciales={rm.iniciales}
                      nombre={rm.nombreCompleto}
                      size={36}
                    />
                    <div>
                      <p className="text-pequeno font-semibold text-foreground">
                        {rm.nombreCompleto}
                      </p>
                      <p className="text-etiqueta text-verde">
                        {rm.compatibilidad}% compatibles · {rm.universidadSiglas}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    disabled={invitandoId === rm.roomieId}
                    onClick={() => handleInvitarRoomie(rm.roomieId)}
                  >
                    {invitandoId === rm.roomieId ? "Enviando…" : "Invitar"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </aside>
  );
}
