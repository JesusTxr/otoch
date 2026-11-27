"use client";

import * as React from "react";
import { Heart, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeActionsProps {
  onDescartar: () => void;
  onMeInteresa: () => void;
  onSuper?: () => void;
  disabled?: boolean;
  enableKeyboardShortcuts?: boolean;
  superLabel?: string;
  className?: string;
}

export function SwipeActions({
  onDescartar,
  onMeInteresa,
  onSuper,
  disabled = false,
  enableKeyboardShortcuts = true,
  superLabel = "Ver detalle o destacar",
  className,
}: SwipeActionsProps) {
  React.useEffect(() => {
    if (!enableKeyboardShortcuts || disabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onDescartar();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onMeInteresa();
      } else if (e.key === "ArrowUp" && onSuper) {
        e.preventDefault();
        onSuper();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled, enableKeyboardShortcuts, onDescartar, onMeInteresa, onSuper]);

  return (
    <div className={cn("flex flex-col items-center gap-2.5", className)}>
      <div className="flex items-center justify-center gap-6">
        <button
          type="button"
          aria-label="Descartar"
          disabled={disabled}
          onClick={onDescartar}
          className="inline-flex size-16 cursor-pointer items-center justify-center rounded-pill border border-border bg-surface text-danger shadow-action transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-7 stroke-[2.2]" aria-hidden="true" />
        </button>

        {onSuper && (
          <button
            type="button"
            aria-label={superLabel}
            disabled={disabled}
            onClick={onSuper}
            className="inline-flex size-[52px] cursor-pointer items-center justify-center rounded-pill border border-border bg-surface text-oro shadow-action transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Star className="size-[22px] stroke-[2.2]" aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          aria-label="Me interesa"
          disabled={disabled}
          onClick={onMeInteresa}
          className="inline-flex size-16 cursor-pointer items-center justify-center rounded-pill border border-border bg-surface text-verde shadow-action transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Heart className="size-7 stroke-[2.2]" aria-hidden="true" />
        </button>
      </div>

      {enableKeyboardShortcuts && (
        <p className="hidden text-etiqueta text-text-secondary lg:block">
          Atajos: ← descartar · → me interesa{onSuper ? " · ↑ detalle" : ""}
        </p>
      )}
    </div>
  );
}
