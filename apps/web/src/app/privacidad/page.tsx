import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { PublicFooter } from "@/components/otoch/public-footer";
import { PublicNavbar } from "@/components/otoch/public-navbar";
import { Card } from "@/components/ui/card";
import { obtenerResumenSesion } from "@/lib/supabase/session";

export const metadata: Metadata = {
  title: "Aviso de Privacidad Integral · Otoch",
  description:
    "Aviso de Privacidad Integral de Otoch conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).",
};

export default async function PrivacidadPage() {
  const usuario = await obtenerResumenSesion();

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-foreground">
      <PublicNavbar usuario={usuario} variant="compact" />

      <main className="mx-auto w-full max-w-[920px] flex-1 px-4 py-10 lg:py-14">
        <div className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-pill bg-verde-soft px-3.5 py-1 text-etiqueta font-semibold text-verde">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Cumplimiento LFPDPPP · México
          </span>
          <h1 className="text-display text-foreground lg:text-titulo-web">
            Aviso de Privacidad Integral
          </h1>
          <p className="text-pequeno text-text-secondary">
            Última actualización: noviembre de 2026 · Vigente para la versión
            v1.0.0 de Otoch.
          </p>
        </div>

        <Card className="mt-6 flex flex-col gap-6 p-6 sm:p-8">
          <section className="flex flex-col gap-2">
            <h2 className="text-titulo-2 text-foreground">
              1. Identidad y domicilio del responsable
            </h2>
            <p className="text-cuerpo text-text-secondary">
              <strong>Otoch</strong> («la Plataforma»), con domicilio operativo
              en la ciudad de Mérida, Yucatán, Estados Unidos Mexicanos, es
              responsable del uso, tratamiento y protección de tus datos
              personales, en cumplimiento de la{" "}
              <strong>
                Ley Federal de Protección de Datos Personales en Posesión de los
                Particulares (LFPDPPP)
              </strong>
              , su Reglamento y los Lineamientos del Aviso de Privacidad.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-titulo-2 text-foreground">
              2. Datos personales que recabamos
            </h2>
            <p className="text-cuerpo text-text-secondary">
              Según el rol con el que te registres en Otoch, recabamos las
              siguientes categorías de datos personales:
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-cuerpo text-text-secondary">
              <li>
                <strong className="text-foreground">
                  Identificación y contacto:
                </strong>{" "}
                nombre(s), apellidos, fecha de nacimiento (para validar mayoría
                de edad de 18 años o más), correo electrónico, teléfono opcional
                y fotografía de perfil opcional.
              </li>
              <li>
                <strong className="text-foreground">
                  Datos académicos y de búsqueda (estudiantes):
                </strong>{" "}
                universidad de adscripción, correo institucional (`.edu.mx`),
                carrera, cuatrimestre o semestre, municipio de origen,
                presupuesto mensual máximo y fecha estimada de mudanza.
              </li>
              <li>
                <strong className="text-foreground">
                  Preferencias de convivencia:
                </strong>{" "}
                hábitos de sueño, orden, tolerancia al ruido, visitas, estudio
                en casa, mascotas, tabaco, intereses y, de manera estrictamente
                opcional, género cuando actives el filtro de roomies del mismo
                género.
              </li>
              <li>
                <strong className="text-foreground">
                  Datos patrimoniales y de acreditación (arrendadores):
                </strong>{" "}
                carácter de persona física o inmobiliaria, características del
                inmueble, colonia, coordenadas de ubicación, dirección exacta y
                referencia temporal de documentos de identidad o propiedad para
                revisión.
              </li>
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-titulo-2 text-foreground">
              3. Privacidad por diseño y visibilidad restringida
            </h2>
            <p className="text-cuerpo text-text-secondary">
              Otoch aplica controles técnicos de seguridad a nivel de fila (Row
              Level Security) para minimizar la exposición de tu información:
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-cuerpo text-text-secondary">
              <li>
                Tu <strong>número telefónico</strong> y la{" "}
                <strong>dirección exacta del inmueble</strong>{" "}
                (`direccion_privada`) permanecen ocultos en el catálogo público
                y solo se muestran a integrantes activos de un mismo círculo.
              </li>
              <li>
                Las referencias o evidencias enviadas para revisión en{" "}
                <strong>verificaciones</strong> se eliminan automáticamente del
                registro una vez concluido el dictamen administrativo,
                conservándose únicamente el resultado de verificación.
              </li>
              <li>
                Si bloqueas a una persona usuaria, se impide de forma mutua la
                visualización de perfiles y el envío de mensajes.
              </li>
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-titulo-2 text-foreground">
              4. Finalidades del tratamiento
            </h2>
            <p className="text-cuerpo text-text-secondary">
              <strong className="text-foreground">Finalidades primarias</strong>{" "}
              (necesarias para prestarte el servicio): autenticar tu cuenta;
              verificar pertenencia universitaria o titularidad del arrendador;
              calcular tiempos aproximados de traslado al campus y porcentajes
              de compatibilidad entre roomies; habilitar círculos de chat en
              tiempo real; calcular el reparto equitativo de renta y generar el
              documento PDF orientativo de pre-acuerdo; y atender reportes de
              seguridad y moderación.
            </p>
            <p className="text-cuerpo text-text-secondary">
              <strong className="text-foreground">
                Finalidades secundarias:
              </strong>{" "}
              elaborar estadísticas agregadas y disociadas sobre movilidad
              estudiantil desde municipios de Yucatán hacia Mérida. Puedes
              oponerte a finalidades secundarias escribiendo a{" "}
              <span className="font-semibold text-foreground">
                privacidad@otoch.mx
              </span>
              .
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-titulo-2 text-foreground">
              5. Transferencias de datos
            </h2>
            <p className="text-cuerpo text-text-secondary">
              Otoch <strong>no vende ni comercializa</strong> tus datos
              personales. Únicamente se apoyan en encargados de infraestructura
              en la nube (Supabase para base de datos cifrada y autenticación, y
              Vercel para alojamiento web) sujetos a obligaciones de
              confidencialidad y seguridad equivalentes a las previstas en la
              LFPDPPP, así como requerimientos legalmente fundados de autoridad
              competente.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-titulo-2 text-foreground">
              6. Ejercicio de Derechos ARCO y revocación
            </h2>
            <p className="text-cuerpo text-text-secondary">
              Tienes derecho a <strong>Acceder</strong> a tus datos personales,{" "}
              <strong>Rectificarlos</strong> desde la sección{" "}
              <Link href="/perfil" className="font-semibold text-primary hover:underline">
                Mi perfil
              </Link>
              , <strong>Cancelarlos</strong> (mediante baja lógica inmediata con
              bloqueo `eliminado_en` y posterior supresión) u{" "}
              <strong>Oponerte</strong> a su tratamiento, así como revocar tu
              consentimiento.
            </p>
            <p className="text-cuerpo text-text-secondary">
              Para ejercer tus Derechos ARCO envía una solicitud al correo{" "}
              <strong className="text-foreground">privacidad@otoch.mx</strong>{" "}
              indicando tu nombre completo, correo registrado, descripción clara
              del derecho que deseas ejercer y documento que acredite tu
              identidad. Recibirás respuesta en un plazo máximo de 20 días
              hábiles conforme al artículo 32 de la LFPDPPP.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-titulo-2 text-foreground">
              7. Uso de cookies técnicas y cambios al aviso
            </h2>
            <p className="text-cuerpo text-text-secondary">
              Utilizamos cookies técnicas estrictamente necesarias (`httpOnly`)
              para mantener tu sesión autenticada y recordar el estado de tu
              onboarding sin rastreo publicitario de terceros. Cualquier
              modificación sustancial al presente Aviso de Privacidad se
              notificará dentro de la bandeja de notificaciones de Otoch y en
              esta misma ruta (`/privacidad`).
            </p>
          </section>
        </Card>
      </main>

      <PublicFooter />
    </div>
  );
}
