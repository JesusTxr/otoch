import type { TipoInmueble } from "@/types/database";

function crearSvgPlaceholder(
  titulo: string,
  subtitulo: string,
  colorPrimario: string,
  colorAcento: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="720" viewBox="0 0 960 720">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${colorPrimario}"/>
        <stop offset="100%" stop-color="${colorAcento}"/>
      </linearGradient>
    </defs>
    <rect width="960" height="720" fill="url(#g)"/>
    <rect x="110" y="150" width="740" height="450" rx="28" fill="#FBF6F0" fill-opacity="0.16" stroke="#FBF6F0" stroke-opacity="0.5" stroke-width="4"/>
    <rect x="180" y="230" width="220" height="250" rx="14" fill="#1F1A17" fill-opacity="0.22" stroke="#FBF6F0" stroke-opacity="0.65" stroke-width="3"/>
    <path d="M480 600 V330 A95 95 0 0 1 670 330 V600 Z" fill="#1F1A17" fill-opacity="0.28" stroke="#FBF6F0" stroke-opacity="0.7" stroke-width="3"/>
    <circle cx="770" cy="120" r="46" fill="#FBF6F0" fill-opacity="0.22"/>
    <text x="140" y="545" font-family="sans-serif" font-size="30" font-weight="700" fill="#FFFFFF">${titulo}</text>
    <text x="140" y="582" font-family="sans-serif" font-size="20" fill="#FBF6F0" fill-opacity="0.9">${subtitulo}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const FALLBACKS_POR_TIPO: Record<TipoInmueble, string[]> = {
  casa: [
    crearSvgPlaceholder(
      "Fachada colonial en Mérida",
      "Casa verificada · Otoch",
      "#D9532C",
      "#E8A93B"
    ),
    crearSvgPlaceholder(
      "Recámara iluminada y ventilada",
      "Espacio listo para estudiantes",
      "#B8401D",
      "#D9532C"
    ),
    crearSvgPlaceholder(
      "Patio interior y área común",
      "Ideal para compartir entre roomies",
      "#2F7D5B",
      "#D9532C"
    ),
  ],
  departamento: [
    crearSvgPlaceholder(
      "Departamento estudiantil",
      "Cerca de rutas universitarias · Mérida",
      "#2F7D5B",
      "#E8A93B"
    ),
    crearSvgPlaceholder(
      "Estancia y cocina equipada",
      "Servicios listos para mudarse",
      "#D9532C",
      "#2F7D5B"
    ),
  ],
  cuarto: [
    crearSvgPlaceholder(
      "Cuarto independiente verificado",
      "Ambiente tranquilo de estudio · Mérida",
      "#B8401D",
      "#E8A93B"
    ),
    crearSvgPlaceholder(
      "Área de escritorio y descanso",
      "Otoch · Vivienda estudiantil",
      "#2F7D5B",
      "#B8401D"
    ),
  ],
};

export function resolverUrlFotoInmueble(
  rutaStorage: string,
  supabaseUrl?: string
): string {
  if (
    rutaStorage.startsWith("http://") ||
    rutaStorage.startsWith("https://") ||
    rutaStorage.startsWith("data:image/")
  ) {
    return rutaStorage;
  }
  const base =
    supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!base) {
    return FALLBACKS_POR_TIPO.casa[0];
  }
  const limpia = rutaStorage.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/inmuebles/${limpia}`;
}

export function obtenerGaleriaInmueble(
  rutasStorage: string[],
  tipo: TipoInmueble,
  supabaseUrl?: string
): string[] {
  if (rutasStorage.length > 0) {
    return rutasStorage.map((r) => resolverUrlFotoInmueble(r, supabaseUrl));
  }
  return FALLBACKS_POR_TIPO[tipo] ?? FALLBACKS_POR_TIPO.casa;
}

export const SERVICIOS_CATALOGO = [
  "Agua",
  "Luz",
  "Gas",
  "Internet",
  "Aire acondicionado",
  "Lavadora",
  "Cocina equipada",
  "Acepta mascotas",
  "Baño propio",
  "Estacionamiento",
] as const;

export function formatearMXN(monto: number): string {
  return `$${Math.round(monto).toLocaleString("en-US")}`;
}
