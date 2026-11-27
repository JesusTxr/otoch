import type { Coordenadas } from "@/types/database";

export interface ZonaMerida {
  colonia: string;
  lat: number;
  lng: number;
  referencia: string;
}

export const COLONIAS_MERIDA: ZonaMerida[] = [
  {
    colonia: "García Ginerés",
    lat: 20.9852,
    lng: -89.6368,
    referencia: "Poniente céntrico · Parque de las Américas",
  },
  {
    colonia: "Centro",
    lat: 20.9674,
    lng: -89.6237,
    referencia: "Centro Histórico · Rutas directas a campus",
  },
  {
    colonia: "Santa Rosa",
    lat: 20.9408,
    lng: -89.6175,
    referencia: "Sur · A minutos caminando de la UTM",
  },
  {
    colonia: "Itzimná",
    lat: 20.9924,
    lng: -89.6122,
    referencia: "Norte tradicional · Cercana a Av. Tecnológico",
  },
  {
    colonia: "Chuburná de Hidalgo",
    lat: 21.0085,
    lng: -89.6325,
    referencia: "Norte · Muy cerca del ITM",
  },
  {
    colonia: "Francisco de Montejo",
    lat: 21.0315,
    lng: -89.6472,
    referencia: "Norponiente ·erca de Campus Ingenierías UADY",
  },
  {
    colonia: "Cordemex",
    lat: 21.0342,
    lng: -89.6278,
    referencia: "Norte · Zona comercial y universitaria",
  },
  {
    colonia: "Chenkú",
    lat: 20.9958,
    lng: -89.6512,
    referencia: "Poniente · Cercana a Campus Poniente ITM",
  },
  {
    colonia: "Montes de Amé",
    lat: 21.0282,
    lng: -89.6048,
    referencia: "Norte · Bien conectada por transporte",
  },
  {
    colonia: "Cholul",
    lat: 21.0412,
    lng: -89.5582,
    referencia: "Nororiente · Cercana a Campus Sociales UADY",
  },
  {
    colonia: "Las Américas",
    lat: 21.0615,
    lng: -89.6548,
    referencia: "Norte · Fraccionamiento estudiantil amplio",
  },
  {
    colonia: "Juan Pablo II",
    lat: 20.9802,
    lng: -89.6712,
    referencia: "Poniente · Rutas hacia UTM y Centro",
  },
];

export const COORDENADAS_MERIDA_CENTRO: Coordenadas = {
  lat: 20.9674,
  lng: -89.6237,
};

export function formatearPuntoPostGIS(lng: number, lat: number): string {
  return `SRID=4326;POINT(${lng.toFixed(6)} ${lat.toFixed(6)})`;
}

function leerDoubleHex(hex16: string, littleEndian: boolean): number {
  const bytes = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    bytes[i] = Number.parseInt(hex16.slice(i * 2, i * 2 + 2), 16);
  }
  const view = new DataView(bytes.buffer);
  return view.getFloat64(0, littleEndian);
}

/**
 * Decodifica un punto PostGIS devuelto por Supabase (EWKB hex, GeoJSON o WKT).
 */
export function parsearPuntoPostGIS(
  valor: unknown,
  coloniaFallback?: string
): Coordenadas {
  if (valor && typeof valor === "object") {
    const obj = valor as {
      type?: string;
      coordinates?: [number, number];
      lat?: number;
      lng?: number;
    };
    if (
      Array.isArray(obj.coordinates) &&
      obj.coordinates.length >= 2 &&
      Number.isFinite(obj.coordinates[0]) &&
      Number.isFinite(obj.coordinates[1])
    ) {
      return { lng: obj.coordinates[0], lat: obj.coordinates[1] };
    }
    if (typeof obj.lat === "number" && typeof obj.lng === "number") {
      return { lat: obj.lat, lng: obj.lng };
    }
  }

  if (typeof valor === "string") {
    const limpio = valor.trim();
    const wktMatch = /POINT\s*\(\s*([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s*\)/i.exec(
      limpio
    );
    if (wktMatch) {
      const lng = Number(wktMatch[1]);
      const lat = Number(wktMatch[2]);
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        return { lng, lat };
      }
    }

    // EWKB hexadecimal de PostGIS: byteOrder(2) + type(8) + [srid(8)] + X(16) + Y(16)
    if (/^[0-9a-fA-F]{42,}$/.test(limpio)) {
      const littleEndian = limpio.slice(0, 2) === "01";
      const typeHex = limpio.slice(2, 10);
      const typeBytes = new Uint8Array(4);
      for (let i = 0; i < 4; i++) {
        typeBytes[i] = Number.parseInt(typeHex.slice(i * 2, i * 2 + 2), 16);
      }
      const typeInt = new DataView(typeBytes.buffer).getUint32(0, littleEndian);
      const hasSrid = (typeInt & 0x20000000) !== 0;
      const coordOffset = 10 + (hasSrid ? 8 : 0);
      if (limpio.length >= coordOffset + 32) {
        const lng = leerDoubleHex(
          limpio.slice(coordOffset, coordOffset + 16),
          littleEndian
        );
        const lat = leerDoubleHex(
          limpio.slice(coordOffset + 16, coordOffset + 32),
          littleEndian
        );
        if (
          Number.isFinite(lng) &&
          Number.isFinite(lat) &&
          Math.abs(lat) <= 90 &&
          Math.abs(lng) <= 180 &&
          (lat !== 0 || lng !== 0)
        ) {
          return { lng, lat };
        }
      }
    }
  }

  if (coloniaFallback) {
    const encontrada = COLONIAS_MERIDA.find(
      (z) => z.colonia.toLowerCase() === coloniaFallback.trim().toLowerCase()
    );
    if (encontrada) {
      return { lat: encontrada.lat, lng: encontrada.lng };
    }
  }

  return COORDENADAS_MERIDA_CENTRO;
}

export function calcularDistanciaKm(a: Coordenadas, b: Coordenadas): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.round(R * c * 10) / 10;
}

/**
 * Estima minutos de traslado urbano en Mérida a partir de distancia en línea recta.
 */
export function estimarMinutosTraslado(distanciaKm: number): number {
  const minutos = Math.round(distanciaKm * 3.2 + 5);
  return Math.max(5, Math.min(65, minutos));
}

/**
 * Desplaza ligeramente coordenadas (~180m determinista) para privacidad en mapas públicos.
 */
export function desplazarCoordenadasPrivacidad(
  coords: Coordenadas,
  semilla: string
): Coordenadas {
  let hash = 0;
  for (let i = 0; i < semilla.length; i++) {
    hash = (hash * 31 + semilla.charCodeAt(i)) | 0;
  }
  const dLat = (((hash & 0xff) / 255) - 0.5) * 0.0024;
  const dLng = ((((hash >> 8) & 0xff) / 255) - 0.5) * 0.0024;
  return {
    lat: Number((coords.lat + dLat).toFixed(5)),
    lng: Number((coords.lng + dLng).toFixed(5)),
  };
}
