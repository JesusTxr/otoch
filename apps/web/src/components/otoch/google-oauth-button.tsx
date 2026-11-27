"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface GoogleOAuthButtonProps {
  nextPath?: string;
  label?: string;
  onError?: (msg: string) => void;
}

export function GoogleOAuthButton({
  nextPath = "/explorar",
  label = "Continuar con Google",
  onError,
}: GoogleOAuthButtonProps) {
  const [cargando, setCargando] = React.useState(false);

  async function handleGoogleLogin() {
    setCargando(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) {
        onError?.(
          "No se pudo iniciar sesión con Google. Verifica que el proveedor OAuth esté activo en Supabase."
        );
        setCargando(false);
      }
    } catch {
      onError?.("Ocurrió un error al conectar con Google OAuth.");
      setCargando(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={cargando}
      onClick={handleGoogleLogin}
    >
      <svg
        className="size-5"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path
          fill="currentColor"
          d="M21.35 11.1h-9.18v2.98h5.27c-.23 1.32-.98 2.44-2.09 3.18v2.64h3.38c1.98-1.82 3.12-4.51 3.12-7.7 0-.37-.03-.74-.1-1.1Z"
        />
        <path
          fill="currentColor"
          opacity="0.8"
          d="M12.17 21c2.83 0 5.21-.93 6.95-2.53l-3.38-2.64c-.94.63-2.14 1.01-3.57 1.01-2.74 0-5.06-1.85-5.89-4.34H2.79v2.72A10.48 10.48 0 0 0 12.17 21Z"
        />
        <path
          fill="currentColor"
          opacity="0.6"
          d="M6.28 12.5a6.3 6.3 0 0 1 0-4v-2.72H2.79a10.5 10.5 0 0 0 0 9.44l3.49-2.72Z"
        />
        <path
          fill="currentColor"
          opacity="0.9"
          d="M12.17 6.16c1.54 0 2.92.53 4.01 1.57l3-3C17.37 3.04 15 2 12.17 2A10.48 10.48 0 0 0 2.79 5.78l3.49 2.72c.83-2.49 3.15-4.34 5.89-4.34Z"
        />
      </svg>
      {cargando ? "Conectando con Google…" : label}
    </Button>
  );
}
