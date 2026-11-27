import { SkeletonBlock } from "@/components/otoch/skeletons";

export default function DetalleInmuebleLoading() {
  return (
    <div role="status" aria-label="Cargando detalle de inmueble" className="flex flex-col gap-6">
      <SkeletonBlock className="h-5 w-56 rounded-pill" />
      <SkeletonBlock className="h-[340px] w-full rounded-md" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-5">
          <SkeletonBlock className="h-10 w-80 rounded-xs" />
          <SkeletonBlock className="h-24 w-full rounded-sm" />
          <SkeletonBlock className="h-56 w-full rounded-md" />
        </div>
        <SkeletonBlock className="h-[420px] w-full rounded-lg" />
      </div>
    </div>
  );
}
