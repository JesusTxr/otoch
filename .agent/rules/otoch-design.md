---
trigger: always_on
---

# Otoch — instrucciones para el agente de código

Otoch es una web app (PWA) para que estudiantes foráneos en Mérida, Yucatán, encuentren cuartos verificados cerca de su escuela, hagan match con roomies compatibles y dividan la renta en partes iguales dentro de "círculos" con chat.

## Antes de escribir interfaz
1. Lee `design/DESIGN.md` completo. Es la especificación obligatoria (rutas, componentes, medidas, textos, flujo y datos).
2. Usa **solo** los tokens de `design/tokens/tokens.css` (colores, radios, sombras, tipografía). No inventes colores hex ni tamaños fuera de la escala.
3. Mira la captura de la pantalla que vas a construir en `design/screens/` (por ejemplo `web/W02-explorar.png`). Si una captura y `DESIGN.md` no coinciden, manda `DESIGN.md`.

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript estricto.
- Tailwind CSS v4 + shadcn/ui; importa `design/tokens/tokens.css` en `app/globals.css` después de `@import "tailwindcss";`.
- Fuente Plus Jakarta Sans con `next/font/google`, expuesta como `--font-jakarta`.
- Íconos `lucide-react` (ver el mapa de íconos en DESIGN.md §1).
- Supabase: Auth (correo institucional), Postgres + PostGIS con RLS, Realtime para `mensajes`, Storage para fotos y contratos. Los nombres de tablas y columnas están en DESIGN.md y en el diccionario de datos del proyecto.

## Orden de trabajo
1. Primero la versión web (≥1024 px), pantalla por pantalla en este orden: W01 → W02 → W03 → W04 → W05 → W06 → W07.
2. Luego el responsivo móvil (<1024 px) siguiendo DESIGN.md §5.
3. Componentes base primero (`Button`, `FilterChip`, `VerifiedBadge`, `Avatar`, `SwipeActions`, `SideNav`, `TabBar`, `ListingCard`, `RoomieCard`) en `components/otoch/`.

## Cómo validar cada pantalla
- Abre la pantalla en el navegador a 1440×900 (web) o 390×844 (móvil), toma captura y compárala contra la de `design/screens/`. Corrige diferencias de espaciado, tamaño de texto y color antes de pasar a la siguiente.
- Verifica teclado y lectores de pantalla: botones de ícono con `aria-label`, chips con `aria-pressed`, swipe con botones y atajos ← → ↑.

## Reglas
- Textos de la interfaz en español de México; moneda como `$2,450`.
- Los datos de las capturas son de ejemplo: en código salen de Supabase (úsalos solo en `seed`).
- No subas llaves `sb_secret_` ni tokens al cliente ni al repositorio.
