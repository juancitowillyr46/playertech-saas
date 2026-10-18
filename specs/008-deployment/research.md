# Investigación: Despliegue del entorno de pruebas

## R1 — Migraciones en la nube sin el seed

- **Decisión**: el responsable ejecuta en su terminal, desde la raíz:
  1. `npx supabase login` (abre el navegador);
  2. `npx supabase link --project-ref <ref>` (pide la contraseña de la base de datos en su terminal);
  3. `npm run db:push`, un script nuevo equivalente a `supabase db push`.
- **Motivo**: `db push` aplica las migraciones pendientes en orden y **no aplica el seed** salvo con `--include-seed`. Las migraciones ya crean los catálogos (planes y documentos legales) y los buckets. La contraseña y el token quedan en el equipo del responsable, nunca en el chat ni en el repositorio.
- **Verificación**: `npx supabase migration list` (locales frente a remotas) y una consulta en el editor SQL del panel que cuenta usuarios y academias (deben ser 0) y planes y documentos vigentes.
- **Alternativas**: pegar el SQL a mano en el panel. Se descarta porque no queda registro de qué migraciones se aplicaron.

## R2 — Configuración del frontend por variables de entorno

- **Decisión**: variables de Vercel `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` (públicas por diseño, ADR-015). `frontend/scripts/write-environment.mjs` reescribe `src/environments/environment.ts` antes de compilar, con `production: true`, ambos valores y `sessionInactivityMinutes: 60`. Si falta una variable o la URL no es `https`, termina con error y Vercel no publica.
- **Motivo**: `supabase-environments.md` pide separar la configuración de cada entorno del código. El repositorio conserva `environment.ts` vacío; la aplicación ya falla al arrancar sin configuración (FR-007 de la spec 002). La misma compilación sirve mañana para un proyecto de producción distinto con otras variables.
- **Alternativas**: escribir la URL y la clave en `environment.ts` del repositorio. Funciona, porque son públicas, pero ata el código a un entorno.

## R3 — Proyecto de Vercel

- **Decisión**:
  - integración con GitHub (rama de producción `main`, vistas previas en los PR);
  - *Root Directory* `frontend`; *Install* `npm ci`; *Build* `npm run build:vercel`; *Output* `dist/playertech/browser`;
  - Node 24, que toma de `engines`.
- **`build:vercel`**: `node scripts/write-environment.mjs && ng build && node scripts/check-bundle.mjs`. CA-005 se verifica en cada compilación: si aparece una clave privilegiada o una demo, la publicación falla.
- **`vercel.json`**: ya existe (heredado de SakaiNG) con la reescritura `/:path*` → `/index.html`; se conserva. Vercel sirve primero los archivos que existen (JS, CSS, fuentes) y solo reescribe lo demás, así que las rutas de Angular cargan al recargar (CA-003).

## R4 — Autenticación en la nube (panel de Supabase)

- **Decisión**: se configura en el panel, no con `supabase config push`, porque `config.toml` describe el entorno local (`site_url` en `localhost`) y lo sobrescribiría.
  - **URL del sitio**: la dirección de producción de Vercel.
  - **Redirecciones permitidas**: `https://<proyecto>.vercel.app/auth/callback**` y el comodín de las vistas previas, `https://<proyecto>-*-<equipo>.vercel.app/auth/callback**`.
  - **Contraseña mínima**: 8.
  - **Confirmar el correo**: activo (por defecto en la nube).
  - Plantillas de correo por defecto.
- **Motivo**: ADR-014. Los enlaces de una vista previa vuelven a esa vista previa porque la app usa `location.origin` y el comodín la permite.

## R5 — Correo sin SMTP propio

Limitación aceptada (T-02). El servicio incluido solo envía a los miembros del equipo del proyecto de Supabase y con un límite bajo por hora. Para probar el registro, el correo de la persona debe estar invitado al equipo del proyecto en el panel de Supabase. El SMTP propio queda en «Antes del piloto».

## R6 — Plan gratuito de Vercel

El plan Hobby es para uso **no comercial**. Sirve para el entorno de pruebas. Antes del piloto con academias que paguen hay que pasar a Pro o a otro alojamiento. Se registra en ADR-016 junto a los demás requisitos del piloto.

## R7 — Documentación

- `docs/engineering/deployment.md`: guía con quién hace qué, comandos, configuración de Vercel y Auth, verificación y cómo aplicar migraciones nuevas.
- **ADR-016**: el frontend en Vercel (Hobby, no comercial), la configuración por variables y la URL del entorno de pruebas.
- **`supabase-environments.md`**: el entorno de pruebas ya existe.
- **`AGENTS.md`**: el comando `npm run db:push`.
