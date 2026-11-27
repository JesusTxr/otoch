"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  House,
  LogOut,
  MessageCircle,
  Plus,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { cerrarSesionAction } from "@/app/actions/auth";
import { OtochAvatar } from "@/components/otoch/avatar";
import { OtochLogo } from "@/components/otoch/logo";
import { NotificationBell } from "@/components/otoch/notification-bell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UsuarioSesionResumen } from "@/types/database";

interface SideNavProps {
  usuario: UsuarioSesionResumen | null;
}

export function SideNav({ usuario }: SideNavProps) {
  const pathname = usePathname();
  const esArrendador = usuario?.rol === "arrendador";
  const esAdmin = usuario?.rol === "administrador";

  const navItems = [
    { href: "/explorar", label: "Explorar", icon: House, badge: 0 },
    ...(esArrendador
      ? [{ href: "/mis-inmuebles", label: "Mis inmuebles", icon: Plus, badge: 0 }]
      : []),
    { href: "/roomies", label: "Roomies", icon: Users, badge: 0 },
    {
      href: "/circulos",
      label: "Círculos",
      icon: MessageCircle,
      badge: usuario?.circulosActivos ?? 0,
    },
    ...(usuario
      ? [
          {
            href: "/notificaciones",
            label: "Notificaciones",
            icon: Bell,
            badge: usuario.notificacionesNoLeidas ?? 0,
          },
        ]
      : []),
    ...(esAdmin
      ? [{ href: "/admin", label: "Moderación", icon: ShieldCheck, badge: 0 }]
      : []),
    { href: "/perfil", label: "Perfil", icon: User, badge: 0 },
  ];

  return (
    <aside
      aria-label="Navegación lateral"
      className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-[248px] lg:shrink-0 lg:flex-col lg:justify-between lg:border-r lg:border-border lg:bg-surface lg:px-4 lg:pb-6 lg:pt-7"
    >
      <div className="flex flex-col gap-7">
        <div className="flex items-center justify-between gap-2 px-2">
          <OtochLogo href="/" />
          {usuario && (
            <NotificationBell
              usuarioId={usuario.id}
              inicialNoLeidas={usuario.notificacionesNoLeidas}
              placement="sidebar"
            />
          )}
        </div>

        <nav aria-label="Secciones principales" className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-[46px] items-center justify-between rounded-xs px-3.5 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary-soft text-primary-strong"
                    : "text-text-secondary hover:bg-sunken/70 hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "size-[22px] stroke-[2]",
                      active ? "text-primary" : "text-text-secondary"
                    )}
                    aria-hidden="true"
                  />
                  <span
                    className={cn(
                      "text-cuerpo",
                      active ? "font-semibold text-primary-strong" : "font-normal"
                    )}
                  >
                    {item.label}
                  </span>
                </span>

                {item.badge > 0 && (
                  <span className="inline-flex min-w-[22px] items-center justify-center rounded-pill bg-primary px-2 py-0.5 text-etiqueta font-semibold text-primary-foreground">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-4">
        {!esAdmin && (
          <div className="flex flex-col gap-3 rounded-sm bg-canvas p-4">
            <div className="flex flex-col gap-1">
              <p className="text-pequeno font-semibold text-foreground">
                {esArrendador
                  ? "Publica una nueva propiedad"
                  : "¿Tienes un cuarto en renta?"}
              </p>
              <p className="text-etiqueta text-text-secondary">
                {esArrendador
                  ? "Recibe interesados verificados y haz match directo."
                  : "Publícalo gratis y recibe solo estudiantes verificados."}
              </p>
            </div>
            <Button variant="secondary" size="sm" className="w-full" asChild>
              <Link
                href={
                  esArrendador
                    ? "/mis-inmuebles/nuevo"
                    : usuario
                      ? "/perfil"
                      : "/registro?rol=arrendador"
                }
              >
                Publicar inmueble
              </Link>
            </Button>
          </div>
        )}

        {usuario ? (
          <div className="flex items-center justify-between gap-2 px-1">
            <Link
              href="/perfil"
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xs p-1 transition-colors hover:bg-sunken/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <OtochAvatar
                iniciales={usuario.iniciales}
                nombre={usuario.nombreCompleto}
                size={40}
              />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-pequeno font-semibold text-foreground">
                  {usuario.nombreCompleto}
                </span>
                <span
                  className={cn(
                    "truncate text-etiqueta",
                    usuario.verificado ? "text-verde" : "text-text-secondary"
                  )}
                >
                  {usuario.subtitulo}
                </span>
              </span>
            </Link>

            <form action={cerrarSesionAction}>
              <button
                type="submit"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="inline-flex size-9 cursor-pointer items-center justify-center rounded-pill text-text-secondary transition-colors hover:bg-sunken hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <LogOut className="size-4" aria-hidden="true" />
              </button>
            </form>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/login">Iniciar sesión / Registrarse</Link>
          </Button>
        )}
      </div>
    </aside>
  );
}
