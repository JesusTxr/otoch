export default function LoadingNotificaciones() {
  return (
    <div
      role="status"
      aria-label="Cargando notificaciones"
      className="flex animate-pulse flex-col gap-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-9 w-56 rounded-sm bg-sunken" />
          <div className="h-4 w-72 rounded-pill bg-sunken" />
        </div>
        <div className="h-11 w-48 rounded-btn bg-sunken" />
      </div>

      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-24 rounded-pill bg-sunken" />
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <div className="size-10 shrink-0 rounded-pill bg-sunken" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-1/3 rounded-pill bg-sunken" />
              <div className="h-3.5 w-2/3 rounded-pill bg-sunken" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
