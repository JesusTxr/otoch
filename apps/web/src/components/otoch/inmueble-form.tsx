"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  Image as ImageIcon,
  MapPin,
  ShieldCheck,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { guardarInmuebleAction } from "@/app/actions/inmuebles";
import { ApproximateMap } from "@/components/otoch/approximate-map";
import { FilterChip } from "@/components/otoch/filter-chip";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { COLONIAS_MERIDA } from "@/lib/geo";
import {
  formatearMXN,
  obtenerGaleriaInmueble,
  resolverUrlFotoInmueble,
  SERVICIOS_CATALOGO,
} from "@/lib/inmuebles-media";
import { createClient } from "@/lib/supabase/client";
import { inmuebleFormSchema } from "@/lib/validations/inmuebles";
import type { EstadoInmueble, TipoInmueble } from "@/types/database";

export interface InmuebleInitialValues {
  id?: string;
  titulo: string;
  descripcion: string;
  tipo: TipoInmueble;
  colonia: string;
  direccion_privada: string;
  lat: number;
  lng: number;
  renta_mensual: number;
  deposito: number;
  capacidad: number;
  habitaciones: number;
  banos: number;
  amueblado: boolean;
  servicios_incluidos: string[];
  reglas: string;
  disponible_desde: string;
  estado: EstadoInmueble;
  rutas_fotos_existentes: string[];
}

interface InmuebleFormProps {
  userId: string;
  initialValues?: InmuebleInitialValues;
}

export function InmuebleForm({ userId, initialValues }: InmuebleFormProps) {
  const router = useRouter();
  const hoyIso = new Date().toISOString().slice(0, 10);

  const [titulo, setTitulo] = React.useState(initialValues?.titulo ?? "");
  const [descripcion, setDescripcion] = React.useState(
    initialValues?.descripcion ?? ""
  );
  const [tipo, setTipo] = React.useState<TipoInmueble>(
    initialValues?.tipo ?? "casa"
  );
  const [colonia, setColonia] = React.useState(
    initialValues?.colonia ?? COLONIAS_MERIDA[0].colonia
  );
  const [direccionPrivada, setDireccionPrivada] = React.useState(
    initialValues?.direccion_privada ?? ""
  );
  const [lat, setLat] = React.useState<number>(
    initialValues?.lat ?? COLONIAS_MERIDA[0].lat
  );
  const [lng, setLng] = React.useState<number>(
    initialValues?.lng ?? COLONIAS_MERIDA[0].lng
  );
  const [rentaMensual, setRentaMensual] = React.useState<string>(
    String(initialValues?.renta_mensual ?? 7350)
  );
  const [deposito, setDeposito] = React.useState<string>(
    String(initialValues?.deposito ?? 7350)
  );
  const [capacidad, setCapacidades] = React.useState<number>(
    initialValues?.capacidad ?? 3
  );
  const [habitaciones, setHabitaciones] = React.useState<number>(
    initialValues?.habitaciones ?? 3
  );
  const [banos, setBanos] = React.useState<string>(
    String(initialValues?.banos ?? 2)
  );
  const [amueblado, setAmueblado] = React.useState<boolean>(
    initialValues?.amueblado ?? true
  );
  const [servicios, setServicios] = React.useState<string[]>(
    initialValues?.servicios_incluidos ?? ["Agua", "Internet"]
  );
  const [reglas, setReglas] = React.useState(initialValues?.reglas ?? "");
  const [disponibleDesde, setDisponibleDesde] = React.useState(
    initialValues?.disponible_desde ?? hoyIso
  );
  const [estado, setEstado] = React.useState<EstadoInmueble>(
    initialValues?.estado ?? "publicado"
  );
  const [rutasFotos, setRutasFotos] = React.useState<string[]>(
    initialValues?.rutas_fotos_existentes ?? []
  );

  const [subiendoFotos, setSubiendoFotos] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const [avisoFotos, setAvisoFotos] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const rentaNum = Number(rentaMensual) || 0;
  const estimadoPersona =
    capacidad > 0 ? Math.round(rentaNum / capacidad) : rentaNum;

  function handleSeleccionZona(nombreColonia: string) {
    setColonia(nombreColonia);
    const zona = COLONIAS_MERIDA.find((z) => z.colonia === nombreColonia);
    if (zona) {
      setLat(zona.lat);
      setLng(zona.lng);
    }
  }

  function toggleServicio(serv: string) {
    setServicios((prev) =>
      prev.includes(serv) ? prev.filter((s) => s !== serv) : [...prev, serv]
    );
  }

  async function handleArchivosSeleccionados(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setSubiendoFotos(true);
    setAvisoFotos(null);
    setErrorMsg(null);

    const supabase = createClient();
    const nuevasRutas: string[] = [];
    let falloStorage = false;

    for (const file of files.slice(0, 6)) {
      const ext = (file.name.split(".").pop() ?? "jpg")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const path = `${userId}/${crypto.randomUUID()}.${ext || "jpg"}`;

      const { error } = await supabase.storage
        .from("inmuebles")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        falloStorage = true;
      } else {
        nuevasRutas.push(path);
      }
    }

    if (falloStorage) {
      const ejemplos = obtenerGaleriaInmueble([], tipo);
      setRutasFotos((prev) =>
        [...prev, ...nuevasRutas, ejemplos[0]].slice(0, 8)
      );
      setAvisoFotos(
        "Algunas imágenes no pudieron subirse al bucket; se asignó una imagen de muestra verificada como respaldo."
      );
    } else if (nuevasRutas.length > 0) {
      setRutasFotos((prev) => [...prev, ...nuevasRutas].slice(0, 8));
      setAvisoFotos(
        `${nuevasRutas.length} fotografía(s) cargadas en Supabase Storage.`
      );
    }

    setSubiendoFotos(false);
    e.target.value = "";
  }

  function usarFotosEjemplo() {
    const ejemplos = obtenerGaleriaInmueble([], tipo);
    setRutasFotos(ejemplos);
    setAvisoFotos("Se agregaron fotografías de muestra para tu anuncio.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const payload = {
      id: initialValues?.id,
      titulo,
      descripcion,
      tipo,
      colonia,
      direccion_privada: direccionPrivada,
      lat: Number(lat),
      lng: Number(lng),
      renta_mensual: Number(rentaMensual),
      deposito: Number(deposito),
      capacidad: Number(capacidad),
      habitaciones: Number(habitaciones),
      banos: Number(banos),
      amueblado,
      servicios_incluidos: servicios,
      reglas,
      disponible_desde: disponibleDesde,
      estado,
      rutas_fotos: rutasFotos,
    };

    const parsed = inmuebleFormSchema.safeParse(payload);
    if (!parsed.success) {
      setErrorMsg(
        parsed.error.issues[0]?.message ?? "Revisa los datos del inmueble."
      );
      return;
    }

    setGuardando(true);
    const res = await guardarInmuebleAction(parsed.data);
    setGuardando(false);

    if (!res.ok) {
      setErrorMsg(res.error ?? "No se pudo guardar el inmueble.");
      return;
    }

    router.push("/mis-inmuebles?guardado=1");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/mis-inmuebles"
            className="inline-flex items-center gap-1 text-pequeno font-semibold text-text-secondary hover:text-foreground"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Volver a Mis inmuebles
          </Link>
          <h1 className="mt-1 text-titulo-web text-foreground">
            {initialValues?.id ? "Editar inmueble" : "Publicar nuevo inmueble"}
          </h1>
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="rounded-sm border border-danger/30 bg-primary-soft px-4 py-3 text-pequeno font-semibold text-danger"
        >
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          {/* Información principal */}
          <Card className="rounded-lg p-6">
            <h2 className="text-titulo-2 text-foreground">
              1. Información del anuncio
            </h2>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="inm-titulo"
                  className="text-pequeno font-semibold text-foreground"
                >
                  Título del anuncio *
                </label>
                <Input
                  id="inm-titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej. Casa en García Ginerés cerca de ruta R-41"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="inm-tipo"
                    className="text-pequeno font-semibold text-foreground"
                  >
                    Tipo de inmueble *
                  </label>
                  <select
                    id="inm-tipo"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as TipoInmueble)}
                    className="flex h-[44px] w-full rounded-btn border border-input bg-surface px-3 text-cuerpo text-foreground"
                  >
                    <option value="casa">Casa</option>
                    <option value="departamento">Departamento</option>
                    <option value="cuarto">Cuarto independiente</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="inm-disponible"
                    className="text-pequeno font-semibold text-foreground"
                  >
                    Disponible desde *
                  </label>
                  <Input
                    id="inm-disponible"
                    type="date"
                    value={disponibleDesde}
                    onChange={(e) => setDisponibleDesde(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="inm-descripcion"
                  className="text-pequeno font-semibold text-foreground"
                >
                  Descripción detallada
                </label>
                <textarea
                  id="inm-descripcion"
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe distribución, transporte cercano a universidades, iluminación y ambiente."
                  className="w-full rounded-btn border border-input bg-surface px-4 py-2.5 text-cuerpo text-foreground"
                />
              </div>
            </div>
          </Card>

          {/* Ubicación en Mérida (PostGIS) */}
          <Card className="rounded-lg p-6">
            <h2 className="text-titulo-2 text-foreground">
              2. Ubicación en Mérida (PostGIS)
            </h2>

            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="inm-zona"
                    className="text-pequeno font-semibold text-foreground"
                  >
                    Selector rápido de zona / colonia
                  </label>
                  <select
                    id="inm-zona"
                    value={
                      COLONIAS_MERIDA.some((z) => z.colonia === colonia)
                        ? colonia
                        : ""
                    }
                    onChange={(e) => {
                      if (e.target.value) handleSeleccionZona(e.target.value);
                    }}
                    className="flex h-[44px] w-full rounded-btn border border-input bg-surface px-3 text-cuerpo text-foreground"
                  >
                    <option value="">Personalizada…</option>
                    {COLONIAS_MERIDA.map((z) => (
                      <option key={z.colonia} value={z.colonia}>
                        {z.colonia}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="inm-colonia"
                    className="text-pequeno font-semibold text-foreground"
                  >
                    Colonia o fraccionamiento (público) *
                  </label>
                  <Input
                    id="inm-colonia"
                    value={colonia}
                    onChange={(e) => setColonia(e.target.value)}
                    placeholder="Ej. García Ginerés"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="inm-direccion-privada"
                  className="text-pequeno font-semibold text-foreground"
                >
                  Dirección exacta privada (oculta en el catálogo público)
                </label>
                <Input
                  id="inm-direccion-privada"
                  value={direccionPrivada}
                  onChange={(e) => setDireccionPrivada(e.target.value)}
                  placeholder="Ej. Calle 31 #204 x 24 y 26 (solo visible al cerrar círculo)"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="inm-lat"
                    className="text-etiqueta font-semibold text-text-secondary"
                  >
                    Latitud (Mérida)
                  </label>
                  <Input
                    id="inm-lat"
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={(e) => setLat(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="inm-lng"
                    className="text-etiqueta font-semibold text-text-secondary"
                  >
                    Longitud (Mérida)
                  </label>
                  <Input
                    id="inm-lng"
                    type="number"
                    step="0.0001"
                    value={lng}
                    onChange={(e) => setLng(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <ApproximateMap
                coordenadas={{ lat: Number(lat) || 20.97, lng: Number(lng) || -89.62 }}
                semillaPrivacidad={colonia}
                colonia={colonia || "Mérida"}
                alturaClase="h-[220px]"
              />
            </div>
          </Card>

          {/* Capacidad, servicios y reglas */}
          <Card className="rounded-lg p-6">
            <h2 className="text-titulo-2 text-foreground">
              3. Renta, capacidad y servicios incluidos
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="inm-renta"
                  className="text-pequeno font-semibold text-foreground"
                >
                  Renta mensual total (MXN) *
                </label>
                <Input
                  id="inm-renta"
                  type="number"
                  min={500}
                  step={50}
                  value={rentaMensual}
                  onChange={(e) => setRentaMensual(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="inm-deposito"
                  className="text-pequeno font-semibold text-foreground"
                >
                  Depósito en garantía (MXN)
                </label>
                <Input
                  id="inm-deposito"
                  type="number"
                  min={0}
                  step={50}
                  value={deposito}
                  onChange={(e) => setDeposito(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="inm-capacidad"
                  className="text-pequeno font-semibold text-foreground"
                >
                  Capacidad máx. (1–8) *
                </label>
                <Input
                  id="inm-capacidad"
                  type="number"
                  min={1}
                  max={8}
                  value={capacidad}
                  onChange={(e) => setCapacidades(Number(e.target.value))}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="inm-hab"
                  className="text-pequeno font-semibold text-foreground"
                >
                  Habitaciones *
                </label>
                <Input
                  id="inm-hab"
                  type="number"
                  min={1}
                  max={12}
                  value={habitaciones}
                  onChange={(e) => setHabitaciones(Number(e.target.value))}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="inm-banos"
                  className="text-pequeno font-semibold text-foreground"
                >
                  Baños (admite .5) *
                </label>
                <Input
                  id="inm-banos"
                  type="number"
                  min={0.5}
                  max={12}
                  step={0.5}
                  value={banos}
                  onChange={(e) => setBanos(e.target.value)}
                  required
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-sm bg-canvas p-3.5">
              <input
                type="checkbox"
                checked={amueblado}
                onChange={(e) => setAmueblado(e.target.checked)}
                className="size-5 accent-primary"
              />
              <span className="text-pequeno font-semibold text-foreground">
                Se entrega amueblado
              </span>
            </label>

            <div className="flex flex-col gap-2">
              <span className="text-pequeno font-semibold text-foreground">
                Servicios y amenidades incluidas
              </span>
              <div className="flex flex-wrap gap-2">
                {SERVICIOS_CATALOGO.map((serv) => (
                  <FilterChip
                    key={serv}
                    active={servicios.includes(serv)}
                    onClick={() => toggleServicio(serv)}
                  >
                    {serv}
                  </FilterChip>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="inm-reglas"
                className="text-pequeno font-semibold text-foreground"
              >
                Reglas de convivencia de la propiedad
              </label>
              <textarea
                id="inm-reglas"
                rows={2}
                value={reglas}
                onChange={(e) => setReglas(e.target.value)}
                placeholder="Ej. Silencio después de las 11:00 pm entre semana, no fumar en interiores."
                className="w-full rounded-btn border border-input bg-surface px-4 py-2.5 text-cuerpo text-foreground"
              />
            </div>
          </Card>

          {/* Fotografías Supabase Storage + fallback */}
          <Card className="rounded-lg p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-titulo-2 text-foreground">
                4. Fotografías del inmueble
              </h2>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={usarFotosEjemplo}
              >
                <ImageIcon className="size-4" aria-hidden="true" />
                Usar fotos de ejemplo
              </Button>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-canvas p-6 text-center transition-colors hover:bg-sunken/50">
              <Upload className="size-6 text-primary" aria-hidden="true" />
              <span className="text-pequeno font-semibold text-foreground">
                {subiendoFotos
                  ? "Subiendo imágenes a Supabase Storage…"
                  : "Selecciona fotografías (.jpg, .png, .webp)"}
              </span>
              <span className="text-etiqueta text-text-secondary">
                Bucket `inmuebles` · Hasta 5 MB por foto (con respaldo automático)
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                disabled={subiendoFotos}
                onChange={handleArchivosSeleccionados}
                className="sr-only"
              />
            </label>

            {avisoFotos && (
              <p className="text-etiqueta font-semibold text-verde">
                {avisoFotos}
              </p>
            )}

            {rutasFotos.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {rutasFotos.map((ruta, idx) => (
                  <div
                    key={`${ruta}-${idx}`}
                    className="relative h-28 overflow-hidden rounded-xs border border-border bg-sunken"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolverUrlFotoInmueble(ruta)}
                      alt={`Foto ${idx + 1}`}
                      className="size-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label={`Quitar foto ${idx + 1}`}
                      onClick={() =>
                        setRutasFotos((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      className="absolute right-1.5 top-1.5 inline-flex size-6 cursor-pointer items-center justify-center rounded-pill bg-foreground/80 text-surface"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Columna lateral sticky de resumen y publicación */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <Card className="rounded-lg p-6 shadow-sticky">
            <div className="rounded-sm bg-primary-soft p-4">
              <p className="flex items-center gap-1.5 text-etiqueta font-semibold text-primary-strong">
                <Wallet className="size-4 text-primary" aria-hidden="true" />
                Vista previa para estudiantes
              </p>
              <p className="mt-1 text-titulo-1 text-primary-strong">
                {formatearMXN(estimadoPersona)}{" "}
                <span className="text-pequeno font-normal">
                  / persona ({capacidad} cupos)
                </span>
              </p>
              <p className="text-etiqueta text-text-secondary">
                Renta total: {formatearMXN(rentaNum)} ·{" "}
                <MapPin className="inline size-3" aria-hidden="true" /> {colonia}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="inm-estado"
                className="text-pequeno font-semibold text-foreground"
              >
                Estado de publicación
              </label>
              <select
                id="inm-estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value as EstadoInmueble)}
                className="flex h-[44px] w-full rounded-btn border border-input bg-surface px-3 text-cuerpo text-foreground"
              >
                <option value="publicado">Publicado (visible en Explorar)</option>
                <option value="borrador">Borrador (oculto)</option>
                <option value="pausado">Pausado temporalmente</option>
                <option value="rentado">Rentado</option>
              </select>
            </div>

            <Button type="submit" disabled={guardando || subiendoFotos} className="w-full">
              <Check className="size-4" aria-hidden="true" />
              {guardando
                ? "Guardando…"
                : initialValues?.id
                  ? "Guardar cambios"
                  : "Publicar inmueble"}
            </Button>

            <p className="flex items-center gap-1.5 text-etiqueta text-verde">
              <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
              Tu dirección exacta permanece privada hasta formar un círculo.
            </p>
          </Card>
        </aside>
      </form>
    </div>
  );
}
