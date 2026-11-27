import Link from "next/link";
import { LogOut } from "lucide-react";
import { cerrarSesionAction } from "@/app/actions/auth";
import { OtochAvatar } from "@/components/otoch/avatar";
import { OtochLogo } from "@/components/otoch/logo";
import { SideNav } from "@/components/otoch/side-nav";
import { TabBar } from "@/components/otoch/tab-bar";
import { obtenerResumenSesion } from "@/lib/supabase/session";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const usuario = await obtenerResumenSesion();

  return (
    <div className="min-h-dvh bg-canvas text-foreground lg:flex">
      <SideNav usuario={usuario} />

      <div className="flex min-w-0 flex-1 flex-col pb-[96px] lg:pb-0">
        {/* Barra superior compacta en móvil */}
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
          <OtochLogo href="/" />
          {usuario ? (
            <div className="flex items-center gap-2">
              <Link
                href="/perfil"
                className="inline-flex items-center gap-2 rounded-pill bg-canvas py-1 pl-1 pr-2.5"
              >
                <OtochAvatar
                  iniciales={usuario.iniciales}
                  nombre={usuario.nombreCompleto}
                  size={30}
                />
                <span className="max-w-[110px] truncate text-etiqueta font-semibold text-foreground">
                  {usuario.nombreCompleto}
                </span>
              </Link>
              <form action={cerrarSesionAction}>
                <button
                  type="submit"
                  aria-label="Cerrar sesión"
                  className="inline-flex size-8 items-center justify-center rounded-pill text-text-secondary hover:bg-sunken hover:text-danger"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-pequeno font-semibold text-primary"
            >
              Iniciar sesión
            </Link>
          )}
        </header>

        <main className="mx-auto w-full max-w-[1192px] flex-1 px-4 py-6 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>

      <TabBar
        circulosActivos={usuario?.circulosActivos ?? 0}
        rol={usuario?.rol}
      />
    </div>
  );
}
