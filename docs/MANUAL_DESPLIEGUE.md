# Manual de compilación y despliegue · Otoch v1.0.0

## 1. Requisitos

- Node.js LTS 22 o superior y pnpm.
- Git 2.40 o superior.
- Docker Desktop o Docker Engine (lo usa Supabase CLI para la base local).
- Supabase CLI y Vercel CLI.
- Cuentas con MFA en GitHub, Vercel, Supabase, Resend, Mapbox, Sentry y Better Stack.

## 2. Obtener la versión liberada

```bash
git clone [COMPLETAR: URL del repositorio] otoch && cd otoch
git checkout v1.0.0
pnpm install --frozen-lockfile
```

## 3. Entorno local

```bash
cp apps/web/.env.example apps/web/.env.local   # completar valores locales
supabase start                                 # levanta Postgres, Auth, Realtime y Storage locales
supabase db reset                              # aplica migraciones y datos semilla
pnpm --filter web dev                          # http://localhost:3000
```

## 4. Pruebas

```bash
pnpm test                      # Vitest (unitarias)
pnpm test:e2e                  # Playwright (extremo a extremo)
k6 run pruebas/k6_carga_feed.js -e BASE_URL=https://[COMPLETAR: URL de staging]
```

## 5. Staging (automático al fusionar en `develop`)

```bash
supabase link --project-ref [COMPLETAR: ref de staging]
supabase db push
vercel pull --yes --environment=preview
vercel build
vercel deploy --prebuilt
```

## 6. Producción con liberación progresiva (Blue-Green + Rolling Releases)

1. Reunión Go/No-Go con el checklist de preproducción al 100 %.
2. Respaldo T0 cifrado:

   ```bash
   pg_dump "$SUPABASE_DB_URL" -Fc | age -r "$BACKUP_AGE_RECIPIENT" > t0_$(date +%Y%m%d%H%M).dump.age
   ```

3. Migraciones (compatibles hacia atrás, patrón expandir y contraer):

   ```bash
   supabase link --project-ref [COMPLETAR: ref de producción]
   supabase db push
   ```

4. Despliegue de la versión candidata (Green) e inicio del Rolling Release:

   ```bash
   vercel pull --yes --environment=production
   vercel build --prod
   vercel deploy --prebuilt --prod
   ```

5. Avance por etapas (5 % → 25 % → 50 % → 100 %) solo si se cumplen los criterios: errores 5xx < 1 %, p95 < 800 ms y ningún incidente Sev1 o Sev2:

   ```bash
   vercel rolling-release approve --dpl <url> --currentStageIndex 0
   vercel rolling-release complete --dpl <url>
   ```

6. Verificación: `curl -fsS https://otoch.mx/api/health` y pruebas de humo.

## 7. Reversión

```bash
vercel rolling-release abort --dpl <url>     # durante la liberación
vercel rollback <url-anterior>               # después de la liberación (Instant Rollback)
psql "$SUPABASE_DB_URL" -1 -f bd/reversion/reversion_v1_0_0.sql   # solo con aprobación (nivel 3)
```

Después de un rollback, Vercel desactiva la asignación automática de dominios de producción; reactívala solo al liberar la corrección.
