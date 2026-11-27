import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function RoomiesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-titulo-web text-foreground">Roomies</h1>
        <p className="mt-1 text-pequeno text-text-secondary">
          Estudiantes compatibles según tu cuestionario de convivencia
        </p>
      </div>

      <Card className="items-start gap-4 rounded-xl p-8">
        <div className="flex size-12 items-center justify-center rounded-sm bg-verde-soft text-verde">
          <Users className="size-6" aria-hidden="true" />
        </div>
        <h2 className="text-titulo-1 text-foreground">
          Próximamente: swipe de roomies compatibles
        </h2>
        <p className="max-w-[560px] text-cuerpo text-text-secondary">
          Tus hábitos de sueño, orden, ruido y presupuesto ya están guardados en
          tu perfil para calcular el porcentaje de compatibilidad con otros
          estudiantes de Mérida.
        </p>
        <Button variant="outline" asChild>
          <Link href="/perfil">Revisar mis hábitos de convivencia</Link>
        </Button>
      </Card>
    </div>
  );
}
