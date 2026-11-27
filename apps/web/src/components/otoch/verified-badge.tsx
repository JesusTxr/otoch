import { Clock, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EstadoVerificacion } from "@/types/database";

interface VerifiedBadgeProps {
  estado?: EstadoVerificacion;
  label?: string;
  className?: string;
}

export function VerifiedBadge({
  estado = "verificado",
  label,
  className,
}: VerifiedBadgeProps) {
  if (estado === "pendiente") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-pill bg-sunken py-1 pl-2 pr-2.5 text-etiqueta text-foreground",
          className
        )}
      >
        <Clock className="size-3.5 text-oro" aria-hidden="true" />
        {label ?? "Verificación pendiente"}
      </span>
    );
  }

  if (estado === "rechazado") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-pill bg-primary-soft py-1 pl-2 pr-2.5 text-etiqueta text-danger",
          className
        )}
      >
        <X className="size-3.5 text-danger" aria-hidden="true" />
        {label ?? "Verificación rechazada"}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill bg-verde-soft py-1 pl-2 pr-2.5 text-etiqueta text-verde",
        className
      )}
    >
      <ShieldCheck className="size-3.5 text-verde" aria-hidden="true" />
      {label ?? "Verificado"}
    </span>
  );
}
