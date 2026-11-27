# Otoch · Vivienda universitaria verificada y roomies en Mérida, Yucatán

**Otoch** (*«hogar / casa»* en lengua maya) es una aplicación web progresiva (**PWA**) diseñada para que estudiantes foráneos de educación superior en **Mérida, Yucatán** encuentren cuartos, departamentos y casas verificadas a corta distancia de su campus, hagan *match* con *roomies* compatibles según sus hábitos de convivencia y dividan la renta en partes iguales dentro de **círculos** con chat en tiempo real y pre-acuerdo descargable en PDF.

---

## Características principales (v1.0.0)

- **Autenticación y perfiles diferenciados (M1 y M2):** registro e inicio de sesión con correo/contraseña y Google OAuth mediante Supabase Auth (`@supabase/ssr`), onboarding guiado por rol (`estudiante`, `arrendador`, `administrador`), cuestionario de convivencia y solicitudes de verificación institucional/identidad/propiedad.
- **Publicación y descubrimiento geográfico (M3):** gestión de inmuebles para arrendadores con galería en Supabase Storage, mapa y estimación de tiempo de traslado a universidades de Mérida (UTM, UADY, ITM, Anáhuac Mayab, Marista, UPY, etc.) usando coordenadas PostGIS (`POINT(lng lat)`), modo *swipe* con atajos de teclado (`←`, `→`, `↑`) y vista de cuadrícula.
- **Compatibilidad de roomies (M4):** cálculo ponderado de afinidad (`0–100 %`) por horario de sueño, orden y limpieza, tolerancia al ruido, visitas, estudio en casa, tabaco y mascotas, con detección automática de *match* mutuo (`trg_swipes_match`).
- **Círculos, chat en tiempo real y moderación comunitaria (M5 y M6):** creación de círculos a partir de matches de inmueble, invitación de roomies, chat en vivo con Supabase Realtime (`postgres_changes` + UI optimista), envío de imágenes, reportes y bloqueos mutuos.
- **Calculadora de reparto equitativo y pre-acuerdo PDF (M7):** división exacta en partes iguales mediante la función RPC `repartir_partes_iguales(p_acuerdo)`, aceptación individual de aportaciones y generación en cliente de documento PDF 1.4 listo para descarga.
- **Panel de moderación y auditoría (M8):** ruta `/admin` exclusiva para administradores con dictamen de verificaciones, gestión de reportes y bitácora inmutable de auditoría (`auditoria`).
- **Bandeja de notificaciones en tiempo real (M9), PWA y marco legal:** campana con contador en vivo, vista `/notificaciones`, manifiesto instalable (`/manifest.webmanifest`) y páginas públicas `/privacidad` (LFPDPPP / Derechos ARCO) y `/terminos`.

---

## Stack tecnológico

| Capa | Tecnología |
| --- | --- |
| **Frontend & SSR** | Next.js 16 (App Router) · React 19 · TypeScript 6 |
| **Estilos y UI** | Tailwind CSS v4 · Tokens propios (`design/tokens/tokens.css`) · `shadcn/ui` · Framer Motion · `lucide-react` |
| **Validación** | Zod v4 (cliente y Server Actions) |
| **Base de datos y Backend** | Supabase (PostgreSQL 17 + PostGIS + Row Level Security en el 100 % de tablas + Realtime + Auth + Storage) |
| **Calidad y pruebas** | ESLint 9 · Vitest + `@vitest/coverage-v8` · k6 (pruebas de carga) · GitHub Actions CI |
| **Monorepo** | `pnpm` workspaces |

---

## Estructura del monorepo

```text
otoch/
├── apps/
│   └── web/                          # Aplicación Next.js 16 (App Router + PWA)
│       ├── public/icons/             # Íconos instalables PWA (SVG, PNG 192/512, maskable, Apple)
│       └── src/
│           ├── app/                  # Rutas públicas, autenticadas ((app)), Server Actions y API (/api/health)
│           ├── components/
│           │   ├── otoch/            # Sistema de componentes de dominio Otoch
│           │   └── ui/               # Primitivas accesibles shadcn/ui + Radix
│           ├── lib/                  # Clientes Supabase SSR/Browser, cálculos geográficos, PDF y utilidades
│           └── types/                # Tipado estricto alineado al diccionario de datos
├── design/                           # Especificación obligatoria DESIGN.md, tokens CSS/JSON y capturas
├── docs/                             # Manual de despliegue y diccionario de datos CSV
├── supabase/
│   ├── migrations/                   # Migraciones SQL 001 a 007 (esquema, PostGIS, RLS, RPC y triggers)
│   ├── reversion/                    # Script controlado de reversión v1.0.0
│   └── seed.sql                      # Catálogo real de universidades en Mérida y municipios de Yucatán
├── tests/load/                       # Escenario de carga k6 sobre el feed de exploración
└── .github/workflows/                # Integración continua (ci.yml) y respaldos cifrados (backup.yml)
```

---

## Requisitos previos

- **Node.js** `>= 22.0.0`
- **pnpm** `>= 9` (configurado con `pnpm@12.23.0`)
- Proyecto activo en **Supabase** (o Docker Desktop + Supabase CLI para entorno local)

---

## Cómo ejecutar el proyecto localmente

1. **Clonar el repositorio e instalar dependencias:**

   ```bash
   git clone https://github.com/JesusTxr/otoch.git
   cd otoch
   pnpm install
   ```

2. **Configurar variables de entorno:**

   Copia `.env.example` hacia `apps/web/.env.local` y completa las llaves públicas de tu proyecto de Supabase:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<tu-project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   > **Seguridad:** nunca expongas llaves `sb_secret_` con el prefijo `NEXT_PUBLIC_` ni subas archivos `.env.local` al repositorio.

3. **Aplicar migraciones y catálogo semilla en Supabase (si usas un proyecto nuevo o local):**

   ```bash
   npx supabase link --project-ref <tu-project-ref>
   npx supabase db push --include-seed
   ```

4. **Iniciar el servidor de desarrollo (con Turbopack):**

   ```bash
   pnpm dev
   ```

   Abre `http://localhost:3000` en el navegador.

---

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `pnpm dev` | Levanta `apps/web` en modo desarrollo rápido (`next dev --turbopack`) |
| `pnpm build` | Genera la compilación optimizada de producción (`pnpm --filter web build`) |
| `pnpm start` | Inicia el servidor de producción de `apps/web` |
| `pnpm lint` | Ejecuta ESLint sobre `apps/web` |
| `pnpm typecheck` | Genera tipos de rutas de Next.js y verifica TypeScript (`tsc --noEmit`) |
| `pnpm test -- --coverage` | Ejecuta la suite de pruebas unitarias en Vitest con reporte de cobertura |

---

## Despliegue en producción (Vercel + Supabase)

Consulta la guía operativa paso a paso (liberación progresiva, verificación `/api/health`, respaldos cifrados y plan de reversión) en [`docs/MANUAL_DESPLIEGUE.md`](./docs/MANUAL_DESPLIEGUE.md).

---

## Privacidad y cumplimiento legal

Otoch implementa controles de privacidad desde el diseño conforme a la **LFPDPPP** (México). Revisa las rutas públicas `/privacidad` y `/terminos` dentro de la aplicación.
