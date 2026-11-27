import Link from "next/link";
import { House } from "lucide-react";
import { cn } from "@/lib/utils";

interface OtochLogoProps {
  href?: string;
  invertedWordmark?: boolean;
  className?: string;
}

export function OtochLogo({
  href = "/",
  invertedWordmark = false,
  className,
}: OtochLogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-3 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-[10px] bg-primary text-primary-foreground shadow-subtle">
        <House className="size-5 stroke-[2.2]" aria-hidden="true" />
      </span>
      <span
        className={cn(
          "text-titulo-1 tracking-[-0.5px]",
          invertedWordmark ? "text-primary-foreground" : "text-foreground"
        )}
      >
        otoch
      </span>
    </Link>
  );
}
