# Changelog · Otoch

Todos los cambios relevantes de este proyecto se documentan en este archivo siguiendo [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [Versionado Semántico](https://semver.org/lang/es/).

## [1.0.0] - 2026-11-27

Primera versión productiva completa (**Release v1.0.0**) de la plataforma web progresiva **Otoch** para estudiantes foráneos y arrendadores en Mérida, Yucatán.

### Agregado
- **Base de datos y seguridad (Migraciones 001–007):**
  - Esquema relacional en PostgreSQL 17 + PostGIS (`universidades`, `municipios`, `perfiles`, `perfiles_estudiante`, `preferencias_convivencia`, `perfiles_arrendador`, `inmuebles`, `fotos_inmueble`, `swipes`, `matches`, `circulos`, `miembros_circulo`, `mensajes`, `acuerdos`, `aportaciones`, `verificaciones`, `reportes`, `bloqueos`, `notificaciones`, `suscripciones_push`, `auditoria`).
  - Seguridad a nivel de fila (**RLS**) habilitada en el 100 % de las tablas públicas y buckets de Storage (`inmuebles` y `chat`).
  - Funciones de negocio `compatibilidad(p_a, p_b)`, `crear_match_si_mutuo()`, `repartir_partes_iguales(p_acuerdo)` y disparadores automáticos de notificaciones para `nuevo_match`, `mensaje`, `acuerdo` y `verificacion`.
  - Semilla oficial (`supabase/seed.sql`) con coordenadas PostGIS y dominios institucionales reales de universidades en Mérida y catálogo INEGI de municipios de Yucatán.
- **Módulos M1 y M2 — Identidad, Onboarding y Perfiles:**
  - Landing page (`/`), inicio de sesión (`/login`), registro (`/registro`) con aceptación expresa de legales y soporte Google OAuth (`/auth/callback`).
  - Onboarding guiado por rol (`/onboarding`) y vista completa de perfil editable (`/perfil`) con cuestionario de hábitos y solicitudes de verificación.
- **Módulos M3 y M4 — Inmuebles, Exploración Geográfica y Roomies:**
  - Panel de arrendador (`/mis-inmuebles`, `/mis-inmuebles/nuevo`, `/mis-inmuebles/[id]/editar`) con carga de fotografías a Supabase Storage y revisión de interesados.
  - Explorador de inmuebles (`/explorar`) con modo *swipe* animado, atajos de teclado, vista de cuadrícula, filtros y cálculo de distancia/traslado al campus, más ficha de detalle (`/inmuebles/[id]`).
  - Descubrimiento de roomies compatibles (`/roomies`) con desglose de afinidad y modal interactivo de *match*.
- **Módulos M5, M6 y M7 — Círculos, Chat en Tiempo Real y Pre-acuerdos:**
  - Bandeja de matches (`/matches`), creación de círculos (`/circulos`), invitaciones a roomies y sala de chat en tiempo real (`/circulos/[id]`) con UI optimista, adjuntos de imagen, reportes y bloqueos.
  - Calculadora de reparto equitativo (`/circulos/[id]/acuerdo`) conectada por RPC y generador nativo de pre-acuerdo en formato PDF 1.4 con cobertura de pruebas unitarias.
- **Módulos M8 y M9 — Moderación, Notificaciones, PWA y Legales:**
  - Bandeja de notificaciones en tiempo real con campana e indicador de no leídas en barra de navegación y página `/notificaciones`.
  - Panel de moderación (`/admin`) exclusivo para `rol = 'administrador'` con pestañas de **Verificaciones**, **Reportes** y **Bitácora de auditoría** inmutable.
  - Configuración PWA instalable (`manifest.ts` e íconos en `public/icons/`) y páginas legales públicas `/privacidad` (LFPDPPP) y `/terminos`.
  - Endpoint de salud `/api/health`, flujos de GitHub Actions (`ci.yml`, `backup.yml`), pruebas unitarias Vitest y documentación operativa (`README.md`, `docs/MANUAL_DESPLIEGUE.md`).

### Optimizado
- Aceleración del middleware (`proxy.ts` y `src/lib/supabase/middleware.ts`) excluyendo recursos estáticos y prefetches, con cookie ligera de onboarding confirmado (`otoch_perfil_ok`).
- Deduplicación de sesión por petición con `React.cache()`, paralelización de consultas con `Promise.all()`, `loading.tsx` skeletons en rutas principales y compilación local con Turbopack (`next dev --turbopack`).
