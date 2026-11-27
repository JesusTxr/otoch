import { Bus, ExternalLink, MapPin } from "lucide-react";
import { desplazarCoordenadasPrivacidad } from "@/lib/geo";
import { cn } from "@/lib/utils";
import type { Coordenadas } from "@/types/database";

interface ApproximateMapProps {
  coordenadas: Coordenadas;
  semillaPrivacidad: string;
  colonia: string;
  leyendaRuta?: string;
  alturaClase?: string;
  className?: string;
}

export function ApproximateMap({
  coordenadas,
  semillaPrivacidad,
  colonia,
  leyendaRuta,
  alturaClase = "h-[300px]",
  className,
}: ApproximateMapProps) {
  const approx = desplazarCoordenadasPrivacidad(coordenadas, semillaPrivacidad);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();

  const delta = 0.0085;
  const bbox = `${(approx.lng - delta).toFixed(5)}%2C${(approx.lat - delta).toFixed(5)}%2C${(approx.lng + delta).toFixed(5)}%2C${(approx.lat + delta).toFixed(5)}`;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${approx.lat.toFixed(5)}%2C${approx.lng.toFixed(5)}`;
  const osmFullUrl = `https://www.openstreetmap.org/?mlat=${approx.lat.toFixed(5)}&mlon=${approx.lng.toFixed(5)}#map=15/${approx.lat.toFixed(5)}/${approx.lng.toFixed(5)}`;

  const mapboxStaticUrl = mapboxToken
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l+D9532C(${approx.lng.toFixed(5)},${approx.lat.toFixed(5)})/${approx.lng.toFixed(5)},${approx.lat.toFixed(5)},14.3,0/800x480@2x?access_token=${mapboxToken}`
    : null;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-md border border-border bg-sunken",
        alturaClase,
        className
      )}
    >
      {mapboxStaticUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mapboxStaticUrl}
          alt={`Ubicación aproximada en ${colonia}, Mérida`}
          className="size-full object-cover"
        />
      ) : (
        <iframe
          title={`Mapa aproximado de ${colonia}, Mérida`}
          src={osmEmbedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="size-full border-0"
        />
      )}

      <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface/95 px-3 py-1.5 text-etiqueta font-semibold text-foreground shadow-subtle">
          <MapPin className="size-3.5 text-primary" aria-hidden="true" />
          Zona aproximada · {colonia}
        </span>

        <a
          href={osmFullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto inline-flex items-center gap-1 rounded-pill bg-surface/95 px-2.5 py-1 text-etiqueta font-semibold text-primary shadow-subtle hover:underline"
        >
          Mapa
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      </div>

      {leyendaRuta && (
        <div className="pointer-events-none absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface/95 px-3.5 py-1.5 text-etiqueta font-semibold text-foreground shadow-card">
            <Bus className="size-3.5 text-verde" aria-hidden="true" />
            {leyendaRuta}
          </span>
        </div>
      )}
    </div>
  );
}
