"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Users, X } from "lucide-react";
import { responderInvitacionCirculoAction } from "@/app/actions/circulos";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatearMXN } from "@/lib/inmuebles-media";

interface InvitacionPendienteCardProps {
  circuloId: string;
  circuloNombre: string;
  inmuebleTitulo: string;
  inmuebleColonia: string;
  rentaMensual: number;
  cupo: number;
}

export function InvitacionPendienteCard({
  circuloId,
  circuloNombre,
  inmuebleTitulo,
  inmuebleColonia,
  rentaMensual,
  cupo,
}: InvitacionPendienteCardProps) {
  const router = useRouter();
  const [procesando, setProcesando] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  async function responder(aceptar: boolean) {
    setProcesando(true);
    setErrorMsg(null);
    const res = await responderInvitacionCirculoAction({ circuloId, aceptar });
    setProcesando(false);

    if (!res.ok) {
      setErrorMsg(res.error ?? "No se pudo procesar tu respuesta.");
      return;
    }

    if (aceptar) {
      router.refresh();
    } else {
      router.push("/circulos");
      router.refresh();
    }
  }

  return (
    <Card className="mx-auto max-w-[540px] items-start gap-4 rounded-xl p-8 shadow-card">
      <span className="flex size-12 items-center justify-center rounded-sm bg-primary-soft text-primary">
        <Users className="size-6" aria-hidden="true" />
      </span>

      <h1 className="text-titulo-1 text-foreground">
        Te invitaron al círculo «{circuloNombre}»
      </h1>

      <p className="text-cuerpo text-text-secondary">
        Inmueble asociado: <strong>{inmuebleTitulo}</strong> ({inmuebleColonia},
        Mérida) · Renta mensual total {formatearMXN(rentaMensual)} · Cupo máximo
        de {cupo} estudiantes.
      </p>

      <p className="text-pequeno text-text-secondary">
        Al aceptar podrás participar en el chat en tiempo real con tus roomies y
        el arrendador, ver la dirección acordada y sumarte al reparto en partes
        iguales.
      </p>

      {errorMsg && (
        <p role="alert" className="text-pequeno font-semibold text-danger">
          {errorMsg}
        </p>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={procesando}
          onClick={() => responder(false)}
        >
          <X className="size-4 text-danger" aria-hidden="true" />
          Rechazar invitación
        </Button>

        <Button
          type="button"
          disabled={procesando}
          onClick={() => responder(true)}
        >
          <Check className="size-4" aria-hidden="true" />
          {procesando ? "Uniéndote…" : "Aceptar invitación y abrir chat"}
        </Button>
      </div>
    </Card>
  );
}
