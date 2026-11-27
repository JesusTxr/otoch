"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Bus,
  Check,
  Clock,
  FileText,
  House,
  LogOut,
  Mail,
  MapPin,
  ShieldCheck,
  User,
  Wallet,
  X,
} from "lucide-react";
import { cerrarSesionAction } from "@/app/actions/auth";
import {
  actualizarPerfilAction,
  solicitarVerificacionAction,
} from "@/app/actions/perfil";
import { OtochAvatar, obtenerIniciales } from "@/components/otoch/avatar";
import { FilterChip } from "@/components/otoch/filter-chip";
import { VerifiedBadge } from "@/components/otoch/verified-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { INTERESES_SUGERIDOS } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";
import type {
  Genero,
  HorarioSueno,
  Municipio,
  Perfil,
  PerfilArrendador,
  PerfilEstudiante,
  PreferenciaRoomie,
  PreferenciasConvivencia,
  TipoArrendador,
  TipoVerificacion,
  Universidad,
  Verificacion,
} from "@/types/database";

function formatearMonedaMXN(monto: number): string {
  return `$${Math.round(monto).toLocaleString("en-US")}`;
}

interface PerfilClientProps {
  email: string;
  bienvenida: boolean;
  perfil: Perfil;
  estudiante: PerfilEstudiante | null;
  preferencias: PreferenciasConvivencia | null;
  arrendador: PerfilArrendador | null;
  universidades: Universidad[];
  municipios: Municipio[];
  verificaciones: Verificacion[];
  metricas: {
    circulos: number;
    matches: number;
    inmuebles: number;
  };
}

export function PerfilClient({
  email,
  bienvenida,
  perfil,
  estudiante,
  preferencias,
  arrendador,
  universidades,
  municipios,
  verificaciones,
  metricas,
}: PerfilClientProps) {
  const router = useRouter();
  const [dialogAbierto, setDialogAbierto] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const [enviandoVerif, setEnviandoVerif] =
    React.useState<TipoVerificacion | null>(null);
  const [evidenciaTexto, setEvidenciaTexto] = React.useState("");
  const [feedback, setFeedback] = React.useState<{
    tipo: "ok" | "error";
    texto: string;
  } | null>(
    bienvenida
      ? {
          tipo: "ok",
          texto: "¡Bienvenido a Otoch! Tu perfil inicial quedó guardado.",
        }
      : null
  );

  // Estados de edición
  const [nombre, setNombre] = React.useState(perfil.nombre);
  const [apellidos, setApellidos] = React.useState(perfil.apellidos);
  const [fechaNacimiento, setFechaNacimiento] = React.useState(
    perfil.fecha_nacimiento
  );
  const [genero, setGenero] = React.useState<Genero | "">(perfil.genero ?? "");
  const [telefono, setTelefono] = React.useState(perfil.telefono ?? "");
  const [biografia, setBiografia] = React.useState(perfil.biografia ?? "");

  // Estudiante edición
  const [universidadId, setUniversidadId] = React.useState(
    estudiante?.universidad_id ?? universidades[0]?.id ?? ""
  );
  const [municipioId, setMunicipioId] = React.useState(
    estudiante?.municipio_origen_id
      ? String(estudiante.municipio_origen_id)
      : ""
  );
  const [carrera, setCarrera] = React.useState(estudiante?.carrera ?? "");
  const [periodoActual, setPeriodoActual] = React.useState<number>(
    estudiante?.periodo_actual ?? 1
  );
  const [correoInstitucional, setCorreoInstitucional] = React.useState(
    estudiante?.correo_institucional ?? ""
  );
  const [presupuestoMax, setPresupuestoMax] = React.useState(
    String(estudiante?.presupuesto_max ?? 2500)
  );
  const [fechaMudanza, setFechaMudanza] = React.useState(
    estudiante?.fecha_mudanza ?? ""
  );
  const [buscaRoomies, setBuscaRoomies] = React.useState(
    estudiante?.busca_roomies ?? true
  );
  const [maxRoomies, setMaxRoomies] = React.useState<number>(
    estudiante?.max_roomies ?? 3
  );

  // Preferencias edición
  const [horarioSueno, setHorarioSueno] = React.useState<HorarioSueno>(
    preferencias?.horario_sueno ?? "regular"
  );
  const [limpieza, setLimpieza] = React.useState<number>(
    preferencias?.limpieza ?? 4
  );
  const [toleranciaRuido, setToleranciaRuido] = React.useState<number>(
    preferencias?.tolerancia_ruido ?? 3
  );
  const [frecuenciaVisitas, setFrecuenciaVisitas] = React.useState<number>(
    preferencias?.frecuencia_visitas ?? 2
  );
  const [estudiaEnCasa, setEstudiaEnCasa] = React.useState<number>(
    preferencias?.estudia_en_casa ?? 4
  );
  const [fuma, setFuma] = React.useState<boolean>(preferencias?.fuma ?? false);
  const [tieneMascota, setTieneMascota] = React.useState<boolean>(
    preferencias?.tiene_mascota ?? false
  );
  const [aceptaMascotas, setAceptaMascotas] = React.useState<boolean>(
    preferencias?.acepta_mascotas ?? true
  );
  const [preferenciaRoomie, setPreferenciaRoomie] =
    React.useState<PreferenciaRoomie>(
      preferencias?.preferencia_roomie ?? "indistinto"
    );
  const [intereses, setIntereses] = React.useState<string[]>(
    preferencias?.intereses ?? []
  );

  // Arrendador edición
  const [tipoArrendador, setTipoArrendador] = React.useState<TipoArrendador>(
    arrendador?.tipo ?? "persona_fisica"
  );
  const [nombreComercial, setNombreComercial] = React.useState(
    arrendador?.nombre_comercial ?? ""
  );

  const uniActual = universidades.find(
    (u) => u.id === estudiante?.universidad_id
  );
  const municipioActual = municipios.find(
    (m) => m.id === estudiante?.municipio_origen_id
  );

  const nombreCompleto = `${perfil.nombre} ${perfil.apellidos}`.trim();
  const iniciales = obtenerIniciales(perfil.nombre, perfil.apellidos);

  const subtituloIdentidad =
    perfil.rol === "estudiante"
      ? [estudiante?.carrera, uniActual?.siglas].filter(Boolean).join(" · ") ||
        "Estudiante universitario · Mérida"
      : arrendador?.tipo === "inmobiliaria" && arrendador.nombre_comercial
        ? `${arrendador.nombre_comercial} · Inmobiliaria`
        : "Arrendador particular · Mérida";

  const etiquetaInsignia =
    perfil.estado_verificacion === "verificado"
      ? perfil.rol === "estudiante"
        ? "Correo institucional verificado"
        : "Arrendador verificado"
      : perfil.estado_verificacion === "rechazado"
        ? "Verificación rechazada"
        : "Verificación pendiente";

  function estadoDeTipoVerificacion(tipo: TipoVerificacion) {
    return verificaciones.find((v) => v.tipo === tipo) ?? null;
  }

  async function handleGuardarEdicion(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setGuardando(true);

    const base = {
      rol:
        perfil.rol === "arrendador"
          ? ("arrendador" as const)
          : ("estudiante" as const),
      nombre,
      apellidos,
      fecha_nacimiento: fechaNacimiento,
      genero: genero === "" ? null : genero,
      telefono,
      biografia,
    };

    const res =
      perfil.rol === "arrendador"
        ? await actualizarPerfilAction({
            rol: "arrendador",
            perfil: base,
            arrendador: {
              tipo: tipoArrendador,
              nombre_comercial: nombreComercial,
            },
          })
        : await actualizarPerfilAction({
            rol: "estudiante",
            perfil: base,
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
            preferencias: {
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
            },
          });

    setGuardando(false);

    if (!res.ok) {
      setFeedback({
        tipo: "error",
        texto: res.error ?? "No se pudieron guardar los cambios.",
      });
      return;
    }

    setDialogAbierto(false);
    setFeedback({
      tipo: "ok",
      texto: res.message ?? "Perfil actualizado correctamente.",
    });
    router.refresh();
  }

  async function handleSolicitarVerificacion(tipo: TipoVerificacion) {
    setFeedback(null);
    setEnviandoVerif(tipo);
    const referenciaPorDefecto =
      tipo === "correo_institucional"
        ? estudiante?.correo_institucional || email
        : evidenciaTexto;

    const res = await solicitarVerificacionAction({
      tipo,
      evidencia_ruta: referenciaPorDefecto,
    });
    setEnviandoVerif(null);

    if (!res.ok) {
      setFeedback({
        tipo: "error",
        texto: res.error ?? "No se pudo registrar la solicitud.",
      });
      return;
    }

    setEvidenciaTexto("");
    setFeedback({
      tipo: "ok",
      texto:
        res.message ?? "Solicitud enviada correctamente a revisión de Otoch.",
    });
    router.refresh();
  }

  // Chips de estilo de vida derivados del cuestionario real (W07)
  const chipsEstiloVida: { label: string; active: boolean }[] = preferencias
    ? [
        {
          label:
            preferencias.horario_sueno === "temprano"
              ? "Madrugador"
              : preferencias.horario_sueno === "nocturno"
                ? "Nocturno"
                : "Horario regular",
          active: true,
        },
        {
          label:
            preferencias.limpieza >= 4
              ? "Ordenado"
              : `Orden ${preferencias.limpieza}/5`,
          active: preferencias.limpieza >= 4,
        },
        {
          label: preferencias.tiene_mascota ? "Tiene mascota" : "Sin mascotas",
          active: preferencias.tiene_mascota,
        },
        {
          label: preferencias.fuma ? "Fuma" : "No fuma",
          active: !preferencias.fuma,
        },
        {
          label:
            preferencias.frecuencia_visitas <= 2
              ? "Visitas tranquilas"
              : "Visitas fines de semana",
          active: preferencias.frecuencia_visitas >= 3,
        },
        ...preferencias.intereses.map((intItem) => ({
          label: intItem,
          active: true,
        })),
      ]
    : [];

  const tiposVerificacionRol: {
    tipo: TipoVerificacion;
    titulo: string;
    subtitulo: string;
  }[] =
    perfil.rol === "arrendador"
      ? [
          {
            tipo: "identidad",
            titulo: "Identificación oficial (INE / Pasaporte)",
            subtitulo: arrendador?.identidad_verificada
              ? "Revisada y aprobada por Otoch"
              : "Acredita tu identidad como titular",
          },
          {
            tipo: "propiedad",
            titulo: "Acreditación de propiedad",
            subtitulo: arrendador?.propiedad_verificada
              ? "Propiedad verificada por Otoch"
              : "Predial, escritura o facultad para arrendar",
          },
        ]
      : [
          {
            tipo: "correo_institucional",
            titulo: "Correo institucional",
            subtitulo:
              estudiante?.correo_institucional ||
              email ||
              "Vincula tu correo universitario",
          },
          {
            tipo: "identidad",
            titulo: "Identificación oficial",
            subtitulo: "Revisión de credencial estudiantil o INE",
          },
        ];

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado W07 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-titulo-web text-foreground">Mi perfil</h1>

        <div className="flex items-center gap-3">
          <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-[150px]">
                Editar perfil
              </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[90dvh] max-w-[640px] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar perfil</DialogTitle>
                <DialogDescription>
                  Actualiza tus datos personales y preferencias en Otoch.
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={handleGuardarEdicion}
                className="flex flex-col gap-4 pt-2"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="edit-nombre"
                      className="text-etiqueta font-semibold text-foreground"
                    >
                      Nombre(s)
                    </label>
                    <Input
                      id="edit-nombre"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="edit-apellidos"
                      className="text-etiqueta font-semibold text-foreground"
                    >
                      Apellidos
                    </label>
                    <Input
                      id="edit-apellidos"
                      value={apellidos}
                      onChange={(e) => setApellidos(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="edit-nac"
                      className="text-etiqueta font-semibold text-foreground"
                    >
                      Fecha de nacimiento
                    </label>
                    <Input
                      id="edit-nac"
                      type="date"
                      value={fechaNacimiento}
                      onChange={(e) => setFechaNacimiento(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="edit-genero"
                      className="text-etiqueta font-semibold text-foreground"
                    >
                      Género
                    </label>
                    <select
                      id="edit-genero"
                      value={genero}
                      onChange={(e) => setGenero(e.target.value as Genero | "")}
                      className="flex h-[44px] w-full rounded-btn border border-input bg-surface px-3 text-cuerpo text-foreground"
                    >
                      <option value="">Sin especificar</option>
                      <option value="mujer">Mujer</option>
                      <option value="hombre">Hombre</option>
                      <option value="no_binario">No binario</option>
                      <option value="prefiero_no_decir">Prefiero no decir</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="edit-tel"
                      className="text-etiqueta font-semibold text-foreground"
                    >
                      Teléfono
                    </label>
                    <Input
                      id="edit-tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="edit-bio"
                    className="text-etiqueta font-semibold text-foreground"
                  >
                    Biografía
                  </label>
                  <textarea
                    id="edit-bio"
                    rows={2}
                    maxLength={500}
                    value={biografia}
                    onChange={(e) => setBiografia(e.target.value)}
                    className="w-full rounded-btn border border-input bg-surface px-3.5 py-2 text-cuerpo text-foreground"
                  />
                </div>

                {perfil.rol === "estudiante" ? (
                  <>
                    <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="edit-uni"
                          className="text-etiqueta font-semibold text-foreground"
                        >
                          Universidad
                        </label>
                        <select
                          id="edit-uni"
                          value={universidadId}
                          onChange={(e) => setUniversidadId(e.target.value)}
                          className="flex h-[44px] w-full rounded-btn border border-input bg-surface px-3 text-cuerpo text-foreground"
                        >
                          {universidades.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.siglas ? `${u.siglas} — ${u.nombre}` : u.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="edit-mun"
                          className="text-etiqueta font-semibold text-foreground"
                        >
                          Municipio de origen
                        </label>
                        <select
                          id="edit-mun"
                          value={municipioId}
                          onChange={(e) => setMunicipioId(e.target.value)}
                          className="flex h-[44px] w-full rounded-btn border border-input bg-surface px-3 text-cuerpo text-foreground"
                        >
                          <option value="">Otro estado / No aplica</option>
                          {municipios.map((m) => (
                            <option key={m.id} value={String(m.id)}>
                              {m.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <label
                          htmlFor="edit-carrera"
                          className="text-etiqueta font-semibold text-foreground"
                        >
                          Carrera
                        </label>
                        <Input
                          id="edit-carrera"
                          value={carrera}
                          onChange={(e) => setCarrera(e.target.value)}
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="edit-periodo"
                          className="text-etiqueta font-semibold text-foreground"
                        >
                          Periodo (1–12)
                        </label>
                        <Input
                          id="edit-periodo"
                          type="number"
                          min={1}
                          max={12}
                          value={periodoActual}
                          onChange={(e) =>
                            setPeriodoActual(Number(e.target.value))
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="edit-correo-inst"
                          className="text-etiqueta font-semibold text-foreground"
                        >
                          Correo institucional
                        </label>
                        <Input
                          id="edit-correo-inst"
                          type="email"
                          value={correoInstitucional}
                          onChange={(e) =>
                            setCorreoInstitucional(e.target.value)
                          }
                          placeholder="matricula@utmetropolitana.edu.mx"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="edit-mudanza"
                          className="text-etiqueta font-semibold text-foreground"
                        >
                          Fecha de mudanza
                        </label>
                        <Input
                          id="edit-mudanza"
                          type="date"
                          value={fechaMudanza}
                          onChange={(e) => setFechaMudanza(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="edit-presupuesto"
                          className="text-etiqueta font-semibold text-foreground"
                        >
                          Presupuesto máx. (MXN)
                        </label>
                        <Input
                          id="edit-presupuesto"
                          type="number"
                          min={500}
                          value={presupuestoMax}
                          onChange={(e) => setPresupuestoMax(e.target.value)}
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="edit-sueno"
                          className="text-etiqueta font-semibold text-foreground"
                        >
                          Horario de sueño
                        </label>
                        <select
                          id="edit-sueno"
                          value={horarioSueno}
                          onChange={(e) =>
                            setHorarioSueno(e.target.value as HorarioSueno)
                          }
                          className="flex h-[44px] w-full rounded-btn border border-input bg-surface px-3 text-cuerpo text-foreground"
                        >
                          <option value="temprano">Madrugador</option>
                          <option value="regular">Regular</option>
                          <option value="nocturno">Nocturno</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="edit-max-roomies"
                          className="text-etiqueta font-semibold text-foreground"
                        >
                          Roomies máx. (1–5)
                        </label>
                        <Input
                          id="edit-max-roomies"
                          type="number"
                          min={1}
                          max={5}
                          value={maxRoomies}
                          onChange={(e) =>
                            setMaxRoomies(Number(e.target.value))
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-etiqueta text-text-secondary">
                          Limpieza (1–5)
                        </label>
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          value={limpieza}
                          onChange={(e) => setLimpieza(Number(e.target.value))}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-etiqueta text-text-secondary">
                          Ruido (1–5)
                        </label>
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          value={toleranciaRuido}
                          onChange={(e) =>
                            setToleranciaRuido(Number(e.target.value))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-etiqueta text-text-secondary">
                          Visitas (1–5)
                        </label>
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          value={frecuenciaVisitas}
                          onChange={(e) =>
                            setFrecuenciaVisitas(Number(e.target.value))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-etiqueta text-text-secondary">
                          Estudio (1–5)
                        </label>
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          value={estudiaEnCasa}
                          onChange={(e) =>
                            setEstudiaEnCasa(Number(e.target.value))
                          }
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <FilterChip
                        active={buscaRoomies}
                        onClick={() => setBuscaRoomies((p) => !p)}
                      >
                        Busca roomies
                      </FilterChip>
                      <FilterChip
                        active={fuma}
                        onClick={() => setFuma((p) => !p)}
                      >
                        Fuma
                      </FilterChip>
                      <FilterChip
                        active={tieneMascota}
                        onClick={() => setTieneMascota((p) => !p)}
                      >
                        Tiene mascota
                      </FilterChip>
                      <FilterChip
                        active={aceptaMascotas}
                        onClick={() => setAceptaMascotas((p) => !p)}
                      >
                        Acepta mascotas
                      </FilterChip>
                      <FilterChip
                        active={preferenciaRoomie === "mismo_genero"}
                        onClick={() =>
                          setPreferenciaRoomie((p) =>
                            p === "mismo_genero" ? "indistinto" : "mismo_genero"
                          )
                        }
                      >
                        Solo mismo género
                      </FilterChip>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-etiqueta font-semibold text-foreground">
                        Intereses
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {INTERESES_SUGERIDOS.map((item) => (
                          <FilterChip
                            key={item}
                            active={intereses.includes(item)}
                            onClick={() =>
                              setIntereses((prev) =>
                                prev.includes(item)
                                  ? prev.filter((x) => x !== item)
                                  : [...prev, item]
                              )
                            }
                          >
                            {item}
                          </FilterChip>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="edit-tipo-arr"
                        className="text-etiqueta font-semibold text-foreground"
                      >
                        Tipo de arrendador
                      </label>
                      <select
                        id="edit-tipo-arr"
                        value={tipoArrendador}
                        onChange={(e) =>
                          setTipoArrendador(e.target.value as TipoArrendador)
                        }
                        className="flex h-[44px] w-full rounded-btn border border-input bg-surface px-3 text-cuerpo text-foreground"
                      >
                        <option value="persona_fisica">Persona física</option>
                        <option value="inmobiliaria">Inmobiliaria</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="edit-comercial"
                        className="text-etiqueta font-semibold text-foreground"
                      >
                        Nombre comercial
                      </label>
                      <Input
                        id="edit-comercial"
                        value={nombreComercial}
                        onChange={(e) => setNombreComercial(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogAbierto(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={guardando}>
                    {guardando ? "Guardando…" : "Guardar cambios"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <form action={cerrarSesionAction}>
            <Button variant="secondary" size="sm" type="submit">
              <LogOut className="size-4" aria-hidden="true" />
              Cerrar sesión
            </Button>
          </form>
        </div>
      </div>

      {/* Alerta / notificación visible */}
      {feedback && (
        <div
          role={feedback.tipo === "error" ? "alert" : "status"}
          className={cn(
            "flex items-center justify-between gap-3 rounded-sm border px-4 py-3 text-pequeno font-semibold",
            feedback.tipo === "ok"
              ? "border-verde/30 bg-verde-soft text-verde"
              : "border-danger/30 bg-primary-soft text-danger"
          )}
        >
          <span>{feedback.texto}</span>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => setFeedback(null)}
            className="cursor-pointer rounded-pill p-1 hover:bg-surface/50"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Dos columnas principales W07 */}
      <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* Columna izquierda: tarjeta de identidad */}
        <Card className="items-center rounded-lg p-7 text-center">
          <OtochAvatar
            iniciales={iniciales}
            nombre={nombreCompleto}
            fotoUrl={perfil.foto_ruta}
            size={112}
          />

          <div className="flex flex-col items-center gap-2">
            <h2 className="text-titulo-1 text-foreground">{nombreCompleto}</h2>
            <p className="text-pequeno text-text-secondary">
              {subtituloIdentidad}
            </p>
            <VerifiedBadge
              estado={perfil.estado_verificacion}
              label={etiquetaInsignia}
            />
          </div>

          {/* 3 métricas en cajas canvas */}
          <div className="grid w-full grid-cols-3 gap-2.5">
            <div className="flex flex-col items-center rounded-sm bg-canvas px-2 py-3">
              <span className="text-titulo-2 text-foreground">
                {metricas.circulos}
              </span>
              <span className="text-etiqueta text-text-secondary">
                Círculos
              </span>
            </div>

            <div className="flex flex-col items-center rounded-sm bg-canvas px-2 py-3">
              <span className="text-titulo-2 text-foreground">
                {metricas.matches}
              </span>
              <span className="text-etiqueta text-text-secondary">Matches</span>
            </div>

            <div className="flex flex-col items-center rounded-sm bg-canvas px-2 py-3">
              <span className="text-titulo-2 text-foreground">
                {perfil.rol === "arrendador" ? metricas.inmuebles : "20 min"}
              </span>
              <span className="text-etiqueta text-text-secondary">
                {perfil.rol === "arrendador" ? "Inmuebles" : "Traslado máx."}
              </span>
            </div>
          </div>

          <p className="text-pequeno leading-relaxed text-text-secondary">
            {perfil.biografia ||
              (perfil.rol === "estudiante"
                ? "Completa tu presentación breve en Editar perfil para contarles a tus futuros roomies sobre ti."
                : "Agrega una descripción breve para generar mayor confianza con los estudiantes interesados.")}
          </p>
        </Card>

        {/* Columna derecha */}
        <div className="flex flex-col gap-6">
          {perfil.rol === "estudiante" && (
            <Card className="rounded-lg p-6">
              <h2 className="text-titulo-2 text-foreground">
                Mi estilo de vida
              </h2>
              {chipsEstiloVida.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {chipsEstiloVida.map((chip, index) => (
                    <span
                      key={`${chip.label}-${index}`}
                      className={cn(
                        "inline-flex items-center rounded-pill border px-4 py-2 text-pequeno font-semibold",
                        chip.active
                          ? "border-foreground bg-foreground text-surface"
                          : "border-border bg-surface text-foreground"
                      )}
                    >
                      {chip.label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-pequeno text-text-secondary">
                  Edita tu perfil para configurar tus hábitos de convivencia.
                </p>
              )}
            </Card>
          )}

          <div className="grid gap-6 xl:grid-cols-2">
            {/* Preferencias de búsqueda (estudiante) o Resumen de arrendador */}
            {perfil.rol === "estudiante" ? (
              <Card className="rounded-lg p-6">
                <h2 className="text-titulo-2 text-foreground">
                  Preferencias de búsqueda
                </h2>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2.5 text-pequeno font-semibold text-foreground">
                      <Wallet
                        className="size-4 text-text-secondary"
                        aria-hidden="true"
                      />
                      Presupuesto
                    </span>
                    <span className="text-pequeno text-text-secondary">
                      Hasta{" "}
                      {formatearMonedaMXN(estudiante?.presupuesto_max ?? 2500)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2.5 text-pequeno font-semibold text-foreground">
                      <BookOpen
                        className="size-4 text-text-secondary"
                        aria-hidden="true"
                      />
                      Escuela
                    </span>
                    <span className="text-pequeno text-text-secondary">
                      {uniActual
                        ? `${uniActual.siglas ?? uniActual.nombre} · ${uniActual.campus ?? "Mérida"}`
                        : "Mérida"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2.5 text-pequeno font-semibold text-foreground">
                      <Bus
                        className="size-4 text-text-secondary"
                        aria-hidden="true"
                      />
                      Roomies
                    </span>
                    <span className="text-pequeno text-text-secondary">
                      {estudiante?.busca_roomies
                        ? `Hasta ${estudiante.max_roomies} roomies`
                        : "Individual"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2.5 text-pequeno font-semibold text-foreground">
                      <MapPin
                        className="size-4 text-text-secondary"
                        aria-hidden="true"
                      />
                      Origen
                    </span>
                    <span className="text-pequeno text-text-secondary">
                      {municipioActual
                        ? `${municipioActual.nombre}, Yucatán`
                        : "Foráneo"}
                    </span>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="rounded-lg p-6">
                <h2 className="text-titulo-2 text-foreground">
                  Información de arrendador
                </h2>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2.5 text-pequeno font-semibold text-foreground">
                      <User
                        className="size-4 text-text-secondary"
                        aria-hidden="true"
                      />
                      Modalidad
                    </span>
                    <span className="text-pequeno text-text-secondary">
                      {arrendador?.tipo === "inmobiliaria"
                        ? "Inmobiliaria"
                        : "Persona física"}
                    </span>
                  </div>

                  {arrendador?.nombre_comercial && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2.5 text-pequeno font-semibold text-foreground">
                        <House
                          className="size-4 text-text-secondary"
                          aria-hidden="true"
                        />
                        Nombre comercial
                      </span>
                      <span className="text-pequeno text-text-secondary">
                        {arrendador.nombre_comercial}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2.5 text-pequeno font-semibold text-foreground">
                      <Mail
                        className="size-4 text-text-secondary"
                        aria-hidden="true"
                      />
                      Correo de contacto
                    </span>
                    <span className="truncate text-pequeno text-text-secondary">
                      {email}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Verificación de cuenta -> tabla verificaciones */}
            <Card className="rounded-lg p-6">
              <h2 className="text-titulo-2 text-foreground">
                Verificación de cuenta
              </h2>

              <div className="flex flex-col gap-4">
                {tiposVerificacionRol.map((item) => {
                  const solicitud = estadoDeTipoVerificacion(item.tipo);
                  const aprobada =
                    solicitud?.estado === "aprobada" ||
                    (item.tipo === "identidad" &&
                      Boolean(arrendador?.identidad_verificada)) ||
                    (item.tipo === "propiedad" &&
                      Boolean(arrendador?.propiedad_verificada));
                  const pendiente = solicitud?.estado === "pendiente";
                  const rechazada = solicitud?.estado === "rechazada";

                  return (
                    <div
                      key={item.tipo}
                      className="flex items-start justify-between gap-3 rounded-sm bg-canvas p-3.5"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-pill",
                            aprobada
                              ? "bg-verde text-primary-foreground"
                              : pendiente
                                ? "bg-oro/20 text-oro"
                                : "bg-sunken text-text-secondary"
                          )}
                        >
                          {aprobada ? (
                            <Check className="size-4" aria-hidden="true" />
                          ) : pendiente ? (
                            <Clock className="size-4" aria-hidden="true" />
                          ) : (
                            <FileText className="size-4" aria-hidden="true" />
                          )}
                        </span>

                        <div className="min-w-0">
                          <p className="text-pequeno font-semibold text-foreground">
                            {item.titulo}
                          </p>
                          <p className="truncate text-etiqueta text-text-secondary">
                            {item.subtitulo}
                          </p>
                          {rechazada && solicitud?.motivo_rechazo && (
                            <p className="mt-1 text-etiqueta text-danger">
                              Motivo: {solicitud.motivo_rechazo}
                            </p>
                          )}
                        </div>
                      </div>

                      {aprobada ? (
                        <span className="shrink-0 text-etiqueta font-semibold text-verde">
                          Aprobada
                        </span>
                      ) : pendiente ? (
                        <span className="shrink-0 rounded-pill bg-sunken px-2.5 py-1 text-etiqueta font-semibold text-foreground">
                          En revisión
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-9 px-3 text-etiqueta font-semibold"
                          disabled={enviandoVerif === item.tipo}
                          onClick={() => handleSolicitarVerificacion(item.tipo)}
                        >
                          {enviandoVerif === item.tipo
                            ? "Enviando…"
                            : "Solicitar"}
                        </Button>
                      )}
                    </div>
                  );
                })}

                <div className="flex flex-col gap-1.5 pt-1">
                  <label
                    htmlFor="verif-evidencia"
                    className="text-etiqueta text-text-secondary"
                  >
                    Folio, enlace de documento o referencia opcional:
                  </label>
                  <Input
                    id="verif-evidencia"
                    value={evidenciaTexto}
                    onChange={(e) => setEvidenciaTexto(e.target.value)}
                    placeholder="Ej. Credencial vigente / Folio INE / Predial"
                    className="h-9 text-pequeno"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Aviso LFPDPPP W07 */}
          <div className="flex items-center gap-2.5 rounded-sm bg-verde-soft px-4 py-3.5 text-pequeno font-semibold text-verde">
            <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
            Tus datos se tratan conforme a la LFPDPPP. Solo tus matches ven tu
            perfil completo.
          </div>
        </div>
      </div>
    </div>
  );
}
