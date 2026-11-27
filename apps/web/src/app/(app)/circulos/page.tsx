import Link from "next/link";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function CirculosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-titulo-web text-foreground">Círculos</h1>
        <p className="mt-1 text-pequeno text-text-secondary">
          Grupos con roomies y arrendador para acordar renta en partes iguales
        </p>
      </div>

      <Card className="items-start gap-4 rounded-xl p-8">
        <div className="flex size-12 items-center justify-center rounded-sm bg-primary-soft text-primary-strong">
          <MessageCircle className="size-6" aria-hidden="true" />
        </div>
        <h2 className="text-titulo-1 text-foreground">
          Aún no tienes círculos activos
        </h2>
        <p className="max-w-[560px] text-cuerpo text-text-secondary">
          Cuando hagas match con otros estudiantes y un inmueble verificado, aquí
          podrán platicar en tiempo real y dividir la renta en partes iguales.
        </p>
        <Button asChild>
          <Link href="/explorar">Explorar inmuebles</Link>
        </Button>
      </Card>

      <div className="flex items-center gap-2 rounded-sm bg-verde-soft px-4 py-3 text-pequeno font-semibold text-verde">
        <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
        Nunca deposites antes de firmar el contrato dentro de Otoch.
      </div>
    </div>
  );
}
