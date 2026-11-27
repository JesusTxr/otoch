import { cn } from "@/lib/utils";

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-sm bg-sunken", className)}
    />
  );
}

export function ExplorarSkeleton() {
  return (
    <div role="status" aria-label="Cargando inmuebles" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <SkeletonBlock className="h-9 w-40 rounded-xs" />
          <SkeletonBlock className="h-4 w-64 rounded-pill" />
        </div>
        <SkeletonBlock className="h-11 w-72 rounded-pill" />
      </div>

      <div className="flex gap-2.5 overflow-hidden">
        <SkeletonBlock className="h-9 w-20 rounded-pill" />
        <SkeletonBlock className="h-9 w-40 rounded-pill" />
        <SkeletonBlock className="h-9 w-36 rounded-pill" />
        <SkeletonBlock className="h-9 w-28 rounded-pill" />
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,500px)_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-6">
          <SkeletonBlock className="h-[500px] w-full max-w-[500px] rounded-xl" />
          <div className="flex items-center gap-6">
            <SkeletonBlock className="size-16 rounded-pill" />
            <SkeletonBlock className="size-[52px] rounded-pill" />
            <SkeletonBlock className="size-16 rounded-pill" />
          </div>
        </div>

        <div className="hidden flex-col gap-5 lg:flex">
          <SkeletonBlock className="h-[300px] w-full rounded-md" />
          <SkeletonBlock className="h-24 w-full rounded-sm" />
          <SkeletonBlock className="h-24 w-full rounded-sm" />
        </div>
      </div>
    </div>
  );
}

export function RoomiesSkeleton() {
  return (
    <div role="status" aria-label="Cargando roomies compatibles" className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <SkeletonBlock className="h-9 w-36 rounded-xs" />
          <SkeletonBlock className="h-4 w-56 rounded-pill" />
        </div>
        <SkeletonBlock className="h-10 w-44 rounded-pill" />
      </div>

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,680px)_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-6">
          <SkeletonBlock className="h-[440px] w-full max-w-[680px] rounded-xl" />
          <div className="flex items-center gap-6">
            <SkeletonBlock className="size-16 rounded-pill" />
            <SkeletonBlock className="size-16 rounded-pill" />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <SkeletonBlock className="h-64 w-full rounded-lg" />
          <SkeletonBlock className="h-44 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function CirculosBandejaSkeleton() {
  return (
    <div role="status" aria-label="Cargando círculos" className="grid gap-6 lg:grid-cols-[310px_minmax(0,1fr)]">
      <SkeletonBlock className="h-[560px] w-full rounded-lg" />
      <div className="flex flex-col gap-5">
        <SkeletonBlock className="h-10 w-64 rounded-xs" />
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonBlock className="h-52 w-full rounded-lg" />
          <SkeletonBlock className="h-52 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function CirculoChatSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando chat del círculo"
      className="grid gap-4 xl:grid-cols-[270px_minmax(0,1fr)_310px]"
    >
      <SkeletonBlock className="hidden h-[640px] rounded-lg xl:block" />
      <SkeletonBlock className="h-[640px] rounded-lg" />
      <SkeletonBlock className="hidden h-[640px] rounded-lg xl:block" />
    </div>
  );
}

export function PerfilSkeleton() {
  return (
    <div role="status" aria-label="Cargando perfil" className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-9 w-36 rounded-xs" />
        <SkeletonBlock className="h-11 w-40 rounded-btn" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <SkeletonBlock className="h-[420px] rounded-lg" />
        <div className="flex flex-col gap-6">
          <SkeletonBlock className="h-36 rounded-lg" />
          <div className="grid gap-6 xl:grid-cols-2">
            <SkeletonBlock className="h-56 rounded-lg" />
            <SkeletonBlock className="h-56 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
