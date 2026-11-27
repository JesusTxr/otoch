import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { PublicFooter } from "@/components/otoch/public-footer";
import { PublicNavbar } from "@/components/otoch/public-navbar";
import { Card } from "@/components/ui/card";
import { obtenerResumenSesion } from "@/lib/supabase/session";

export const metadata: Metadata = {
  title: "Términos y Condiciones de Uso · Otoch",
  description:
    "Condiciones de uso de la plataforma Otoch para estudiantes universitarios y arrendadores en Mérida, Yucatán.",
};

export default async function TerminosPage() {
  const usuario = await obtenerResumenSesion();

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-foreground">
      <PublicNavbar usuario={usuario} variant="compact" />

      <main className="mx-auto w-full max-w-[920px] flex-1 px-4 py-10 lg:py-14">
        <div className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-pill bg-primary-soft px-3.5 py-1 text-etiqueta font-semibold text-primary-strong">
            <FileText className="size-4 text-primary" aria-hidden="true" />
            Marco de convivencia y uso · Otoch
          </span>
          <h1 className="text-display text-foreground lg:text-titulo-web">
            Términos y Condiciones de Uso
          </h1>
          <p className="text-pequeno text-text-secondary">
            Última actualización: noviembre de 2026 · Aplicables en Mérida,
            Yucatán, México.
          </p>
        </div>

        <Card className="mt-6 flex flex-col gap-6 p-6 sm:p-8">
          <section className="flex flex-col gap-2">
            <h2 className="text-titulo-2 text-foreground">
              1. Objeto de la plataforma
            </h2>
            <p className="text-cuerpo text-text-secondary">
              <strong>Otoch</strong> es una plataforma web progresiva (PWA) que
              facilita el contacto entre estudiantes de educación superior y
              personas arrendadoras en Mérida, Yucatán, ofreciendo herramientas
              de descubrimiento geográfico cercano al campus, cálculo de
              compatibilidad entre roomies, círculos de conversación y reparto
              equitativo de renta.
            </p>
            <p className="text-cuerpo text-text-secondary">
              Otoch <strong>no actúa como agencia inmobiliaria, bróker, fiador
              ni parte contratante</strong> en los contratos de arrendamiento
              que lleguen a celebrar las personas usuarias.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-titulo-2 text-foreground">
              2. Elegibilidad y veracidad de la cuenta
            </h2>
            <ul className="list-disc space-y-1.5 pl-5 text-cuerpo text-text-secondary">
              <li>
                Para crear una cuenta debes tener al menos{" "}
                <strong className="text-foreground">18 años cumplidos</strong> y
                capacidad legal para contratar en México.
              </li>
              <li>
                Las cuentas de estudiante requieren vincularse a una institución
                de educación superior válida y proporcionar información veraz en
                su cuestionario de convivencia.
              </li>
              <li>
                Las personas arrendadoras declaran contar con legítima propiedad
                o facultades legales vigentes para ofrecer en arrendamiento los
                inmuebles publicados, así como publicar fotografías y montos
                reales en pesos mexicanos (MXN).
              </li>
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-titulo-2 text-foreground">
              3. Alcance del pre-acuerdo PDF y prevención de fraudes
            </h2>
            <p className="text-cuerpo text-text-secondary">
              La calculadora de partes iguales y el documento PDF descargable
              desde la vista de acuerdos constituyen una{" "}
              <strong>hoja de ruta y pre-acuerdo orientativo</strong> para
              transparentar montos de renta, depósito, duración y reglas de
              convivencia entre los integrantes del círculo; no sustituyen al
              contrato civil de arrendamiento firmado por las partes conforme al
              Código Civil del Estado de Yucatán.
            </p>
            <div className="rounded-sm border border-verde/30 bg-verde-soft p-4 text-pequeno font-semibold text-verde">
              Regla de oro de seguridad: nunca entregues apartados, depósitos ni
              transferencias bancarias antes de conocer físicamente el inmueble
              y firmar el contrato definitivo con el arrendador verificado.
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-titulo-2 text-foreground">
              4. Conducta comunitaria, reportes y moderación
            </h2>
            <p className="text-cuerpo text-text-secondary">
              Queda estrictamente prohibido utilizar Otoch para publicar
              anuncios inexistentes, solicitar cobros anticipados engañosos,
              suplantar identidades universitarias o de propietarios, acosar a
              otros integrantes o compartir contenido ilícito en el chat de los
              círculos.
            </p>
            <p className="text-cuerpo text-text-secondary">
              Cualquier persona usuaria puede utilizar las funciones de{" "}
              <strong>Reportar</strong> y <strong>Bloquear</strong>. El equipo
              de moderación de Otoch podrá pausar anuncios, retirar mensajes y
              suspender cuentas que vulneren estos Términos, dejando constancia
              en la bitácora de auditoría.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-titulo-2 text-foreground">
              5. Propiedad intelectual y disponibilidad
            </h2>
            <p className="text-cuerpo text-text-secondary">
              El diseño visual, marca «Otoch», código fuente y algoritmos de
              compatibilidad son titularidad del proyecto Otoch. Las personas
              arrendadoras conservan los derechos sobre las fotografías de sus
              inmuebles y otorgan a Otoch una licencia no exclusiva para
              mostrarlas dentro de la plataforma mientras el anuncio esté
              activo.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-titulo-2 text-foreground">
              6. Protección de datos, ley aplicable y jurisdicción
            </h2>
            <p className="text-cuerpo text-text-secondary">
              El tratamiento de tus datos personales se rige por nuestro{" "}
              <Link
                href="/privacidad"
                className="font-semibold text-primary hover:underline"
              >
                Aviso de Privacidad Integral
              </Link>
              . Para la interpretación y cumplimiento de los presentes Términos,
              las partes se someten a las leyes aplicables en México y a la
              jurisdicción de los tribunales competentes en la ciudad de{" "}
              <strong>Mérida, Yucatán</strong>.
            </p>
          </section>
        </Card>
      </main>

      <PublicFooter />
    </div>
  );
}
