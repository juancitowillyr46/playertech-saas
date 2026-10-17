# Investigación: Base del frontend y esqueleto de PlayerTech

Decisiones técnicas que resuelven las incógnitas del contexto técnico de `plan.md`. Las versiones elegidas llevan al menos dos semanas publicadas (consultado el 2026-10-16).

## Estado de partida (`frontend/`)

| Aspecto | Hoy | Problema |
|---|---|---|
| Proyecto | `sakai-ng` en `package.json` y `angular.json`; título "Sakai - PrimeNG"; `lang="en"` | No se identifica como PlayerTech (FR-001) |
| Angular | 21.0.6, `@angular-devkit/build-angular:application`, sin zone.js | Correcto |
| Análisis estático | `eslint.config.js` en formato antiguo (`extends`, `overrides`) con ESLint 9, sin `angular-eslint` ni `typescript-eslint` instalados, prefijo `p`, sin script `lint` | No funciona (FR-002, FR-003) |
| Pruebas | Builder `karma` con Jasmine; 0 pruebas | Herramienta reemplazada por FE-10 |
| `.gitmodules` | Submódulo `src/assets` hacia `sakai-assets`, inexistente en el repositorio | Configuración huérfana (FR-005) |
| Rutas | Demos en la raíz (`/`, `/uikit`, `/pages`, `/landing`); `**` → `/notfound` | Las demos van a producción (FR-024) |
| Bundle inicial | 1,75 MB (supera el presupuesto de 1 MB) | Dashboard, landing y documentación se cargan de entrada |
| Tema | Aura con primario `emerald` en `LayoutService`; modo oscuro no persistido | FR-028, FR-032 |
| Supabase | Solo `core/supabase/database.types.ts` (spec 001) | Falta el cliente y las capas |

## R1 — Versión de Node

**Decisión:** el proyecto exige **Node 24 LTS** (`engines` en `package.json` y archivo `.nvmrc`). El equipo debe actualizar desde la 20.19 actual.

**Justificación:**
- Node 20 terminó su soporte en abril de 2026: ya no recibe parches de seguridad.
- Las versiones de `@supabase/supabase-js` desde la 2.110 exigen Node 22 o superior; con Node 20 habría que congelar el cliente en la 2.109 (junio de 2026) y quedar sin correcciones.
- Angular 21 admite `^22.12` y `>=24`; Node 24 es la línea LTS activa con más vida por delante.

**Alternativas consideradas:**
- Node 22 LTS: válida, pero con menos vida útil que la 24.
- Seguir en Node 20 y fijar `supabase-js` 2.109.0: sin parches de seguridad en el runtime ni en el cliente.

> ⚠️ **Requiere acción del responsable**: instalar Node 24 LTS antes de `/speckit-implement`.

## R2 — Análisis estático

**Decisión:** `angular-eslint` **21.4.0** (la línea 21 corresponde a Angular 21) con `typescript-eslint` **8.71.0**, en formato de configuración plano de ESLint 9, instalado con su schematic oficial (`ng add`) y ajustado:
- Prefijo de selectores `app` (el de `angular.json` y el que ya usa el layout: `app-topbar`, `app-menu`…).
- Reglas recomendadas de TypeScript, de Angular y de plantillas, más las de **accesibilidad de plantillas** (`templateAccessibility`).
- `eslint-config-prettier` para no chocar con Prettier, que sigue formateando.
- **Regla `no-restricted-imports`**: prohíbe importar `@supabase/supabase-js` y `database.types` fuera de `core/supabase/` y de los archivos `supabase-*.ts`. Así FR-013, FR-014 y SC-005 se verifican en cada `lint`.
- Las demos (`src/app/pages/**`) se excluyen: son referencia y no se modifican.
- Se retiran los plugins antiguos sin uso (`eslint-plugin-import`, `eslint-plugin-prefer-arrow`, `eslint-plugin-prettier` 4).

**Alternativas consideradas:** reparar la configuración actual (es de otro proyecto y de un formato obsoleto); Biome (no tiene reglas de Angular).

## R3 — Pruebas

**Decisión:** builder oficial **`@angular/build:unit-test`** con **Vitest 4.1.11** y entorno **jsdom 27.4.0**; se ejecuta con `ng test` (y `ng test --watch=false` en verificación). Se retiran Karma, Jasmine y sus tipos.

**Justificación:** es el camino oficial de Angular 21 para Vitest (`@angular/build` declara `vitest ^4.0.8`), sin configuración propia de Vite. jsdom 27 es compatible con Node 20, 22 y 24.

**Pruebas de componentes:** **Angular Testing Library** (`@testing-library/angular` 19.5.0, `@testing-library/dom` 10.4.2 y `@testing-library/user-event` 14.6.7), como indica `docs/engineering/testing.md`. Decisión del responsable (2026-10-16, tras la etapa 1): se adopta ya, porque la Historia 7 trae cinco pantallas con formularios. Las pruebas buscan elementos por rol y etiqueta (`getByRole`, `getByLabelText`) e interactúan con `userEvent`, lo que además verifica que las etiquetas sean accesibles. Las pruebas unitarias de servicios, repositorios y guards siguen con `TestBed`. Son dependencias de desarrollo: no llegan al navegador.

**Alternativas consideradas:** Jest (Angular lo abandonó); Vitest con configuración propia (`@analogjs/vitest-angular`), innecesaria con el builder oficial.

## R4 — Cliente de Supabase

**Decisión:** `@supabase/supabase-js` **2.117.2**, creado una sola vez en `core/supabase/supabase-client.ts` y expuesto con un `InjectionToken`. Opciones de Auth:
- `flowType: 'pkce'` (FE-09).
- `detectSessionInUrl: false`: el intercambio del código lo hace explícitamente la pantalla `/auth/callback` (R7), para controlar estados y errores.
- `persistSession: true` y `autoRefreshToken: true`: la sesión sobrevive a recargas (restauración, FR-009).

**Alternativas consideradas:** `detectSessionInUrl: true` (el SDK intercambia el código al iniciar, pero no deja distinguir verificación, recuperación ni errores en una pantalla propia).

## R5 — Configuración por entorno

**Decisión:** `src/environments/environment.ts` (producción) y `environment.development.ts`, sustituidos por `fileReplacements` de `angular.json`, con `production`, `supabaseUrl` y `supabasePublishableKey`.
- Desarrollo: `http://127.0.0.1:54321` y la **clave publicable por defecto de Supabase local**, igual en todas las instalaciones de la CLI y pública por diseño (RLS protege los datos).
- Producción: valores vacíos hasta crear el proyecto en la nube (ADR-016).
- Al iniciar, un `provideAppInitializer` valida la configuración y, si falta o no es una URL válida, falla con un mensaje claro (FR-007).
- Se usa la **clave publicable** (`sb_publishable_…`), el formato que Supabase recomienda frente a la `anon key` JWT.

**Justificación:** cumple CA-007 y FE-03: solo valores públicos; ninguna clave secreta (`sb_secret_…`, `service_role`).

## R6 — Contexto de academia

**Decisión:** `AcademyContextRepository` (abstracto) con implementación Supabase en dos lecturas bajo RLS:
1. La **propia membresía** (`academy_members`, legible aunque la academia esté suspendida; decisión de la spec 001).
2. La **academia** (`academies`, legible solo si `is_academy_member()` es verdadero).

| Membresía | Academia visible | Situación |
|---|---|---|
| No existe o `disabled` | — | `none` → acceso denegado |
| `active` | Sí | `active` (id, nombre, logo) |
| `active` | No | `suspended` |

`AcademyContextService` guarda el resultado en signals, lo carga al iniciar sesión y lo limpia al cerrarla. Un error de red da la situación `error`, con reintento (caso límite de la spec).

**Justificación:** usa solo el contrato de la spec 001, sin migraciones nuevas. La deducción "membresía activa y academia invisible ⇒ suspendida" es exacta, porque la única condición de la política de lectura de `academies` además de la membresía es el estado `active`.

**Alternativas consideradas:** una RPC `get_my_academy_status()` en una nueva migración. Más explícita, pero amplía la spec 001 sin necesidad.

## R7 — Retorno de los enlaces de correo (`/auth/callback`)

**Decisión:**
- El registro usa `emailRedirectTo = {origen}/auth/callback`; la recuperación, `redirectTo = {origen}/auth/callback?next=/auth/reset-password`. El parámetro `next` solo admite rutas internas que empiecen por `/auth/` o `/home` (evita redirecciones abiertas).
- La pantalla:
  1. Si la URL trae `error` o `error_code` (enlace caducado o usado): estado `invalid`.
  2. Si trae `code`: llama a `AuthRepository.exchangeCodeForSession(code)`. Si funciona, limpia la URL (`replaceUrl`) y navega a `next` o a `/home`.
  3. Si el intercambio falla porque este navegador no inició el proceso (falta el verificador PKCE): estado `other_browser`, con el mensaje del caso límite de la spec.
  4. Sin `code` ni `error`: estado `invalid`.
- `supabase/config.toml` (spec 001) permite `http://localhost:4200/auth/callback**`, que cubre el parámetro `next`, y se retira la entrada de `/auth/reset-password`, que ya no se usa como retorno directo.

**Justificación:** con PKCE, Supabase confirma el correo **antes** de redirigir; si el verificador no está en ese navegador, la verificación ya ocurrió y solo falta iniciar sesión. Distinguirlo evita decirle al owner que su enlace "no sirve" cuando sí funcionó.

## R8 — Guards

**Decisión:** guards funcionales (`CanActivateFn`):
- `authGuard`: espera a que la sesión esté restaurada (R9); sin sesión devuelve `UrlTree` a `/auth/login?returnUrl=<ruta>`.
- `membershipGuard`: carga el contexto (R6) si no está cargado; `active` → pasa; `none` → `/auth/access-denied`; `suspended` → `/auth/suspended`; `error` → pantalla de error recuperable.
- `guestGuard`: con sesión devuelve `UrlTree` a `/home`. Se aplica a login, registro, verificación y recuperación; **no** a callback, nueva contraseña, acceso denegado ni suspendida (FR-020).
- Se declaran en el padre (`canActivate`) del `AppLayout` y del layout de autenticación; las rutas hijas se cargan de forma diferida (FR-025).

## R9 — Sesión

**Decisión:** `AuthService` (signals: `session`, `user`, `isAuthenticated`, `ready`). Al iniciar, un `provideAppInitializer` restaura la sesión con `AuthRepository.getSession()` y se suscribe a `onAuthStateChange` para reflejar cierres y renovaciones (incluido el cierre en otra pestaña). `signOut()` limpia la sesión y el contexto de academia y navega a `/auth/login`.

## R10 — Errores

**Decisión:**
- `AppError` (clase) con `code` estable: `invalid_credentials`, `email_not_confirmed`, `weak_password`, `link_invalid`, `other_browser`, `rate_limited`, `network`, `forbidden`, `unknown` (detalle en `contracts/app-errors.md`).
- `mapSupabaseError()` traduce los códigos de Supabase Auth (`invalid_credentials`, `email_not_confirmed`, `weak_password`, `otp_expired`, `flow_state_not_found`, `over_email_send_rate_limit`…), los de PostgreSQL vía PostgREST (`42501` → `forbidden`) y los fallos de red (`TypeError` de `fetch`) → `network`. Todo lo demás → `unknown`.
- Mensajes en español en un catálogo (`core/errors/error-messages.ts`). Para el registro, un correo existente no se revela (DEC-12).
- `GlobalErrorHandler` (implementa `ErrorHandler`): registra en consola y muestra un aviso genérico con `MessageService` y un `p-toast` en el componente raíz.

## R11 — Idioma

**Decisión:** `LOCALE_ID = 'es-CO'` con `registerLocaleData` de `@angular/common/locales/es-CO`, `lang="es"` en `index.html`, y la traducción de PrimeNG en un archivo propio `core/i18n/primeng-es.ts`, tipado con la interfaz `Translation` de PrimeNG y registrado en `providePrimeNG({ translation })`.

**Alternativas consideradas:** el paquete `primelocale` (otra dependencia para unas decenas de cadenas; el archivo propio queda revisado y versionado).

## R12 — Tema y layout adoptado

**Decisión:**
- `core/theme/playertech-preset.ts` con `definePreset(Aura, …)` y primario `{blue.50…950}` (el `blue.500` de Aura es `rgb(59, 130, 246)`), registrado en `providePrimeNG` con `darkModeSelector: '.app-dark'`. Es el sitio 1 de estilos de `AGENTS.md`.
- `LayoutService`: primario y preset fijos (sin cambio en tiempo de ejecución), menú `static`, y modo oscuro **persistido** en `localStorage` con `try/catch` (FR-032).
- Menú: el modelo se mueve a `core/navigation/navigation.ts` (Inicio; Configuración: Academia, Sedes); `app.menu` solo lo consume. En desarrollo se añade una sección "Desarrollo" con enlaces a `/dev`.
- Barra superior: marca "PlayerTech" en texto, nombre de la academia del contexto, botón claro/oscuro y menú de usuario (`p-menu` emergente) con **Cerrar sesión**. Se retiran el configurador y los botones de demostración (calendario, mensajes, perfil).
- Pie: "PlayerTech".
- Los cambios se limitan a los archivos existentes de `layout/` (principio V; `sakai-upstream.md`).

## R13 — Rutas y demos solo en desarrollo

**Decisión (ajustada en la implementación):** las demos se registran en un único módulo, `features/dev/dev-extras.ts` (`DEV_ROUTES` y `DEV_NAVIGATION`), que la configuración de producción de `angular.json` **sustituye** por `dev-extras.production.ts` (listas vacías) mediante `fileReplacements`, igual que los entornos. Así no queda ningún `import()` de las demos en el grafo de producción.

Se descartaron dos alternativas tras comprobarlas con `check:bundle`:
- `environment.production ? [] : DEV_ROUTES`: esbuild no propaga la constante entre módulos y las demos seguían en el bundle.
- `ngDevMode ? DEV_ROUTES : []`: la rama se eliminaba del código principal, pero esbuild generaba igualmente los fragmentos de cada `import()` dinámico, que quedaban en `dist/` sin ruta que los usara.
- `/dev` contiene **solo** las demos de SakaiNG (FR-037). Ninguna pantalla de PlayerTech vive ahí: la validación con sesión real usa las pantallas de autenticación básicas en sus rutas definitivas (R17).
- `/dev` usa el `AppLayout` sin guards; las demos conservan su código intacto en `src/app/pages/`.
- La sección "Demos" del menú (`DEV_NAVIGATION`) vive en el mismo módulo sustituible, de modo que sus textos y rutas tampoco llegan a producción.
- `**` → página 404 propia (`features/errors/not-found`), en lugar de la demo `notfound`.

## R14 — Verificación del bundle

**Decisión:** script `frontend/scripts/check-bundle.mjs` (`npm run check:bundle`) que, sobre `dist/`, falla si encuentra patrones de claves privilegiadas (`service_role`, `sb_secret_`, `SUPABASE_SERVICE`) o rastros de las demos. Para las demos, el script extrae los selectores de los componentes de `src/app/pages/**/*.ts` (por ejemplo `app-formlayout-demo`, `app-dashboard`; hoy son 35) y falla si alguno aparece en `dist/`. Así no hay que mantener una lista, y por eso los componentes de PlayerTech no deben reutilizar esos selectores (`app-error`, `app-access`, `app-empty`, `app-notfound`…). Junto con la regla de importaciones (R2), cubre FR-034, SC-003, SC-004 y SC-005.

La verificación de producción es **estática** (sobre `dist/`): la configuración de producción tiene la conexión vacía hasta crear el entorno en la nube (ADR-016) y la validación de arranque (FR-007) impide ejecutarla, que es el comportamiento buscado.

## R15 — Renombrado y limpieza

**Decisión:**
- `package.json` → `playertech-frontend`; proyecto de `angular.json` → `playertech`; salida `dist/playertech`.
- `index.html`: título "PlayerTech", `lang="es"`, sin el favicon externo de PrimeFaces. La fuente Lato se mantiene hasta T-01.
- Se elimina `.gitmodules`. `LICENSE.md` (licencia MIT de SakaiNG) se conserva: la licencia exige mantener el aviso.
- El `README.md` del frontend se reescribe para PlayerTech.
- Dependencias que solo usan las demos (`chart.js`, `quill`) se mantienen, porque las demos siguen en desarrollo. `primeclt` se retira si no tiene uso.
- `vercel.json` se conserva sin cambios: la plataforma de despliegue sigue pendiente (T-00).

## R17 — Pantallas de autenticación básicas

**Decisión (2026-10-16, revisada tras `/speckit-analyze`):** en lugar de un inicio de sesión provisional en `/dev`, se construyen versiones básicas y funcionales de inicio de sesión, registro, verificación, recuperación y nueva contraseña en sus rutas definitivas (`features/auth/`), con formularios reactivos tipados, componentes de PrimeNG y el layout de autenticación.

**Justificación:**
- Nada de lo que desarrolle PlayerTech queda en una ubicación provisional (FR-037): las HU-001, HU-014 y HU-016 **completan** estas pantallas en lugar de reemplazar una herramienta temporal.
- El registro y la recuperación desde la app generan el código PKCE en el navegador, el único modo de validar `/auth/callback` de punta a punta (Historia 3). Registrar por la API o con `curl` no produce ese código.

**Alcance de la versión básica:** los campos y validaciones de FR-036, mensajes de `contracts/app-errors.md`, las reglas de formularios de `docs/architecture/ui.md` y pruebas de componentes. **Queda para las HU:** reenvío del correo de verificación, cualquier criterio de aceptación adicional de sus HU y la revisión de diseño de T-01.

**Documentos legales:** `LegalDocumentsRepository.getCurrent()` lee las versiones vigentes y sus enlaces; el registro envía esas versiones en los metadatos (contrato de la spec 001), de modo que siempre coinciden con las que valida el trigger.

## R18 — Actualización de seguridad durante la implementación (Fase 1)

**Hallazgo:** `npm audit` mostró vulnerabilidades altas en Angular 21.0.x (framework) y críticas en el compilador basado en webpack (`@angular-devkit/build-angular` → `piscina`, `webpack-dev-server`).

**Decisión:**
- Angular **21.2.25** (framework) y PrimeNG **21.1.10**, con `@angular/cdk` **21.2.14** (dependencia par de PrimeNG 21.1). Misma versión mayor; ADR-015 no cambia.
- CLI y `@angular/build` **21.2.27**: es una corrección de seguridad crítica publicada el 2026-10-15, por lo que se exceptúa la regla de dos semanas.
- Los builders pasan de `@angular-devkit/build-angular:*` a **`@angular/build:*`** (el compilador oficial de Angular 21, basado en esbuild y Vite) y se retira `@angular-devkit/build-angular`, que arrastraba webpack (413 paquetes menos).
- Las dependencias de desarrollo tienen versión exacta.
- npm 11 bloquea los scripts de instalación de dependencias por defecto. `esbuild`, `lmdb`, `msgpackr-extract` y `@parcel/watcher` traen binarios precompilados para Windows; no se aprueban sus scripts mientras la compilación funcione sin ellos.

**Riesgo aceptado:** quedan `picomatch` (alta) y `ajv` (moderada) dentro de las herramientas del CLI (`@angular-devkit/core` fija sus versiones), solo explotables con patrones o esquemas controlados por un atacante y sin llegar al navegador; y `quill` (baja), usado solo por las demos. Se revisan en la próxima actualización del CLI.

## R16 — Presupuesto del bundle

**Decisión:** mantener el presupuesto inicial de 1 MB de aviso. Al sacar las demos de la carga inicial y cargar cada sección bajo demanda, el bundle inicial debe bajar de 1,75 MB a menos de 1 MB; se verifica en la compilación de producción.
