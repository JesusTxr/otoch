import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { OtochLogo } from "@/components/otoch/logo";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface text-foreground">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-4 py-10 lg:px-20 lg:py-12">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))]">
          <div className="flex flex-col gap-3">
            <OtochLogo href="/" />
            <p className="max-w-md text-pequeno text-text-secondary">
              Vivienda verificada cerca de tu universidad, roomies compatibles y
              renta dividida en partes iguales para estudiantes foráneos en
              Mérida, Yucatán.
            </p>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-pill bg-verde-soft px-3 py-1 text-etiqueta font-semibold text-verde">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Datos protegidos conforme a la LFPDPPP
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            <h2 className="text-etiqueta font-semibold uppercase tracking-wide text-text-secondary">
              Plataforma
            </h2>
            <nav
              aria-label="Enlaces de la plataforma"
              className="flex flex-col gap-2 text-pequeno"
            >
              <Link
                href="/explorar"
                className="w-fit text-foreground transition-colors hover:text-primary"
              >
                Explorar inmuebles
              </Link>
              <Link
                href="/registro?rol=estudiante"
                className="w-fit text-foreground transition-colors hover:text-primary"
              >
                Registro para estudiantes
              </Link>
              <Link
                href="/registro?rol=arrendador"
                className="w-fit text-foreground transition-colors hover:text-primary"
              >
                Publicar como arrendador
              </Link>
              <Link
                href="/login"
                className="w-fit text-foreground transition-colors hover:text-primary"
              >
                Iniciar sesión
              </Link>
            </nav>
          </div>

          <div className="flex flex-col gap-2.5">
            <h2 className="text-etiqueta font-semibold uppercase tracking-wide text-text-secondary">
              Legal y privacidad
            </h2>
            <nav
              aria-label="Enlaces legales"
              className="flex flex-col gap-2 text-pequeno"
            >
              <Link
                href="/privacidad"
                className="w-fit text-foreground transition-colors hover:text-primary"
              >
                Aviso de Privacidad (LFPDPPP)
              </Link>
              <Link
                href="/terminos"
                className="w-fit text-foreground transition-colors hover:text-primary"
              >
                Términos y Condiciones
              </Link>
              <span className="text-etiqueta text-text-secondary">
                Derechos ARCO: privacidad@otoch.mx
              </span>
            </nav>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-2 border-t border-border pt-6 text-etiqueta text-text-secondary sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Otoch · Mérida, Yucatán, México.</p>
          <p>Versión v1.0.0 · Nunca transfieras dinero antes de firmar contrato.</p>
        </div>
      </div>
    </footer>
  );
}
