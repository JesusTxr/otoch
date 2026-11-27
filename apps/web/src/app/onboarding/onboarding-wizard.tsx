"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Check,
  ChevronLeft,
  Clock,
  House,
  Moon,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { completarOnboardingAction } from "@/app/actions/perfil";
import { FilterChip } from "@/components/otoch/filter-chip";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  INTERESES_SUGERIDOS,
  perfilArrendadorSchema,
  perfilBaseSchema,
  perfilEstudianteSchema,
  preferenciasConvivenciaSchema,
} from "@/lib/validations/auth";
import { cn } from "@/lib/utils";
import type {
  Genero,
  HorarioSueno,
  Municipio,
  PreferenciaRoomie,
  RolRegistro,
  TipoArrendador,
  Universidad,
} from "@/types/database";

interface OnboardingWizardProps {
  emailUsuario: string;
  rolSugerido: RolRegistro;
  universidades: Universidad[];
  municipios: Municipio[];
}

interface ScaleSelectorProps {
  id: string;
  label: string;
  minLabel: string;
  maxLabel: string;
  value: number;
  onChange: (val: number) => void;
}

function ScaleSelector({
  id,
  label,
  minLabel,
  maxLabel,
  value,
  onChange,
}: ScaleSelectorProps) {
  return (
    <div className="flex flex-col gap-2 rounded-sm border border-border bg-canvas p-4">
      <div className="flex items-center justify-between gap-2">
        <span id={id} className="text-pequeno font-semibold text-foreground">
          {label}
        </span>
        <span className="rounded-pill bg-primary-soft px-2.5 py-0.5 text-etiqueta font-semibold text-primary-strong">
          {value} / 5
        </span>
      </div>
      <div
        role="radiogroup"
        aria-labelledby={id}
        className="grid grid-cols-5 gap-2"
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(n)}
              className={cn(
                "h-10 cursor-pointer rounded-xs border text-pequeno font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-foreground hover:bg-sunken"
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-etiqueta text-text-secondary">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

export function OnboardingWizard({
  emailUsuario,
  rolSugerido,
  universidades,
  municipios,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [paso, setPaso] = React.useState<number>(1);
  const [guardando, setGuardando] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Paso 1: Datos generales -> perfiles
  const [rol, setRol] = React.useState<RolRegistro>(rolSugerido);
  const [nombre, setNombre] = React.useState("");
  const [apellidos, setApellidos] = React.useState("");
  const [fechaNacimiento, setFechaNacimiento] = React.useState("");
  const [genero, setGenero] = React.useState<Genero | "">("");
  const [telefono, setTelefono] = React.useState("");
  const [biografia, setBiografia] = React.useState("");

  // Paso 2A: Estudiante -> perfiles_estudiante
  const esCorreoEdu = /\.(edu\.mx|uady\.mx|tecnm\.mx)$/i.test(emailUsuario);
  const [universidadId, setUniversidadId] = React.useState<string>(
    universidades[0]?.id ?? ""
  );
  const [municipioId, setMunicipioId] = React.useState<string>("");
  const [carrera, setCarrera] = React.useState("");
  const [periodoActual, setPeriodoActual] = React.useState<number>(1);
  const [correoInstitucional, setCorreoInstitucional] = React.useState(
    esCorreoEdu ? emailUsuario : ""
  );
  const [presupuestoMax, setPresupuestoMax] = React.useState<string>("2500");
  const [fechaMudanza, setFechaMudanza] = React.useState("");
  const [buscaRoomies, setBuscaRoomies] = React.useState(true);
  const [maxRoomies, setMaxRoomies] = React.useState<number>(3);

  // Paso 2B: Convivencia -> preferencias_convivencia
  const [horarioSueno, setHorarioSueno] =
    React.useState<HorarioSueno>("regular");
  const [limpieza, setLimpieza] = React.useState<number>(4);
  const [toleranciaRuido, setToleranciaRuido] = React.useState<number>(3);
  const [frecuenciaVisitas, setFrecuenciaVisitas] = React.useState<number>(2);
  const [estudiaEnCasa, setEstudiaEnCasa] = React.useState<number>(4);
  const [fuma, setFuma] = React.useState(false);
  const [tieneMascota, setTieneMascota] = React.useState(false);
  const [aceptaMascotas, setAceptaMascotas] = React.useState(true);
  const [preferenciaRoomie, setPreferenciaRoomie] =
    React.useState<PreferenciaRoomie>("indistinto");
  const [intereses, setIntereses] = React.useState<string[]>([
    "Cocina en casa",
    "Café y estudio",
  ]);

  // Paso 2C: Arrendador -> perfiles_arrendador
  const [tipoArrendador, setTipoArrendador] =
    React.useState<TipoArrendador>("persona_fisica");
  const [nombreComercial, setNombreComercial] = React.useState("");

  const totalPasos = rol === "estudiante" ? 3 : 2;
  const universidadSeleccionada = universidades.find(
    (u) => u.id === universidadId
  );

  function toggleInteres(item: string) {
    setIntereses((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  }

  function avanzarPaso1() {
    setErrorMsg(null);
    const check = perfilBaseSchema.safeParse({
      rol,
      nombre,
      apellidos,
      fecha_nacimiento: fechaNacimiento,
      genero: genero === "" ? null : genero,
      telefono,
      biografia,
    });
    if (!check.success) {
      setErrorMsg(check.error.issues[0]?.message ?? "Revisa tus datos generales.");
      return;
    }
    setPaso(2);
  }

  function avanzarPaso2Estudiante() {
    setErrorMsg(null);
    const check = perfilEstudianteSchema.safeParse({
      universidad_id: universidadId,
      municipio_origen_id: municipioId ? Number(municipioId) : null,
      carrera,
      periodo_actual: Number(periodoActual),
      correo_institucional: correoInstitucional,
      presupuesto_max: Number(presupuestoMax),
      fecha_mudanza: fechaMudanza,
      busca_roomies: buscaRoomies,
      max_roomies: Number(maxRoomies),
    });
    if (!check.success) {
      setErrorMsg(
        check.error.issues[0]?.message ?? "Revisa tus datos académicos."
      );
      return;
    }
    setPaso(3);
  }

  async function finalizarOnboarding(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const perfilPayload = {
      rol,
      nombre,
      apellidos,
      fecha_nacimiento: fechaNacimiento,
      genero: genero === "" ? null : genero,
      telefono,
      biografia,
    };

    if (rol === "estudiante") {
      const prefCheck = preferenciasConvivenciaSchema.safeParse({
        horario_sueno: horarioSueno,
        limpieza,
        tolerancia_ruido: toleranciaRuido,
        frecuencia_visitas: frecuenciaVisitas,
        estudia_en_casa: estudiaEnCasa,
        fuma,
        tiene_mascota: tieneMascota,
        acepta_mascotas: aceptaMascotas,
        preferencia_roomie: preferenciaRoomie,
        intereses,
      });
      if (!prefCheck.success) {
        setErrorMsg(
          prefCheck.error.issues[0]?.message ??
            "Revisa tu cuestionario de convivencia."
        );
        return;
      }

      setGuardando(true);
      const res = await completarOnboardingAction({
        rol: "estudiante",
        perfil: perfilPayload,
        estudiante: {
          universidad_id: universidadId,
          municipio_origen_id: municipioId ? Number(municipioId) : null,
          carrera,
          periodo_actual: Number(periodoActual),
          correo_institucional: correoInstitucional,
          presupuesto_max: Number(presupuestoMax),
          fecha_mudanza: fechaMudanza,
          busca_roomies: buscaRoomies,
          max_roomies: Number(maxRoomies),
        },
        preferencias: prefCheck.data,
      });
      setGuardando(false);

      if (!res.ok) {
        setErrorMsg(res.error ?? "No se pudo completar el registro.");
        return;
      }

      router.push("/perfil?bienvenida=1");
      router.refresh();
      return;
    }

    const arrCheck = perfilArrendadorSchema.safeParse({
      tipo: tipoArrendador,
      nombre_comercial: nombreComercial,
    });
    if (!arrCheck.success) {
      setErrorMsg(
        arrCheck.error.issues[0]?.message ??
          "Revisa los datos de tu perfil de arrendador."
      );
      return;
    }

    setGuardando(true);
    const res = await completarOnboardingAction({
      rol: "arrendador",
      perfil: perfilPayload,
      arrendador: arrCheck.data,
    });
    setGuardando(false);

    if (!res.ok) {
      setErrorMsg(res.error ?? "No se pudo completar el registro.");
      return;
    }

    router.push("/perfil?bienvenida=1");
    router.refresh();
  }

  return (
    <Card className="mx-auto w-full max-w-[680px] rounded-xl p-6 shadow-card sm:p-9">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-primary-soft px-3 py-1 text-etiqueta font-semibold text-primary-strong">
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            Paso {paso} de {totalPasos}
          </span>
          <span className="text-etiqueta text-text-secondary">
            {emailUsuario}
          </span>
        </div>

        {/* Barra de progreso */}
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${totalPasos}, minmax(0, 1fr))`,
          }}
          aria-hidden="true"
        >
          {Array.from({ length: totalPasos }).map((_, idx) => (
            <span
              key={idx}
              className={cn(
                "h-1.5 rounded-pill transition-colors",
                idx + 1 <= paso ? "bg-primary" : "bg-sunken"
              )}
            />
          ))}
        </div>

        <CardTitle className="text-titulo-web">
          {paso === 1 && "Cuéntanos sobre ti"}
          {paso === 2 && rol === "estudiante" && "Tu escuela y búsqueda en Mérida"}
          {paso === 3 && rol === "estudiante" && "Tus hábitos de convivencia"}
          {paso === 2 && rol === "arrendador" && "Datos de arrendador"}
        </CardTitle>

        <CardDescription className="text-cuerpo">
          {paso === 1 &&
            "Usamos estos datos para crear tu perfil verificado dentro de Otoch."}
          {paso === 2 &&
            rol === "estudiante" &&
            "Calcularemos distancias reales a tu campus y filtraremos cuartos dentro de tu presupuesto."}
          {paso === 3 &&
            rol === "estudiante" &&
            "Con estas respuestas calculamos tu porcentaje de compatibilidad con futuros roomies."}
          {paso === 2 &&
            rol === "arrendador" &&
            "Configura cómo aparecerán tus anuncios verificados ante los estudiantes."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {errorMsg && (
          <div
            role="alert"
            className="mb-5 rounded-xs border border-danger/30 bg-primary-soft px-4 py-3 text-pequeno font-semibold text-danger"
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={finalizarOnboarding} className="flex flex-col gap-5">
          {/* PASO 1: Datos generales */}
          {paso === 1 && (
            <>
              <div className="flex flex-col gap-2">
                <span className="text-pequeno font-semibold text-foreground">
                  ¿Cómo vas a usar Otoch?
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    aria-pressed={rol === "estudiante"}
                    onClick={() => setRol("estudiante")}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-sm border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      rol === "estudiante"
                        ? "border-primary bg-primary-soft"
                        : "border-border bg-surface hover:bg-sunken"
                    )}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xs bg-surface text-primary">
                      <BookOpen className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-cuerpo font-semibold text-foreground">
                        Estudiante
                      </p>
                      <p className="text-etiqueta text-text-secondary">
                        Busco cuarto cerca de mi escuela y roomies compatibles
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    aria-pressed={rol === "arrendador"}
                    onClick={() => setRol("arrendador")}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-sm border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      rol === "arrendador"
                        ? "border-primary bg-primary-soft"
                        : "border-border bg-surface hover:bg-sunken"
                    )}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xs bg-surface text-primary">
                      <House className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-cuerpo font-semibold text-foreground">
                        Arrendador
                      </p>
                      <p className="text-etiqueta text-text-secondary">
                        Rento cuartos, departamentos o casas en Mérida
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="onb-nombre"
                    className="text-pequeno font-semibold text-foreground"
                  >
                    Nombre(s) *
                  </label>
                  <Input
                    id="onb-nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Angel"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="onb-apellidos"
                    className="text-pequeno font-semibold text-foreground"
                  >
                    Apellidos *
                  </label>
                  <Input
                    id="onb-apellidos"
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    placeholder="Ej. Noh"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="onb-nacimiento"
                    className="text-pequeno font-semibold text-foreground"
                  >
                    Fecha de nacimiento *
                  </label>
                  <Input
                    id="onb-nacimiento"
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    required
                  />
                  <span className="text-etiqueta text-text-secondary">
                    Mayor de 18 años
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="onb-genero"
                    className="text-pequeno font-semibold text-foreground"
                  >
                    Género (opcional)
                  </label>
                  <select
                    id="onb-genero"
                    value={genero}
                    onChange={(e) => setGenero(e.target.value as Genero | "")}
                    className="flex h-[44px] w-full rounded-btn border border-input bg-surface px-3 text-cuerpo text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Sin especificar</option>
                    <option value="mujer">Mujer</option>
                    <option value="hombre">Hombre</option>
                    <option value="no_binario">No binario</option>
                    <option value="prefiero_no_decir">Prefiero no decir</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="onb-telefono"
                    className="text-pequeno font-semibold text-foreground"
                  >
                    Teléfono (opcional)
                  </label>
                  <Input
                    id="onb-telefono"
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="999 123 4567"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="onb-bio"
                  className="text-pequeno font-semibold text-foreground"
                >
                  Presentación breve (opcional)
                </label>
                <textarea
                  id="onb-bio"
                  rows={3}
                  maxLength={500}
                  value={biografia}
                  onChange={(e) => setBiografia(e.target.value)}
                  placeholder={
                    rol === "estudiante"
                      ? "Ej. Soy de Tizimín, estudio en la UTM y busco cuarto cerca de la escuela. Ordenado y tranquilo entre semana."
                      : "Ej. Arrendador en García Ginerés con experiencia recibiendo estudiantes foráneos."
                  }
                  className="w-full rounded-btn border border-input bg-surface px-4 py-2.5 text-cuerpo text-foreground placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span className="text-right text-etiqueta text-text-secondary">
                  {biografia.length} / 500
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="button" onClick={avanzarPaso1}>
                  Continuar
                </Button>
              </div>
            </>
          )}

          {/* PASO 2A: Estudiante */}
          {paso === 2 && rol === "estudiante" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="onb-universidad"
                    className="text-pequeno font-semibold text-foreground"
                  >
                    Universidad en Mérida *
                  </label>
                  <select
                    id="onb-universidad"
                    value={universidadId}
                    onChange={(e) => setUniversidadId(e.target.value)}
                    className="flex h-[44px] w-full rounded-btn border border-input bg-surface px-3 text-cuerpo text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    <option value="">Selecciona tu universidad</option>
                    {universidades.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.siglas ? `${u.siglas} — ${u.nombre}` : u.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="onb-municipio"
                    className="text-pequeno font-semibold text-foreground"
                  >
                    Municipio de origen (Yucatán)
                  </label>
                  <select
                    id="onb-municipio"
                    value={municipioId}
                    onChange={(e) => setMunicipioId(e.target.value)}
                    className="flex h-[44px] w-full rounded-btn border border-input bg-surface px-3 text-cuerpo text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Foráneo de otro estado / No aplica</option>
                    {municipios.map((m) => (
                      <option key={m.id} value={String(m.id)}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="onb-carrera"
                    className="text-pequeno font-semibold text-foreground"
                  >
                    Carrera o programa académico *
                  </label>
                  <Input
                    id="onb-carrera"
                    value={carrera}
                    onChange={(e) => setCarrera(e.target.value)}
                    placeholder="Ej. Ing. en Desarrollo de Software"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="onb-periodo"
                    className="text-pequeno font-semibold text-foreground"
                  >
                    Periodo (1–12) *
                  </label>
                  <Input
                    id="onb-periodo"
                    type="number"
                    min={1}
                    max={12}
                    value={periodoActual}
                    onChange={(e) => setPeriodoActual(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="onb-correo-inst"
                  className="text-pequeno font-semibold text-foreground"
                >
                  Correo institucional
                </label>
                <Input
                  id="onb-correo-inst"
                  type="email"
                  value={correoInstitucional}
                  onChange={(e) => setCorreoInstitucional(e.target.value)}
                  placeholder={
                    universidadSeleccionada?.dominio_correo
                      ? `tu.usuario@${universidadSeleccionada.dominio_correo}`
                      : "matricula@utmetropolitana.edu.mx"
                  }
                />
                {universidadSeleccionada?.dominio_correo && (
                  <span className="text-etiqueta text-verde">
                    Dominio esperado para {universidadSeleccionada.siglas}: @
                    {universidadSeleccionada.dominio_correo}
                  </span>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="onb-presupuesto"
                    className="flex items-center gap-1.5 text-pequeno font-semibold text-foreground"
                  >
                    <Wallet className="size-4 text-primary" aria-hidden="true" />
                    Presupuesto mensual máx. (MXN) *
                  </label>
                  <Input
                    id="onb-presupuesto"
                    type="number"
                    min={500}
                    step={50}
                    value={presupuestoMax}
                    onChange={(e) => setPresupuestoMax(e.target.value)}
                    placeholder="2500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="onb-mudanza"
                    className="text-pequeno font-semibold text-foreground"
                  >
                    Fecha estimada de mudanza
                  </label>
                  <Input
                    id="onb-mudanza"
                    type="date"
                    value={fechaMudanza}
                    onChange={(e) => setFechaMudanza(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid items-center gap-4 rounded-sm bg-canvas p-4 sm:grid-cols-[1fr_180px]">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={buscaRoomies}
                    onChange={(e) => setBuscaRoomies(e.target.checked)}
                    className="size-5 accent-primary"
                  />
                  <span>
                    <span className="block text-pequeno font-semibold text-foreground">
                      Quiero compartir vivienda con roomies
                    </span>
                    <span className="block text-etiqueta text-text-secondary">
                      Dividir la renta en partes iguales dentro de un círculo
                    </span>
                  </span>
                </label>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="onb-max-roomies"
                    className="text-etiqueta font-semibold text-foreground"
                  >
                    Máximo de roomies (1–5)
                  </label>
                  <Input
                    id="onb-max-roomies"
                    type="number"
                    min={1}
                    max={5}
                    value={maxRoomies}
                    disabled={!buscaRoomies}
                    onChange={(e) => setMaxRoomies(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPaso(1)}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Atrás
                </Button>
                <Button type="button" onClick={avanzarPaso2Estudiante}>
                  Continuar al cuestionario
                </Button>
              </div>
            </>
          )}

          {/* PASO 2B (Paso 3 visual): Cuestionario de convivencia */}
          {paso === 3 && rol === "estudiante" && (
            <>
              <div className="flex flex-col gap-2">
                <span className="text-pequeno font-semibold text-foreground">
                  Horario habitual de sueño
                </span>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {(
                    [
                      {
                        val: "temprano",
                        titulo: "Madrugador",
                        desc: "Duermo antes de las 10:30 pm",
                        icon: Clock,
                      },
                      {
                        val: "regular",
                        titulo: "Regular",
                        desc: "Entre 10:30 pm y 12:00 am",
                        icon: Clock,
                      },
                      {
                        val: "nocturno",
                        titulo: "Nocturno",
                        desc: "Después de medianoche",
                        icon: Moon,
                      },
                    ] as const
                  ).map((item) => {
                    const Icon = item.icon;
                    const active = horarioSueno === item.val;
                    return (
                      <button
                        key={item.val}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setHorarioSueno(item.val)}
                        className={cn(
                          "flex cursor-pointer flex-col gap-1 rounded-sm border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          active
                            ? "border-primary bg-primary-soft"
                            : "border-border bg-surface hover:bg-sunken"
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-4",
                            active ? "text-primary" : "text-text-secondary"
                          )}
                          aria-hidden="true"
                        />
                        <span className="text-pequeno font-semibold text-foreground">
                          {item.titulo}
                        </span>
                        <span className="text-etiqueta text-text-secondary">
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <ScaleSelector
                  id="scale-limpieza"
                  label="Orden y limpieza"
                  minLabel="Relajado"
                  maxLabel="Muy ordenado"
                  value={limpieza}
                  onChange={setLimpieza}
                />
                <ScaleSelector
                  id="scale-ruido"
                  label="Tolerancia al ruido"
                  minLabel="Silencio total"
                  maxLabel="Ambiente animado"
                  value={toleranciaRuido}
                  onChange={setToleranciaRuido}
                />
                <ScaleSelector
                  id="scale-visitas"
                  label="Frecuencia de visitas"
                  minLabel="Casi nunca"
                  maxLabel="Frecuentes"
                  value={frecuenciaVisitas}
                  onChange={setFrecuenciaVisitas}
                />
                <ScaleSelector
                  id="scale-estudio"
                  label="Tiempo de estudio en casa"
                  minLabel="Estudio fuera"
                  maxLabel="Siempre en casa"
                  value={estudiaEnCasa}
                  onChange={setEstudiaEnCasa}
                />
              </div>

              {/* Hábitos booleanos y preferencia de género */}
              <div className="flex flex-col gap-2">
                <span className="text-pequeno font-semibold text-foreground">
                  Estilo de vida en casa
                </span>
                <div className="flex flex-wrap gap-2">
                  <FilterChip
                    active={fuma}
                    onClick={() => setFuma((prev) => !prev)}
                  >
                    Fumo tabaco/vape
                  </FilterChip>
                  <FilterChip
                    active={tieneMascota}
                    onClick={() => setTieneMascota((prev) => !prev)}
                  >
                    <PawPrint className="size-3.5" aria-hidden="true" />
                    Tengo mascota
                  </FilterChip>
                  <FilterChip
                    active={aceptaMascotas}
                    onClick={() => setAceptaMascotas((prev) => !prev)}
                  >
                    Acepto vivir con mascotas
                  </FilterChip>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="onb-pref-roomie"
                  className="text-pequeno font-semibold text-foreground"
                >
                  Preferencia sobre tus roomies
                </label>
                <select
                  id="onb-pref-roomie"
                  value={preferenciaRoomie}
                  onChange={(e) =>
                    setPreferenciaRoomie(e.target.value as PreferenciaRoomie)
                  }
                  className="flex h-[44px] w-full rounded-btn border border-input bg-surface px-3 text-cuerpo text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="indistinto">Indistinto</option>
                  <option value="mismo_genero">Mismo género</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-pequeno font-semibold text-foreground">
                  Intereses y pasatiempos (selecciona los que quieras)
                </span>
                <div className="flex flex-wrap gap-2">
                  {INTERESES_SUGERIDOS.map((item) => (
                    <FilterChip
                      key={item}
                      active={intereses.includes(item)}
                      onClick={() => toggleInteres(item)}
                    >
                      {item}
                    </FilterChip>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPaso(2)}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Atrás
                </Button>
                <Button type="submit" disabled={guardando}>
                  <Check className="size-4" aria-hidden="true" />
                  {guardando ? "Guardando perfil…" : "Finalizar y ver mi perfil"}
                </Button>
              </div>
            </>
          )}

          {/* PASO 2C: Arrendador */}
          {paso === 2 && rol === "arrendador" && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  aria-pressed={tipoArrendador === "persona_fisica"}
                  onClick={() => setTipoArrendador("persona_fisica")}
                  className={cn(
                    "flex cursor-pointer flex-col gap-1 rounded-sm border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    tipoArrendador === "persona_fisica"
                      ? "border-primary bg-primary-soft"
                      : "border-border bg-surface hover:bg-sunken"
                  )}
                >
                  <span className="text-cuerpo font-semibold text-foreground">
                    Persona física
                  </span>
                  <span className="text-etiqueta text-text-secondary">
                    Propietario directo de cuarto, departamento o casa
                  </span>
                </button>

                <button
                  type="button"
                  aria-pressed={tipoArrendador === "inmobiliaria"}
                  onClick={() => setTipoArrendador("inmobiliaria")}
                  className={cn(
                    "flex cursor-pointer flex-col gap-1 rounded-sm border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    tipoArrendador === "inmobiliaria"
                      ? "border-primary bg-primary-soft"
                      : "border-border bg-surface hover:bg-sunken"
                  )}
                >
                  <span className="text-cuerpo font-semibold text-foreground">
                    Inmobiliaria / Administración
                  </span>
                  <span className="text-etiqueta text-text-secondary">
                    Administro varias propiedades estudiantiles
                  </span>
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="onb-comercial"
                  className="text-pequeno font-semibold text-foreground"
                >
                  Nombre comercial{" "}
                  {tipoArrendador === "inmobiliaria" ? "*" : "(opcional)"}
                </label>
                <Input
                  id="onb-comercial"
                  value={nombreComercial}
                  onChange={(e) => setNombreComercial(e.target.value)}
                  placeholder="Ej. Residencias Universitarias Mérida"
                  required={tipoArrendador === "inmobiliaria"}
                />
              </div>

              <div className="flex items-start gap-3 rounded-sm bg-verde-soft p-4 text-pequeno text-verde">
                <ShieldCheck
                  className="mt-0.5 size-5 shrink-0"
                  aria-hidden="true"
                />
                <p>
                  Al finalizar podrás solicitar la verificación de tu
                  identificación oficial y documento de propiedad desde tu
                  perfil para obtener la insignia{" "}
                  <strong>Arrendador verificado</strong>.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPaso(1)}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Atrás
                </Button>
                <Button type="submit" disabled={guardando}>
                  <Check className="size-4" aria-hidden="true" />
                  {guardando ? "Guardando perfil…" : "Finalizar registro"}
                </Button>
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
