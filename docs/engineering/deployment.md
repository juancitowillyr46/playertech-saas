# Despliegue

Cómo se publica PlayerTech en la nube y cómo se mantiene. Hoy existe un **entorno de pruebas** (habilitador T-02, spec 008): frontend en **Vercel** y backend en un proyecto de **Supabase** (plan Free, ADR-016). Producción, con academias reales, queda para antes del piloto (`docs/product/roadmap.md`).

## Quién hace qué

| Paso | Quién | Por qué |
|---|---|---|
| Crear proyectos y cuentas, conectar GitHub | Responsable de producto | Son sus cuentas |
| Iniciar sesión en la CLI y escribir la contraseña de la base de datos | Responsable de producto | Los secretos nunca pasan por el chat ni por el repositorio |
| Scripts, configuración del repositorio y verificación | Agente o equipo | Viven en el repositorio |

**Secretos** (contraseña de la base de datos, clave `service_role` o `sb_secret_…`, tokens): solo en el gestor de contraseñas y en los paneles. **Valores públicos** (URL del proyecto, clave publicable `sb_publishable_…`): pueden compartirse y van como variables de Vercel.

## Backend: Supabase

### Primera vez

Desde la raíz del repositorio:

```bash
npx supabase login                              # abre el navegador
npx supabase link --project-ref <ref>           # pide la contraseña de la base de datos
npm run db:push                                 # aplica las migraciones; nunca aplica el seed
npx supabase migration list                     # mismas migraciones en local y en remoto
```

Verificación en el editor SQL del panel (debe dar 0, 0, 3, 2 y 2):

```sql
select
  (select count(*) from auth.users)                                      as usuarios,
  (select count(*) from public.academies)                                as academias,
  (select count(*) from public.plans)                                    as planes,
  (select count(*) from public.legal_documents where is_current)         as documentos_vigentes,
  (select count(*) from storage.buckets where id in ('public-assets', 'private-files')) as buckets;
```

### Autenticación (panel: Authentication)

`supabase/config.toml` describe solo el entorno local; la nube se configura en el panel.

| Ajuste | Valor |
|---|---|
| Site URL | URL de producción de Vercel |
| Redirect URLs | `https://<proyecto>.vercel.app/auth/callback**` y el patrón de vistas previas `https://<proyecto>-*-<equipo>.vercel.app/auth/callback**` |
| Confirm email | Activo |
| Minimum password length | 8 |
| Equipo del proyecto | Invitar los correos que probarán: sin SMTP propio solo ellos reciben correos |

### Migraciones nuevas

Tras el merge a `main` de una spec con migraciones: `npm run db:push` desde la raíz, con el proyecto enlazado. Nunca se edita el esquema a mano en el panel (`supabase-environments.md`).

## Frontend: Vercel

| Ajuste | Valor |
|---|---|
| Repositorio y rama de producción | `juancitowillyr46/playertech-saas`, `main` |
| Root Directory | `frontend` |
| Framework Preset | Other |
| Install / Build / Output | `npm ci` / `npm run build:vercel` / `dist/playertech/browser` |
| Variables (Production y Preview) | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` |

- `npm run build:vercel` genera `src/environments/environment.ts` desde las variables (`scripts/write-environment.mjs`), compila y ejecuta `check:bundle`. Si falta una variable, la URL no es `https` o aparece una clave privilegiada, **la publicación falla** y la versión anterior sigue en línea.
- `vercel.json` reescribe las rutas a `index.html`, para que las rutas de Angular carguen al recargar.
- Cada merge a `main` publica en producción y cada PR obtiene su vista previa.
- **En local**, `build:vercel` sobrescribe `environment.ts`. Restáuralo con `git checkout -- frontend/src/environments/environment.ts` y no lo incluyas en un commit.

## Limitaciones del entorno de pruebas

- **Correo:** sin SMTP propio, Supabase solo envía a los miembros del equipo del proyecto y con un límite bajo por hora.
- **Copias de seguridad:** no hay copias propias (plan Free).
- **Documentos legales:** sus enlaces son provisionales.
- **Vercel Hobby:** solo uso no comercial. Antes del piloto con academias que paguen hay que pasar a Vercel Pro u otro alojamiento.
- **Datos:** sin academias reales. El seed de desarrollo no existe en la nube.

## Relación con otros documentos

- `docs/architecture/decisions.md`: ADR-014, ADR-015 (FE-03), ADR-016 y ADR-017.
- `docs/architecture/supabase-environments.md`: entornos y migraciones.
- `specs/008-deployment/`: spec, contratos y verificación.
