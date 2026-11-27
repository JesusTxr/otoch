import type { Notificacion } from "@/types/database";

export function resolverDestinoNotificacion(notif: Notificacion): string {
  const datos = notif.datos ?? {};
  const hrefExplicito =
    typeof datos.href === "string" &&
    datos.href.startsWith("/") &&
    !datos.href.startsWith("//")
      ? datos.href
      : null;

  if (hrefExplicito) {
    return hrefExplicito;
  }

  const circuloId =
    typeof datos.circulo_id === "string" ? datos.circulo_id : null;
  const inmuebleId =
    typeof datos.inmueble_id === "string" ? datos.inmueble_id : null;

  switch (notif.tipo) {
    case "nuevo_match":
      return "/matches";
    case "mensaje":
      return circuloId ? `/circulos/${circuloId}` : "/circulos";
    case "acuerdo":
      return circuloId ? `/circulos/${circuloId}/acuerdo` : "/circulos";
    case "verificacion":
      return "/perfil";
    default:
      if (circuloId) return `/circulos/${circuloId}`;
      if (inmuebleId) return `/inmuebles/${inmuebleId}`;
      return "/explorar";
  }
}

export function formatearTiempoRelativoMX(isoDate: string): string {
  const fecha = new Date(isoDate);
  if (Number.isNaN(fecha.getTime())) {
    return "";
  }

  const ahoraMs = Date.now();
  const diffSeg = Math.max(0, Math.floor((ahoraMs - fecha.getTime()) / 1000));

  if (diffSeg < 60) return "Hace un momento";
  const diffMin = Math.floor(diffSeg / 60);
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `Hace ${diffHoras} h`;
  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias < 7) return `Hace ${diffDias} d`;

  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
  });
}

export function etiquetaCategoriaNotificacion(tipo: string): string {
  switch (tipo) {
    case "nuevo_match":
      return "Match";
    case "mensaje":
      return "Mensaje";
    case "acuerdo":
      return "Acuerdo";
    case "verificacion":
      return "Verificación";
    default:
      return "Aviso";
  }
}
