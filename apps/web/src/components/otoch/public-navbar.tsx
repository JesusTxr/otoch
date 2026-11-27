"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, User } from "lucide-react";
import { cerrarSesionAction } from "@/app/actions/auth";
import { OtochAvatar } from "@/components/otoch/avatar";
import { OtochLogo } from "@/components/otoch/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UsuarioSesionResumen } from "@/types/database";

const APP_LINKS = [
  { href: "/explorar", label: "Explorar" },
  { href: "/roomies", label: "Roomies" },
  { href: "/circulos", label: "Círculos" },
  { href: "/perfil", label: "Perfil" },
] as const;

interface PublicNavbarProps {
  usuario: UsuarioSesionResumen | null;
  variant?: "landing" | "compact";
}

export function PublicNavbar({
  usuario,
  variant = "landing",
}: PublicNavbarProps) {
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <header className="w-full border-b border-border/60 bg-canvas/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 lg:px-20 lg:py-5">
        <OtochLogo href="/" />

        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-7 lg:flex"
        >
          {variant === "landing" && !usuario ? (
            <>
              <a
                href="#como-funciona"
                className="text-cuerpo font-semibold text-text-secondary transition-colors hover:text-foreground"
              >
                Cómo funciona
              </a>
              <a
                href="#arrendadores"
                className="text-cuerpo font-semibold text-text-secondary transition-colors hover:text-foreground"
              >
                Para arrendadores
              </a>
              <a
                href="#seguridad"
                className="text-cuerpo font-semibold text-text-secondary transition-colors hover:text-foreground"
              >
                Seguridad
              </a>
              <span className="h-4 w-px bg-border" aria-hidden="true" />
            </>
          ) : null}

          {APP_LINKS.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-cuerpo font-semibold transition-colors",
                  active
                    ? "text-primary"
                    : "text-text-secondary hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5">
          {usuario ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                aria-expanded={menuAbierto}
                aria-haspopup="menu"
                onClick={() => setMenuAbierto((prev) => !prev)}
                className="inline-flex cursor-pointer items-center gap-2.5 rounded-pill border border-border bg-surface py-1.5 pl-1.5 pr-3 transition-colors hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <OtochAvatar
                  iniciales={usuario.iniciales}
                  nombre={usuario.nombreCompleto}
                  size={34}
                />
                <span className="hidden max-w-[140px] truncate text-pequeno font-semibold text-foreground sm:inline">
                  {usuario.nombreCompleto}
                </span>
                <ChevronDown
                  className="size-4 text-text-secondary"
                  aria-hidden="true"
                />
              </button>

              {menuAbierto && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-60 rounded-sm border border-border bg-surface p-2 shadow-card z-50"
                >
                  <div className="border-b border-border px-3 py-2">
                    <p className="truncate text-pequeno font-semibold text-foreground">
                      {usuario.nombreCompleto}
                    </p>
                    <p className="truncate text-etiqueta text-text-secondary">
                      {usuario.email}
                    </p>
                  </div>

                  <Link
                    href={usuario.rol ? "/perfil" : "/onboarding"}
                    role="menuitem"
                    onClick={() => setMenuAbierto(false)}
                    className="mt-1 flex items-center gap-2.5 rounded-xs px-3 py-2 text-pequeno font-semibold text-foreground transition-colors hover:bg-sunken"
                  >
                    <User className="size-4 text-primary" aria-hidden="true" />
                    {usuario.rol ? "Mi perfil" : "Completar onboarding"}
                  </Link>

                  <form action={cerrarSesionAction} className="mt-1">
                    <button
                      type="submit"
                      role="menuitem"
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-xs px-3 py-2 text-left text-pequeno font-semibold text-danger transition-colors hover:bg-primary-soft/60"
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                      Cerrar sesión
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button
                size="sm"
                className="hidden sm:inline-flex"
                asChild
              >
                <Link href="/registro">Registrarse</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
