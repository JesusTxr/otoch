"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, ShieldCheck } from "lucide-react";
import { iniciarSesionAction, type AuthActionState } from "@/app/actions/auth";
import { GoogleOAuthButton } from "@/components/otoch/google-oauth-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loginSchema } from "@/lib/validations/auth";

const initialState: AuthActionState = {};

interface LoginFormProps {
  nextPath: string;
  initialError?: string;
}

export function LoginForm({ nextPath, initialError }: LoginFormProps) {
  const [state, formAction, isPending] = React.useActionState(
    iniciarSesionAction,
    initialState
  );
  const [clientErrors, setClientErrors] = React.useState<Record<string, string>>(
    {}
  );
  const [oauthError, setOauthError] = React.useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    setOauthError(null);
    const formData = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    if (!parsed.success) {
      e.preventDefault();
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!errs[key]) errs[key] = issue.message;
      }
      setClientErrors(errs);
      return;
    }

    setClientErrors({});
  }

  const emailError = clientErrors.email ?? state.fieldErrors?.email;
  const passwordError = clientErrors.password ?? state.fieldErrors?.password;
  const bannerError = oauthError ?? state.error ?? initialError;

  return (
    <Card className="mx-auto w-full max-w-[460px] rounded-lg p-7 shadow-card sm:p-8">
      <CardHeader className="gap-2">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-pill bg-verde-soft px-3 py-1 text-etiqueta text-verde">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Comunidad verificada en Mérida
        </span>
        <CardTitle className="text-titulo-web">Iniciar sesión</CardTitle>
        <CardDescription className="text-cuerpo">
          Accede con tu correo institucional o cuenta de arrendador.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {bannerError && (
          <div
            role="alert"
            className="rounded-xs border border-danger/30 bg-primary-soft px-4 py-3 text-pequeno font-semibold text-danger"
          >
            {bannerError}
          </div>
        )}

        <GoogleOAuthButton
          nextPath={nextPath}
          onError={(msg) => setOauthError(msg)}
        />

        <div className="relative flex items-center py-1">
          <div className="grow border-t border-border" />
          <span className="mx-3 shrink-0 text-etiqueta text-text-secondary">
            o con tu correo
          </span>
          <div className="grow border-t border-border" />
        </div>

        <form action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="next" value={nextPath} />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-email"
              className="text-pequeno font-semibold text-foreground"
            >
              Correo electrónico
            </label>
            <Input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="matricula@utmetropolitana.edu.mx"
              aria-invalid={Boolean(emailError)}
              required
            />
            {emailError && (
              <p className="text-etiqueta text-danger">{emailError}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-password"
              className="text-pequeno font-semibold text-foreground"
            >
              Contraseña
            </label>
            <Input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Tu contraseña"
              aria-invalid={Boolean(passwordError)}
              required
            />
            {passwordError && (
              <p className="text-etiqueta text-danger">{passwordError}</p>
            )}
          </div>

          <Button type="submit" className="mt-1 w-full" disabled={isPending}>
            <Mail className="size-4" aria-hidden="true" />
            {isPending ? "Entrando…" : "Iniciar sesión"}
          </Button>
        </form>

        <p className="text-center text-pequeno text-text-secondary">
          ¿Aún no tienes cuenta?{" "}
          <Link
            href="/registro"
            className="font-semibold text-primary hover:underline"
          >
            Crear cuenta en Otoch
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
