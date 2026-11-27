"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  Layers,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  registrarSwipeAction,
  type MatchDetectadoInfo,
} from "@/app/actions/inmuebles";
import { ApproximateMap } from "@/components/otoch/approximate-map";
import { FilterChip } from "@/components/otoch/filter-chip";
import {
  ListingGridCard,
  ListingSwipeCard,
} from "@/components/otoch/listing-card";
import { MatchModal } from "@/components/otoch/match-modal";
import { SwipeActions } from "@/components/otoch/swipe-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { calcularDistanciaKm, estimarMinutosTraslado } from "@/lib/geo";
import type { UniversidadConCoords } from "@/lib/inmuebles-queries";
import type {
  InmuebleConDetalle,
  RolUsuario,
  TipoInmueble,
} from "@/types/database";

interface ExplorarClientProps {
  usuarioIniciales: string;
  rolUsuario: RolUsuario | null;
  universidadPreferidaId: string | null;
  presupuestoEstudiante: number | null;
  universidades: UniversidadConCoords[];
  inmueblesIniciales: InmuebleConDetalle[];
}

export function ExplorarClient({
  usuarioIniciales,
  rolUsuario,
  universidadPreferidaId,
  presupuestoEstudiante,
  universidades,
  inmueblesIniciales,
}: ExplorarClientProps) {
  const router = useRouter();
  const [evaluadosIds, setEvaluadosIds] = React.useState<Set<string>>(
    () => new Set()
  );
  const [modoVista, setModoVista] = React.useState<"swipe" | "grid">("swipe");
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] =
    React.useState(false);

  // Filtros funcionales
  const [busqueda, setBusqueda] = React.useState("");
  const [universidadId, setUniversidadId] = React.useState<string>(
    universidadPreferidaId ?? universidades[0]?.id ?? ""
  );
  const [presupuestoMax, setPresupuestoMax] = React.useState<string>("");
  const [tipoFiltro, setTipoFiltro] = React.useState<TipoInmueble | "todos">(
    "todos"
  );
  const [distanciaMaxKm, setDistanciaMaxKm] = React.useState<number | null>(
    null
  );
  const [soloAmueblado, setSoloAmueblado] = React.useState(false);
  const [soloMascotas, setSoloMascotas] = React.useState(false);
  const [soloCerca20Min, setSoloCerca20Min] = React.useState(false);

  const [procesandoSwipe, setProcesandoSwipe] = React.useState(false);
  const [matchActivo, setMatchActivo] =
    React.useState<MatchDetectadoInfo | null>(null);
  const [errorBanner, setErrorBanner] = React.useState<string | null>(null);

  const uniReferencia =
    universidades.find((u) => u.id === universidadId) ?? universidades[0];
  const siglasRef = uniReferencia?.siglas ?? "UTM";

  const inmueblesConDistancia = React.useMemo(() => {
    return inmueblesIniciales
      .filter((inm) => !evaluadosIds.has(inm.id))
      .map((inm) => {
        const km = uniReferencia
          ? calcularDistanciaKm(inm.coordenadas, uniReferencia.coordenadas)
          : 4.0;
        const minutos = estimarMinutosTraslado(km);
        return { inm, km, minutos };
      });
  }, [inmueblesIniciales, evaluadosIds, uniReferencia]);

  const filtrados = React.useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const topePresupuesto = presupuestoMax ? Number(presupuestoMax) : null;

    return inmueblesConDistancia.filter(({ inm, km, minutos }) => {
      if (
        q &&
        !inm.titulo.toLowerCase().includes(q) &&
        !inm.colonia.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (tipoFiltro !== "todos" && inm.tipo !== tipoFiltro) {
        return false;
      }
      if (topePresupuesto && inm.rentaPorPersona > topePresupuesto) {
        return false;
      }
      if (distanciaMaxKm !== null && km > distanciaMaxKm) {
        return false;
      }
      if (soloCerca20Min && minutos > 20) {
        return false;
      }
      if (soloAmueblado && !inm.amueblado) {
        return false;
      }
      if (
        soloMascotas &&
        !inm.servicios_incluidos.some((s) =>
          s.toLowerCase().includes("mascota")
        )
      ) {
        return false;
      }
      return true;
    });
  }, [
    inmueblesConDistancia,
    busqueda,
    presupuestoMax,
    tipoFiltro,
    distanciaMaxKm,
    soloCerca20Min,
    soloAmueblado,
    soloMascotas,
  ]);

  const actual = filtrados[0] ?? null;
  const siguientesCercanos = filtrados.slice(1, 4);

  function limpiarFiltros() {
    setBusqueda("");
    setPresupuestoMax("");
    setTipoFiltro("todos");
    setDistanciaMaxKm(null);
    setSoloAmueblado(false);
    setSoloMascotas(false);
    setSoloCerca20Min(false);
  }

  async function ejecutarSwipe(
    inmuebleId: string,
    decision: "me_interesa" | "descartar"
  ) {
    if (procesandoSwipe) return;
    setErrorBanner(null);
    setProcesandoSwipe(true);

    // Excluir inmediatamente en UI para fluidez de swipe
    setEvaluadosIds((prev) => {
      const next = new Set(prev);
      next.add(inmuebleId);
      return next;
    });

    const res = await registrarSwipeAction({
      inmueble_id: inmuebleId,
      decision,
    });
    setProcesandoSwipe(false);

    if (!res.ok) {
      setErrorBanner(res.error ?? "No se pudo guardar tu evaluación.");
      return;
    }

    if (res.match) {
      setMatchActivo(res.match);
    }
  }

  const hayAlgunFiltroActivo =
    Boolean(busqueda.trim()) ||
    Boolean(presupuestoMax) ||
    tipoFiltro !== "todos" ||
    distanciaMaxKm !== null ||
    soloAmueblado ||
    soloMascotas ||
    soloCerca20Min;

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado W02 */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-titulo-web text-foreground">Explorar</h1>
          <p className="mt-1 flex items-center gap-1.5 text-pequeno text-text-secondary">
            <MapPin className="size-4 text-primary" aria-hidden="true" />
            Mérida · {filtrados.length}{" "}
            {filtrados.length === 1 ? "inmueble disponible" : "inmuebles disponibles"}{" "}
            referenciados a {siglasRef}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[240px] flex-1 sm:w-[300px]">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-secondary"
              aria-hidden="true"
            />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por colonia o anuncio"
              aria-label="Buscar por colonia o anuncio"
              className="rounded-pill pl-10"
            />
          </div>

          <Button
            type="button"
            variant={mostrarFiltrosAvanzados ? "default" : "outline"}
            size="icon"
            aria-label="Mostrar filtros de búsqueda"
            aria-expanded={mostrarFiltrosAvanzados}
            onClick={() => setMostrarFiltrosAvanzados((p) => !p)}
          >
            <SlidersHorizontal className="size-5" aria-hidden="true" />
          </Button>

          <div
            role="group"
            aria-label="Modo de visualización"
            className="inline-flex rounded-pill border border-border bg-surface p-1"
          >
            <button
              type="button"
              aria-label="Vista deslizable (Swipe)"
              aria-pressed={modoVista === "swipe"}
              onClick={() => setModoVista("swipe")}
              className={`inline-flex size-9 cursor-pointer items-center justify-center rounded-pill transition-colors ${
                modoVista === "swipe"
                  ? "bg-primary text-primary-foreground"
                  : "text-text-secondary hover:text-foreground"
              }`}
            >
              <Layers className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Vista en cuadrícula"
              aria-pressed={modoVista === "grid"}
              onClick={() => setModoVista("grid")}
              className={`inline-flex size-9 cursor-pointer items-center justify-center rounded-pill transition-colors ${
                modoVista === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "text-text-secondary hover:text-foreground"
              }`}
            >
              <LayoutGrid className="size-4" aria-hidden="true" />
            </button>
          </div>

          {rolUsuario === "arrendador" && (
            <Button size="sm" asChild>
              <Link href="/mis-inmuebles/nuevo">
                <Plus className="size-4" aria-hidden="true" />
                Publicar
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Chips rápidos W02 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <FilterChip
          active={!hayAlgunFiltroActivo}
          onClick={limpiarFiltros}
        >
          Todos
        </FilterChip>

        <FilterChip
          active={presupuestoMax === "3000"}
          onClick={() =>
            setPresupuestoMax((p) => (p === "3000" ? "" : "3000"))
          }
        >
          ≤ $3,000 por persona
        </FilterChip>

        {presupuestoEstudiante && presupuestoEstudiante !== 3000 && (
          <FilterChip
            active={presupuestoMax === String(Math.round(presupuestoEstudiante))}
            onClick={() =>
              setPresupuestoMax((p) =>
                p === String(Math.round(presupuestoEstudiante))
                  ? ""
                  : String(Math.round(presupuestoEstudiante))
              )
            }
          >
            Mi presupuesto (≤ ${Math.round(presupuestoEstudiante).toLocaleString("en-US")})
          </FilterChip>
        )}

        <FilterChip
          active={soloCerca20Min}
          onClick={() => setSoloCerca20Min((p) => !p)}
        >
          ≤ 20 min a {siglasRef}
        </FilterChip>

        <FilterChip
          active={soloAmueblado}
          onClick={() => setSoloAmueblado((p) => !p)}
        >
          Amueblado
        </FilterChip>

        <FilterChip
          active={soloMascotas}
          onClick={() => setSoloMascotas((p) => !p)}
        >
          Acepta mascotas
        </FilterChip>
      </div>

      {/* Panel desplegable de filtros detallados */}
      {mostrarFiltrosAvanzados && (
        <Card className="grid gap-4 rounded-lg p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="filtro-uni"
              className="text-etiqueta font-semibold text-foreground"
            >
              Universidad de referencia
            </label>
            <select
              id="filtro-uni"
              value={universidadId}
              onChange={(e) => setUniversidadId(e.target.value)}
              className="h-10 rounded-btn border border-input bg-surface px-3 text-pequeno text-foreground"
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
              htmlFor="filtro-presupuesto"
              className="text-etiqueta font-semibold text-foreground"
            >
              Presupuesto máx. por persona (MXN)
            </label>
            <Input
              id="filtro-presupuesto"
              type="number"
              min={500}
              step={100}
              value={presupuestoMax}
              onChange={(e) => setPresupuestoMax(e.target.value)}
              placeholder="Ej. 2800"
              className="h-10"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="filtro-tipo"
              className="text-etiqueta font-semibold text-foreground"
            >
              Tipo de inmueble
            </label>
            <select
              id="filtro-tipo"
              value={tipoFiltro}
              onChange={(e) =>
                setTipoFiltro(e.target.value as TipoInmueble | "todos")
              }
              className="h-10 rounded-btn border border-input bg-surface px-3 text-pequeno text-foreground"
            >
              <option value="todos">Todos los tipos</option>
              <option value="casa">Casa</option>
              <option value="departamento">Departamento</option>
              <option value="cuarto">Cuarto independiente</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="filtro-distancia"
              className="text-etiqueta font-semibold text-foreground"
            >
              Distancia aproximada al campus
            </label>
            <select
              id="filtro-distancia"
              value={distanciaMaxKm === null ? "" : String(distanciaMaxKm)}
              onChange={(e) =>
                setDistanciaMaxKm(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="h-10 rounded-btn border border-input bg-surface px-3 text-pequeno text-foreground"
            >
              <option value="">Cualquier distancia en Mérida</option>
              <option value="3">Hasta 3 km</option>
              <option value="6">Hasta 6 km</option>
              <option value="10">Hasta 10 km</option>
              <option value="15">Hasta 15 km</option>
            </select>
          </div>
        </Card>
      )}

      {errorBanner && (
        <div
          role="alert"
          className="rounded-sm border border-danger/30 bg-primary-soft px-4 py-3 text-pequeno font-semibold text-danger"
        >
          {errorBanner}
        </div>
      )}

      {/* Contenido vacío cuando ya se evaluaron o filtraron todos */}
      {filtrados.length === 0 ? (
        <Card className="items-center gap-4 rounded-xl p-10 text-center">
          <h2 className="text-titulo-1 text-foreground">
            Ya viste todos los inmuebles con estos filtros
          </h2>
          <p className="max-w-[480px] text-cuerpo text-text-secondary">
            Puedes ampliar la distancia o el presupuesto para ver más opciones
            en Mérida, o explorar perfiles de roomies compatibles.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-1">
            {hayAlgunFiltroActivo && (
              <Button type="button" variant="outline" onClick={limpiarFiltros}>
                Ampliar distancia y limpiar filtros
              </Button>
            )}
            <Button asChild>
              <Link href="/roomies">Buscar roomies compatibles</Link>
            </Button>
          </div>
        </Card>
      ) : modoVista === "grid" ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtrados.map(({ inm, minutos }) => (
            <ListingGridCard
              key={inm.id}
              inmueble={inm}
              minutosUniversidad={minutos}
              siglasUniversidad={siglasRef}
              onMeInteresa={() => ejecutarSwipe(inm.id, "me_interesa")}
            />
          ))}
        </div>
      ) : (
        /* Vista Swipe en dos columnas W02 */
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,500px)_minmax(0,1fr)]">
          {actual && (
            <div className="flex flex-col items-center gap-6">
              <ListingSwipeCard
                key={actual.inm.id}
                inmueble={actual.inm}
                minutosUniversidad={actual.minutos}
                siglasUniversidad={siglasRef}
                disabled={procesandoSwipe}
                onSwipe={(decision) => ejecutarSwipe(actual.inm.id, decision)}
              />

              <SwipeActions
                disabled={procesandoSwipe}
                onDescartar={() => ejecutarSwipe(actual.inm.id, "descartar")}
                onMeInteresa={() => ejecutarSwipe(actual.inm.id, "me_interesa")}
                onSuper={() => router.push(`/inmuebles/${actual.inm.id}`)}
                superLabel="Abrir detalle completo del inmueble"
              />
            </div>
          )}

          {/* Columna lateral derecha W02 */}
          <div className="hidden flex-col gap-6 lg:flex">
            {actual && (
              <ApproximateMap
                coordenadas={actual.inm.coordenadas}
                semillaPrivacidad={actual.inm.id}
                colonia={actual.inm.colonia}
                leyendaRuta={`${actual.km} km · ~${actual.minutos} min a ${siglasRef}`}
                alturaClase="h-[300px]"
              />
            )}

            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <h2 className="text-titulo-2 text-foreground">
                  También cerca de tu escuela
                </h2>
                <button
                  type="button"
                  onClick={() => setModoVista("grid")}
                  className="cursor-pointer text-pequeno font-semibold text-primary hover:underline"
                >
                  Ver todos
                </button>
              </div>

              {siguientesCercanos.length === 0 ? (
                <Card className="rounded-sm bg-canvas p-4">
                  <p className="text-pequeno text-text-secondary">
                    Esta es la última tarjeta disponible con tus filtros actuales.
                  </p>
                </Card>
              ) : (
                <div className="flex flex-col gap-3">
                  {siguientesCercanos.map(({ inm, minutos }) => (
                    <ListingGridCard
                      key={inm.id}
                      inmueble={inm}
                      minutosUniversidad={minutos}
                      siglasUniversidad={siglasRef}
                      compactHorizontal
                      onMeInteresa={() => ejecutarSwipe(inm.id, "me_interesa")}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <MatchModal
        match={matchActivo}
        usuarioIniciales={usuarioIniciales}
        onClose={() => setMatchActivo(null)}
      />
    </div>
  );
}
