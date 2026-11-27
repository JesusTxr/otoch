export default function LoadingAdmin() {
  return (
    <div
      role="status"
      aria-label="Cargando panel de moderación"
      className="flex animate-pulse flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <div className="h-9 w-64 rounded-sm bg-sunken" />
        <div className="h-4 w-96 max-w-full rounded-pill bg-sunken" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-md border border-border bg-surface p-5"
          />
        ))}
      </div>

      <div className="h-12 w-full max-w-md rounded-pill bg-sunken" />

      <div className="flex flex-col gap-4 rounded-md border border-border bg-surface p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-sm bg-sunken/70" />
        ))}
      </div>
    </div>
  );
}
