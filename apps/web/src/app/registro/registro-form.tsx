"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, Check, House, ShieldCheck } from "lucide-react";
import {
  registrarUsuarioAction,
  type AuthActionState,
} from "@/app/actions/auth";
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
import { registroSchema } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";
import type { RolRegistro } from "@/types/database";

const initialState: AuthActionState = {};

interface RegistroFormProps {
  rolInicial: RolRegistro;
}

export function RegistroForm({ rolInicial }: RegistroFormProps) {
  const [rol, setRol] = React.useState<RolRegistro>(rolInicial);
  const [state, formAction, isPending] = React.useActionState(
    registrarUsuarioAction,
    initialState
  );
  const [clientErrors, setClientErrors] = React.useState<Record<string, string>>(
    {}
  );
  const [oauthError, setOauthError] = React.useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    setOauthError(null);
    const formData = new FormData(e.currentTarget);
    const parsed = registroSchema.safeParse({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
      rolInicial: rol,
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
  const confirmError =
    clientErrors.confirmPassword ?? state.fieldErrors?.confirmPassword;
  const bannerError = oauthError ?? state.error;

  return (
    <Card className="mx-auto w-full max-w-[500px] rounded-lg p-7 shadow-card sm:p-8">
      <CardHeader className="gap-2">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-pill bg-primary-soft px-3 py-1 text-etiqueta text-primary-strong">
          <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
          Registro seguro en Otoch
        </span>
        <CardTitle className="text-titulo-web">Crear cuenta</CardTitle>
        <CardDescription className="text-cuerpo">
          Elige cómo usarás Otoch para personalizar tu perfil inicial.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {state.success ? (
          <div
            role="status"
            className="flex flex-col gap-3 rounded-sm border border-verde/30 bg-verde-soft p-5 text-foreground"
          >
            <div className="flex items-center gap-2 text-cuerpo font-semibold text-verde">
              <Check className="size-5" aria-hidden="true" />
              Revisa tu correo electrónico
            </div>
            <p className="text-pequeno text-foreground">{state.success}</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Ir a iniciar sesión</Link>
            </Button>
          </div>
        ) : (
          <>
            {bannerError && (
              <div
                role="alert"
                className="rounded-xs border border-danger/30 bg-primary-soft px-4 py-3 text-pequeno font-semibold text-danger"
              >
                {bannerError}
              </div>
            )}

            {/* Selector rápido de rol inicial */}
            <div
              role="group"
              aria-label="Tipo de cuenta"
              className="grid grid-cols-2 gap-2.5"
            >
              <button
                type="button"
                aria-pressed={rol === "estudiante"}
                onClick={() => setRol("estudiante")}
                className={cn(
                  "flex cursor-pointer flex-col items-start gap-1 rounded-sm border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  rol === "estudiante"
                    ? "border-primary bg-primary-soft text-foreground"
                    : "border-border bg-surface text-text-secondary hover:bg-sunken"
                )}
              >
                <BookOpen
                  className={cn(
                    "size-5",
                    rol === "estudiante" ? "text-primary" : "text-text-secondary"
                  )}
                  aria-hidden="true"
                />
                <span className="text-pequeno font-semibold text-foreground">
                  Soy estudiante
                </span>
                <span className="text-etiqueta text-text-secondary">
                  Busco cuarto o roomies
                </span>
              </button>

              <button
                type="button"
                aria-pressed={rol === "arrendador"}
                onClick={() => setRol("arrendador")}
                className={cn(
                  "flex cursor-pointer flex-col items-start gap-1 rounded-sm border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  rol === "arrendador"
                    ? "border-primary bg-primary-soft text-foreground"
                    : "border-border bg-surface text-text-secondary hover:bg-sunken"
                )}
              >
                <House
                  className={cn(
                    "size-5",
                    rol === "arrendador" ? "text-primary" : "text-text-secondary"
                  )}
                  aria-hidden="true"
                />
                <span className="text-pequeno font-semibold text-foreground">
                  Soy arrendador
                </span>
                <span className="text-etiqueta text-text-secondary">
                  Publico cuartos o casas
                </span>
              </button>
            </div>

            <GoogleOAuthButton
              nextPath={`/onboarding?rol=${rol}`}
              onError={(msg) => setOauthError(msg)}
            />

            <div className="relative flex items-center py-1">
              <div className="grow border-t border-border" />
              <span className="mx-3 shrink-0 text-etiqueta text-text-secondary">
                o regístrate con correo
              </span>
              <div className="grow border-t border-border" />
            </div>

            <form
              action={formAction}
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
              noValidate
            >
              <input type="hidden" name="rolInicial" value={rol} />

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="reg-email"
                  className="text-pequeno font-semibold text-foreground"
                >
                  {rol === "estudiante"
                    ? "Correo institucional o personal"
                    : "Correo electrónico"}
                </label>
                <Input
                  id="reg-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={
                    rol === "estudiante"
                      ? "matricula@utmetropolitana.edu.mx"
                      : "arrendador@correo.com"
                  }
                  aria-invalid={Boolean(emailError)}
                  required
                />
                {emailError && (
                  <p className="text-etiqueta text-danger">{emailError}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="reg-password"
                  className="text-pequeno font-semibold text-foreground"
                >
                  Contraseña (mínimo 8 caracteres)
                </label>
                <Input
                  id="reg-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Crea una contraseña segura"
                  aria-invalid={Boolean(passwordError)}
                  required
                />
                {passwordError && (
                  <p className="text-etiqueta text-danger">{passwordError}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="reg-confirm"
                  className="text-pequeno font-semibold text-foreground"
                >
                  Confirmar contraseña
                </label>
                <Input
                  id="reg-confirm"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repite tu contraseña"
                  aria-invalid={Boolean(confirmError)}
                  required
                />
                {confirmError && (
                  <p className="text-etiqueta text-danger">{confirmError}</p>
                )}
              </div>

              <Button type="submit" className="mt-1 w-full" disabled={isPending}>
                {isPending ? "Creando cuenta…" : "Crear cuenta y continuar"}
              </Button>
            </form>
          </>
        )}

        <p className="text-center text-pequeno text-text-secondary">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline"
          >
            Inicia sesión aquí
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
