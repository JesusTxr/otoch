import * as React from "react";
import { cn } from "@/lib/utils";

interface FilterChipProps
  extends Omit<React.ComponentProps<"button">, "onChange"> {
  active?: boolean;
}

export function FilterChip({
  active = false,
  className,
  children,
  ...props
}: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-pill border px-3.5 py-2 text-pequeno font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-foreground bg-foreground text-surface"
          : "border-border bg-surface text-foreground hover:bg-sunken",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
