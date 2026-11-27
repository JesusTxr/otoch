import { cn } from "@/lib/utils";

type AvatarSize = 30 | 34 | 36 | 40 | 44 | 96 | 112 | 128;
type AvatarTone = "primary" | "verde" | "sunken";

interface OtochAvatarProps {
  iniciales: string;
  nombre?: string;
  fotoUrl?: string | null;
  size?: AvatarSize;
  tone?: AvatarTone;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  30: "size-[30px] text-etiqueta",
  34: "size-[34px] text-etiqueta",
  36: "size-[36px] text-etiqueta font-semibold",
  40: "size-[40px] text-pequeno font-semibold",
  44: "size-[44px] text-pequeno font-semibold",
  96: "size-[96px] text-display",
  112: "size-[112px] text-titulo-web",
  128: "size-[128px] text-display-web",
};

const toneClasses: Record<AvatarTone, string> = {
  primary: "bg-primary-soft text-primary-strong",
  verde: "bg-verde-soft text-verde",
  sunken: "bg-sunken text-foreground",
};

export function obtenerIniciales(nombre: string, apellidos?: string): string {
  const limpioNombre = nombre.trim();
  const limpioApellidos = (apellidos ?? "").trim();
  if (limpioNombre && limpioApellidos) {
    return `${limpioNombre[0]}${limpioApellidos[0]}`.toUpperCase();
  }
  const partes = limpioNombre.split(/\s+/).filter(Boolean);
  if (partes.length >= 2) {
    return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
  }
  return (limpioNombre.slice(0, 2) || "OT").toUpperCase();
}

export function OtochAvatar({
  iniciales,
  nombre,
  fotoUrl,
  size = 40,
  tone = "primary",
  className,
}: OtochAvatarProps) {
  return (
    <span
      role="img"
      aria-label={nombre ? `Avatar de ${nombre}` : `Avatar ${iniciales}`}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-pill",
        sizeClasses[size],
        toneClasses[tone],
        className
      )}
    >
      {fotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fotoUrl}
          alt={nombre ?? iniciales}
          className="size-full object-cover"
        />
      ) : (
        <span>{iniciales}</span>
      )}
    </span>
  );
}
