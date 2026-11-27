import { SkeletonBlock } from "@/components/otoch/skeletons";

export default function MisInmueblesLoading() {
  return (
    <div role="status" aria-label="Cargando tus inmuebles" className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-9 w-48 rounded-xs" />
        <SkeletonBlock className="h-11 w-44 rounded-btn" />
      </div>
      <SkeletonBlock className="h-11 w-72 rounded-pill" />
      <div className="grid gap-5 md:grid-cols-2">
        <SkeletonBlock className="h-72 rounded-lg" />
        <SkeletonBlock className="h-72 rounded-lg" />
      </div>
    </div>
  );
}
