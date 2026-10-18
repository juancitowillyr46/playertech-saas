# Contrato de despliegue

## Scripts

| Dónde | Script | Hace |
|---|---|---|
| Raíz | `npm run db:push` | `supabase db push`: aplica las migraciones pendientes al proyecto enlazado (sin el seed) |
| `frontend/` | `npm run build:vercel` | `node scripts/write-environment.mjs && ng build && node scripts/check-bundle.mjs` |

## `frontend/scripts/write-environment.mjs`

- Lee `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` del entorno.
- **Falla** (código 1, mensaje en español) si falta alguna, si la URL no empieza por `https://` o si la clave parece privilegiada (`sb_secret_` o un JWT con `role: service_role`).
- Escribe `src/environments/environment.ts`:

```ts
export const environment = {
    production: true,
    supabaseUrl: '<SUPABASE_URL>',
    supabasePublishableKey: '<SUPABASE_PUBLISHABLE_KEY>',
    sessionInactivityMinutes: 60
};
```

- Solo se ejecuta en Vercel. En local, `environment.ts` del repositorio no cambia.

## `frontend/vercel.json`

Ya existía (heredado de SakaiNG) y se conserva: reescribe `/:path*` a `/index.html`, con `trailingSlash: false`.

## Proyecto de Vercel

| Ajuste | Valor |
|---|---|
| Repositorio | `juancitowillyr46/playertech-saas` |
| Rama de producción | `main` |
| Root Directory | `frontend` |
| Framework Preset | Other (Angular compila con su propio script) |
| Install Command | `npm ci` |
| Build Command | `npm run build:vercel` |
| Output Directory | `dist/playertech/browser` |
| Variables | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (Production y Preview) |

## Autenticación en el panel de Supabase

| Ajuste | Valor |
|---|---|
| Site URL | `https://<proyecto>.vercel.app` |
| Redirect URLs | `https://<proyecto>.vercel.app/auth/callback**` y `https://<proyecto>-*-<equipo>.vercel.app/auth/callback**` |
| Confirm email | Activo |
| Minimum password length | 8 |
| Plantillas | Por defecto (las de la marca, antes del piloto) |
| Equipo del proyecto | Correos del equipo invitados, para recibir correos sin SMTP propio |
