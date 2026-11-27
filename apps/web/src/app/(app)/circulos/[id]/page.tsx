import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AcuerdoPanel } from "@/components/otoch/acuerdo-panel";
import { CirculoChatRoom } from "@/components/otoch/circulo-chat-room";
import { CirculosSidebar } from "@/components/otoch/circulos-sidebar";
import {
  cargarBandejaCirculosYMatches,
  cargarDetalleCirculoActivo,
} from "@/lib/circulos-queries";
import { createClient } from "@/lib/supabase/server";
import { InvitacionPendienteCard } from "./invitacion-pendiente-card";

export const metadata: Metadata = {
  title: "Chat del círculo · Otoch",
};

interface CirculoDetallePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ acuerdo?: string }>;
}

export default async function CirculoDetallePage({
  params,
  searchParams,
}: CirculoDetallePageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/circulos/${id}`);
  }

  const [query, bandeja, detalle] = await Promise.all([
    searchParams,
    cargarBandejaCirculosYMatches(supabase, user.id),
    cargarDetalleCirculoActivo(supabase, user.id, id),
  ]);

  if (!detalle) {
    notFound();
  }

  const totalMatches =
    bandeja.matchesInmuebles.length + bandeja.matchesRoomies.length;
  const nombreVisible = detalle.circulo.nombre || detalle.inmueble.titulo;

  if (detalle.miEstado === "invitado") {
    return (
      <div className="py-6">
        <InvitacionPendienteCard
          circuloId={detalle.circulo.id}
          circuloNombre={nombreVisible}
          inmuebleTitulo={detalle.inmueble.titulo}
          inmuebleColonia={detalle.inmueble.colonia}
          rentaMensual={detalle.inmueble.renta_mensual}
          cupo={detalle.circulo.cupo}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 xl:grid xl:grid-cols-[270px_minmax(0,1fr)_310px] xl:items-start xl:gap-4">
      {/* Columna 1: Lista de círculos (visible en escritorio amplio W06) */}
      <CirculosSidebar
        circulos={bandeja.circulos}
        circuloActivoId={detalle.circulo.id}
        totalMatches={totalMatches}
        className="hidden xl:flex xl:h-[calc(100dvh-72px)]"
      />

      {/* En pantallas medianas/móvil (07-chat.png), el resumen de acuerdo va arriba del chat */}
      <div className="xl:hidden">
        <AcuerdoPanel
          circuloId={detalle.circulo.id}
          circuloNombre={nombreVisible}
          cupoMaximo={detalle.circulo.cupo}
          userId={user.id}
          miRol={detalle.miRol}
          inmueble={detalle.inmueble}
          integrantes={detalle.integrantes}
          acuerdoActual={detalle.acuerdoActual}
          aportaciones={detalle.aportaciones}
          matchesRoomiesDisponibles={bandeja.matchesRoomies}
          abrirEditorInicial={query.acuerdo === "1"}
        />
      </div>

      {/* Columna 2: Chat en tiempo real con Supabase Realtime */}
      <CirculoChatRoom
        circuloId={detalle.circulo.id}
        circuloNombre={nombreVisible}
        cupoMaximo={detalle.circulo.cupo}
        userId={user.id}
        inmueble={detalle.inmueble}
        integrantes={detalle.integrantes}
        mensajesIniciales={detalle.mensajesIniciales}
      />

      {/* Columna 3: Panel Acuerdo del círculo en escritorio W06 */}
      <AcuerdoPanel
        circuloId={detalle.circulo.id}
        circuloNombre={nombreVisible}
        cupoMaximo={detalle.circulo.cupo}
        userId={user.id}
        miRol={detalle.miRol}
        inmueble={detalle.inmueble}
        integrantes={detalle.integrantes}
        acuerdoActual={detalle.acuerdoActual}
        aportaciones={detalle.aportaciones}
        matchesRoomiesDisponibles={bandeja.matchesRoomies}
        abrirEditorInicial={query.acuerdo === "1"}
        className="hidden xl:flex xl:min-h-[calc(100dvh-72px)]"
      />
    </div>
  );
}
