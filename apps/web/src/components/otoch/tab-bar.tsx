"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  MessageCircle,
  Plus,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RolUsuario } from "@/types/database";

interface TabBarProps {
  circulosActivos?: number;
  rol?: RolUsuario | null;
}

export function TabBar({ circulosActivos = 0, rol }: TabBarProps) {
  const pathname = usePathname();

  const tabItems =
    rol === "arrendador"
      ? [
          { href: "/explorar", label: "Explorar", icon: House },
          { href: "/mis-inmuebles", label: "Inmuebles", icon: Plus },
          { href: "/circulos", label: "Círculos", icon: MessageCircle },
          { href: "/perfil", label: "Perfil", icon: User },
        ]
      : rol === "administrador"
        ? [
            { href: "/explorar", label: "Explorar", icon: House },
            { href: "/circulos", label: "Círculos", icon: MessageCircle },
            { href: "/admin", label: "Admin", icon: ShieldCheck },
            { href: "/perfil", label: "Perfil", icon: User },
          ]
        : [
            { href: "/explorar", label: "Explorar", icon: House },
            { href: "/roomies", label: "Roomies", icon: Users },
            { href: "/circulos", label: "Círculos", icon: MessageCircle },
            { href: "/perfil", label: "Perfil", icon: User },
          ];

  return (
    <nav
      aria-label="Navegación inferior móvil"
      className="fixed inset-x-0 bottom-0 z-40 flex h-[84px] items-center justify-around border-t border-border bg-surface px-2 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {tabItems.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const showCount = item.href === "/circulos" && circulosActivos > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-w-[68px] flex-col items-center justify-center gap-1 rounded-xs py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "text-primary" : "text-text-secondary"
            )}
          >
            <span className="relative">
              <Icon className="size-6 stroke-[2]" aria-hidden="true" />
              {showCount && (
                <span className="absolute -right-2.5 -top-1.5 inline-flex min-w-[18px] items-center justify-center rounded-pill bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground">
                  {circulosActivos}
                </span>
              )}
            </span>
            <span
              className={cn(
                active
                  ? "text-pequeno font-semibold text-primary"
                  : "text-etiqueta text-text-secondary"
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
