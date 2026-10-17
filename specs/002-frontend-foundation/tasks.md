---

description: "Lista de tareas para implementar la base del frontend y el esqueleto de PlayerTech"
---

# Tareas: Base del frontend y esqueleto de PlayerTech

**Input**: Documentos de diseño de `/specs/002-frontend-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Se incluyen tareas de prueba porque la spec las exige (FR-033, FR-034).

**Organización**: Las tareas se agrupan por historia de la spec. La configuración, el cliente de Supabase, los errores, la sesión y el contexto de academia los necesitan varias historias, por eso están en la Fase 2 (fundaciones). Las historias se ejecutan en este orden: US1, US7, US2, US3, US4, US5 y US6. US7 va antes que US2 porque las rutas de US2 registran sus pantallas.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: Puede ejecutarse en paralelo (archivo distinto y sin dependencias pendientes).
- **[Story]**: Historia de la spec (US1 a US7).

## Convenciones

- Raíz del frontend: `frontend/`. Código en `frontend/src/app/` según la estructura de `plan.md`. Las rutas de archivo de las tareas son relativas a la raíz del repositorio.
- Componentes standalone con signals, detección de cambios sin zone.js (ya configurada) y `ChangeDetectionStrategy.OnPush`. Selectores con prefijo `app-` que **no** repitan los de las demos (`app-error`, `app-access`, `app-empty`, `app-notfound`, `app-dashboard`…; research R14).
- Formularios: Reactive Forms tipados (FE-08) y las reglas de `docs/architecture/ui.md`: etiquetas visibles, contraseña con opción de mostrar (`p-password` con `toggleMask`), errores bajo el campo, errores generales con `p-message`, botón principal con estado de carga que impide envíos duplicados, sin "Recordarme".
- Textos de la interfaz en español (Colombia), con el vocabulario de `docs/product/glossary.md`. Mensajes de error tomados de `contracts/app-errors.md`.
- Estilos solo en los tres sitios de `AGENTS.md`: preset (`core/theme/`), utilidades de Tailwind y SCSS existente del layout. Sin `style` en línea, sin `!important`, sin sobrescribir clases internas de PrimeNG.
- Las demos de `frontend/src/app/pages/` no se modifican. **Ninguna funcionalidad de PlayerTech se ubica bajo `/dev`** (FR-037).
- Pruebas: `*.spec.ts` junto al archivo que prueban, con Vitest, usando dobles de los contratos (ninguna prueba unitaria llama a Supabase real). Se ejecutan con `npm run test:ci` desde `frontend/`.
  - **Componentes** (pantallas): Angular Testing Library (`render`, `screen.getByRole` / `getByLabelText`, `userEvent`), buscando por rol y etiqueta, no por selectores CSS (research R3).
  - **Servicios, repositorios y guards**: `TestBed`.
- Requisito previo: **Node 24 LTS** activo (`node --version` ≥ 24; research R1).

---

## Fase 1: Configuración

**Propósito**: Dependencias y herramientas que todas las historias necesitan.

- [X] T001 Crear `frontend/.nvmrc` con `24` y añadir `"engines": { "node": ">=24" }` a `frontend/package.json` (research R1)
- [X] T002 Retirar de `frontend/package.json` las dependencias de Karma y Jasmine (`karma`, `karma-chrome-launcher`, `karma-coverage`, `karma-jasmine`, `karma-jasmine-html-reporter`, `jasmine-core`, `@types/jasmine`) y los plugins de ESLint sin uso (`eslint-plugin-import`, `eslint-plugin-prefer-arrow`, `eslint-plugin-prettier`); retirar `primeclt` si `grep -r primeclt frontend/src` no encuentra usos; eliminar `frontend/.gitmodules` (research R15)
- [X] T003 Instalar con versión exacta en `frontend/`: dependencia `@supabase/supabase-js@2.117.2`; dependencias de desarrollo `vitest@4.1.11`, `jsdom@27.4.0`, `typescript-eslint@8.71.0`; y ejecutar `npx ng add angular-eslint@21.4.0 --skip-confirmation` para instalar `angular-eslint` y crear el target `lint` en `frontend/angular.json` (research R2, R3, R4)
- [X] T004 Ejecutar `npm install` en `frontend/` con Node 24 y confirmar que `package-lock.json` queda actualizado sin errores de dependencias

**Punto de control**: dependencias instaladas con Node 24.

---

## Fase 2: Fundaciones (bloqueantes)

**Propósito**: Configuración, cliente, errores, sesión, contexto de academia, tema e idioma que usan todas las historias.

**⚠️ CRÍTICO**: Ninguna historia puede empezar hasta completar esta fase.

- [X] T005 Crear `frontend/src/environments/environment.ts` (`production: true`, `supabaseUrl: ''`, `supabasePublishableKey: ''`) y `frontend/src/environments/environment.development.ts` (`production: false`, `supabaseUrl: 'http://127.0.0.1:54321'`, `supabasePublishableKey` = valor `PUBLISHABLE_KEY` de `npx supabase status -o env` ejecutado en la raíz, que es la clave publicable por defecto de Supabase local); añadir `fileReplacements` a la configuración `development` de `frontend/angular.json` (research R5)
- [X] T006 [P] Crear `frontend/src/app/core/config/app-config.ts` con el token `APP_CONFIG` y la función `validateAppConfig(env)`, que lanza un `Error` con el mensaje "Configuración de Supabase incompleta: revisa src/environments" si `supabaseUrl` no es una URL `http(s)` válida o `supabasePublishableKey` está vacía (FR-007)
- [X] T007 Crear `frontend/src/app/core/supabase/supabase-client.ts` con el token `SUPABASE_CLIENT` y su fábrica `createClient<Database>(url, key, { auth: { flowType: 'pkce', detectSessionInUrl: false, persistSession: true, autoRefreshToken: true } })`, usando `Database` de `database.types.ts` (research R4)
- [X] T008 [P] Crear `frontend/src/app/core/errors/app-error.ts`: tipo `AppErrorCode` = `'invalid_credentials' | 'email_not_confirmed' | 'weak_password' | 'link_invalid' | 'other_browser' | 'rate_limited' | 'network' | 'forbidden' | 'unknown'` y clase `AppError extends Error` con `code`, `message` y `cause?` (contracts/app-errors.md)
- [X] T009 [P] Crear `frontend/src/app/core/errors/error-messages.ts` con el mensaje en español de cada `AppErrorCode`, copiado literalmente de la tabla de `specs/002-frontend-foundation/contracts/app-errors.md` (para `other_browser`, el texto completo de `contracts/routes.md`)
- [X] T010 Escribir primero `frontend/src/app/core/errors/supabase-error.mapper.spec.ts` (un caso por cada fila de contracts/app-errors.md, más `TypeError` de `fetch` → `network`, PostgreSQL `42501` → `forbidden`, objeto desconocido → `unknown`, y que `cause` conserva el original) y después `frontend/src/app/core/errors/supabase-error.mapper.ts` con `mapSupabaseError(error: unknown): AppError` (research R10)
- [X] T011 [P] Crear `frontend/src/app/core/errors/global-error-handler.ts` (`GlobalErrorHandler implements ErrorHandler`: `console.error` del error y `MessageService.add({ severity: 'error', summary: 'Error', detail: <mensaje de unknown> })`) (FR-016)
- [X] T012 [P] Crear `frontend/src/app/core/i18n/primeng-es.ts` con la traducción de PrimeNG al español, tipada como `Translation` de `primeng/api` (días, meses, `firstDayOfWeek: 1`, `dateFormat: 'dd/mm/yy'`, botones, filtros, mensajes de vacío, contraseña débil/media/fuerte y `aria`) (research R11)
- [X] T013 [P] Crear `frontend/src/app/core/theme/playertech-preset.ts` con `definePreset(Aura, { semantic: { primary: { 50: '{blue.50}', …, 950: '{blue.950}' } } })` (primario `blue.500` = `rgb(59, 130, 246)`, ADR-015 FE-06) (research R12)
- [X] T014 [P] Crear los modelos de `data-model.md`: `frontend/src/app/core/auth/models/auth.models.ts` (`AuthUser`, `AuthSession`, `SignUpInput`), `frontend/src/app/core/academy-context/models/academy-context.models.ts` (`AcademyContext` con `status: 'loading' | 'active' | 'suspended' | 'none' | 'error'`, `CurrentAcademy`), `frontend/src/app/core/storage/models/storage.models.ts` (`StoredFile`, `UploadFileInput` con `bucket: 'public-assets' | 'private-files'`) y `frontend/src/app/core/legal/models/legal.models.ts` (`LegalDocument` con `type: 'terms' | 'privacy_policy'`, `CurrentLegalDocuments`)
- [X] T015 [P] Crear `frontend/src/app/core/auth/data/auth.repository.ts`: clase abstracta `AuthRepository` con las 8 operaciones y firmas de `contracts/repositories.md`
- [X] T016 Escribir primero `frontend/src/app/core/auth/data/supabase-auth.repository.spec.ts` con el cliente simulado: `signUp` envía `options.data` con `academy_name`, `full_name`, `legal_acceptances.terms` y `legal_acceptances.privacy_policy` (contrato de la spec 001) y `emailRedirectTo = ${location.origin}/auth/callback`; `requestPasswordReset` usa `redirectTo = ${location.origin}/auth/callback?next=/auth/reset-password` y resuelve igual aunque Supabase informe un error de usuario inexistente; `exchangeCodeForSession` convierte `flow_state_not_found` o un mensaje con "code verifier" en `other_browser` y `otp_expired` en `link_invalid`; `signIn` convierte la sesión al modelo `AuthSession` (contracts/repositories.md)
- [X] T017 Crear `frontend/src/app/core/auth/data/supabase-auth.repository.ts` (`SupabaseAuthRepository extends AuthRepository`) hasta que T016 pase; cada error pasa por `mapSupabaseError`
- [X] T018 Crear `frontend/src/app/core/auth/auth.service.ts` (`AuthService`, `providedIn: 'root'`): signals `session`, `user`, `isAuthenticated` (computed), `ready`; `restore()` (llama a `getSession()`, se suscribe a `onSessionChange`, pone `ready` en `true`), `signIn()`, `signOut()` (limpia el contexto de academia y navega a `/auth/login`) (research R9)
- [X] T019 [P] Crear `frontend/src/app/core/academy-context/data/academy-context.repository.ts` (clase abstracta con `loadCurrent(): Promise<AcademyContext>`)
- [X] T020 Escribir primero `frontend/src/app/core/academy-context/data/supabase-academy-context.repository.spec.ts` (cliente simulado: sin membresía → `none`; membresía `disabled` → `none`; activa con academia visible → `active` con id y nombre; activa sin academia visible → `suspended`; error de red → rechaza con `AppError` `network`) y después `supabase-academy-context.repository.ts`, que lee la propia fila de `academy_members` (`academy_id`, `status`) y luego `academies` (`id`, `name`, `logo_file_id`) por ese id, según la tabla de research R6
- [X] T021 Escribir primero `frontend/src/app/core/academy-context/academy-context.service.spec.ts` (repositorio simulado: `loading` → `active`/`suspended`/`none`; error → `error`; `load()` reutiliza el resultado ya cargado; `reload()` vuelve a consultar; `clear()` vuelve al estado inicial) y después `academy-context.service.ts` (`AcademyContextService`: signals `context`, `academy`, `status`; `load()`, `reload()`, `clear()`). El contexto se recalcula al recargar la página o al iniciar sesión, no en cada navegación (caso límite de la spec)
- [X] T022 Reescribir `frontend/src/app.config.ts`: `providePrimeNG({ theme: { preset: PlayerTechPreset, options: { darkModeSelector: '.app-dark' } }, translation: PRIMENG_ES })`; `LOCALE_ID: 'es-CO'` con `registerLocaleData(localeEsCO)`; `{ provide: ErrorHandler, useClass: GlobalErrorHandler }` y `MessageService`; `APP_CONFIG` y `SUPABASE_CLIENT` a partir de `environment`; `{ provide: AuthRepository, useClass: SupabaseAuthRepository }` y `{ provide: AcademyContextRepository, useClass: SupabaseAcademyContextRepository }`; `provideAppInitializer` que valida la configuración y ejecuta `AuthService.restore()`; conservar las opciones actuales de `provideRouter`
- [X] T023 [P] Actualizar `frontend/src/app.component.ts` para incluir `<p-toast />` (de `primeng/toast`) junto al `router-outlet`
- [X] T024 [P] Crear `frontend/src/app/shared/components/placeholder-page/placeholder-page.ts` (`app-placeholder-page`, input `title` obligatorio; muestra el título y "Disponible pronto" con utilidades de Tailwind)
- [X] T025 Verificar que `npx ng build --configuration development` compila sin errores con las rutas actuales sin cambios

**Punto de control**: el núcleo compila; sesión y contexto de academia funcionan detrás de sus contratos.

---

## Fase 3: Historia 1 — Proyecto con controles de calidad (Prioridad: P1) 🎯 MVP

**Objetivo**: El proyecto se llama PlayerTech y compilación, análisis estático y pruebas funcionan (CA-009 de T-00).

**Prueba independiente**: `npm run build`, `npm run lint` y `npm run test:ci` desde `frontend/` terminan sin errores.

### Implementación de la Historia 1

- [X] T026 [US1] Renombrar el proyecto: `name` → `playertech-frontend` en `frontend/package.json`; proyecto `sakai-ng` → `playertech` en `frontend/angular.json` (incluidos los `buildTarget`), `outputPath` → `dist/playertech`; en `frontend/src/index.html`, `<title>PlayerTech</title>`, `lang="es"` y sin el `<link rel="icon">` y el `preconnect` externos de PrimeFaces (FR-001, research R15)
- [X] T027 [US1] Cambiar el target `test` de `frontend/angular.json` al builder `@angular/build:unit-test` con `runner: 'vitest'`, `tsConfig: 'tsconfig.spec.json'`; actualizar `frontend/tsconfig.spec.json` con `"types": ["vitest/globals"]` y sin tipos de Jasmine; en `frontend/package.json`, scripts `"test": "ng test"` y `"test:ci": "ng test --watch=false"` (FR-004, research R3)
- [X] T028 [US1] Reescribir `frontend/eslint.config.js` en formato plano con `typescript-eslint` y `angular-eslint`: `tseslint.configs.recommended`, `angular.configs.tsRecommended`, `angular.configs.templateRecommended`, `angular.configs.templateAccessibility`, `eslint-config-prettier`; `@angular-eslint/component-selector` y `directive-selector` con prefijo `app`; `ignores` para `dist/`, `.angular/`, `node_modules/` y `src/app/pages/**`; script `"lint": "ng lint"` en `frontend/package.json` (FR-003, research R2)
- [X] T029 [US1] Añadir a `frontend/eslint.config.js` la regla `no-restricted-imports` que prohíbe `@supabase/supabase-js` y cualquier ruta que termine en `database.types`, con el mensaje "Solo los repositorios Supabase pueden usar el SDK y los tipos generados (ADR-002)", y un bloque que la desactiva para `src/app/core/supabase/**` y `src/app/**/supabase-*.ts` (FR-013, FR-014, research R2)
- [X] T030 [US1] Ejecutar `npm run lint` y corregir los errores en el código propio (`src/app/core/`, `src/app/shared/`, `src/app/layout/`, `src/app.*.ts`) sin desactivar reglas
- [X] T031 [US1] Ejecutar `npm run test:ci` y `npm run build` y corregir hasta que los tres comandos (con `lint`) terminen sin errores
- [X] T032 [P] [US1] Reescribir `frontend/README.md` para PlayerTech: requisitos (Node 24, Supabase local de la spec 001), comandos (`start`, `build`, `lint`, `test`, `test:ci`, `check:bundle`), estructura de `src/app/`, enlace a `docs/architecture/frontend.md`, y nota de que la base proviene de SakaiNG (licencia MIT en `LICENSE.md`)

**Punto de control**: controles de calidad en verde (SC-001 parcial; `check:bundle` llega en la Historia 6).

---

## Fase 4: Historia 7 — Pantallas básicas de autenticación (Prioridad: P1)

**Objetivo**: Registro, inicio de sesión, verificación, recuperación y nueva contraseña funcionales en sus rutas reales (FR-035, FR-036; R17).

**Prueba independiente**: pruebas de las pantallas en verde; manualmente, sección 2 de `quickstart.md` (requiere las rutas de la Historia 2).

### Pruebas de la Historia 7

- [X] T033 [P] [US7] Escribir `frontend/src/app/core/legal/data/supabase-legal-documents.repository.spec.ts` (cliente simulado: devuelve `terms` y `privacyPolicy` con versión y URL de las filas `is_current`; si falta uno de los dos tipos, rechaza con `AppError` `unknown`)
- [X] T034 [P] [US7] Escribir `frontend/src/app/features/auth/login/login.spec.ts` (`AuthService` y `Router` simulados): correo y contraseña obligatorios y correo con formato válido; envía `signIn`; con éxito navega a `returnUrl` si empieza por `/` y no por `//`, o a `/home`; un `AppError` muestra su mensaje en `p-message`; el botón queda deshabilitado mientras se envía
- [X] T035 [P] [US7] Escribir `frontend/src/app/features/auth/register/register.spec.ts` (`AuthRepository` y `LegalDocumentsRepository` simulados): muestra los enlaces de los documentos vigentes; exige nombre de la academia, nombre, correo válido, contraseña "al menos 8 caracteres", confirmación igual a la contraseña y ambas aceptaciones; envía `signUp` con las versiones leídas; con éxito navega a `/auth/verify-email?email=<correo>`; si la carga de documentos falla, muestra el error con **Reintentar** y no muestra el formulario
- [X] T036 [P] [US7] Escribir `frontend/src/app/features/auth/forgot-password/forgot-password.spec.ts` (envía `requestPasswordReset` y muestra siempre el mismo mensaje de confirmación, tanto si resuelve como si rechaza con un error que no sea `rate_limited` o `network`) y `frontend/src/app/features/auth/reset-password/reset-password.spec.ts` (exige contraseña de al menos 8 caracteres y confirmación igual; envía `updatePassword` y navega a `/home`; sin sesión muestra "El enlace de recuperación ya no es válido" con enlace a `/auth/forgot-password`)

### Implementación de la Historia 7

- [X] T037 [P] [US7] Crear `frontend/src/app/core/legal/data/legal-documents.repository.ts` (clase abstracta con `getCurrent(): Promise<CurrentLegalDocuments>`) y `supabase-legal-documents.repository.ts` hasta que T033 pase; registrarlo en `frontend/src/app.config.ts` con `{ provide: LegalDocumentsRepository, useClass: SupabaseLegalDocumentsRepository }`
- [X] T038 [US7] Crear el layout de autenticación `frontend/src/app/features/auth/auth-layout/auth-layout.ts` según el patrón de `docs/architecture/ui.md`: dos columnas en escritorio (panel de marca con "PlayerTech", propuesta de valor y tres beneficios, fondo `bg-primary`; panel de contenido con `router-outlet`), una sola columna con el panel de marca oculto por debajo de `md` (FR-030)
- [X] T039 [US7] Crear `frontend/src/app/features/auth/login/login.ts` (`app-login-page`): título "Iniciar sesión", campos Correo y Contraseña, botón "Iniciar sesión", enlaces "¿Olvidaste tu contraseña?" (`/auth/forgot-password`) y "Crear cuenta" (`/auth/register`), hasta que T034 pase
- [X] T040 [US7] Crear `frontend/src/app/features/auth/register/register.ts` (`app-register-page`): título "Crea tu academia"; campos "Nombre de la academia", "Tu nombre", "Correo", "Contraseña", "Confirmar contraseña"; casillas "Acepto los Términos y Condiciones" y "Acepto la Política de Tratamiento de Datos" con enlace a la URL vigente de cada documento (se abre en otra pestaña); botón "Crear cuenta"; enlace "Ya tengo cuenta" (`/auth/login`); hasta que T035 pase (FR-036)
- [X] T041 [P] [US7] Crear `frontend/src/app/features/auth/verify-email/verify-email.ts` (`app-verify-email-page`): título "Verifica tu correo", texto "Te enviamos un enlace a {correo del parámetro `email`}. Ábrelo desde este mismo navegador para activar tu cuenta.", y enlace "Ir a iniciar sesión"
- [X] T042 [US7] Crear `frontend/src/app/features/auth/forgot-password/forgot-password.ts` (`app-forgot-password-page`: título "Recuperar contraseña", campo Correo, botón "Enviar enlace", mensaje único "Si el correo está registrado, te enviamos un enlace para crear una nueva contraseña. Ábrelo desde este mismo navegador.") y `frontend/src/app/features/auth/reset-password/reset-password.ts` (`app-reset-password-page`: título "Nueva contraseña", campos "Nueva contraseña" y "Confirmar contraseña", botón "Guardar contraseña"), hasta que T036 pase
- [X] T043 [US7] Crear `frontend/src/app/features/auth/auth.routes.ts` con `AuthLayout` como padre y las rutas `login`, `register`, `verify-email`, `forgot-password` y `reset-password` con sus componentes (`loadComponent`); los guards se añaden en la Historia 2
- [X] T044 [US7] Ejecutar `npm run test:ci` y `npm run lint` hasta que T033–T036 pasen

**Punto de control**: pantallas de autenticación listas y probadas.

---

## Fase 5: Historia 2 — Acceso protegido según sesión y membresía (Prioridad: P1)

**Objetivo**: Cada situación lleva a su pantalla (CA-008 de T-00).

**Prueba independiente**: pruebas de los guards en verde y sección 4 de `quickstart.md`.

### Pruebas de la Historia 2

- [X] T045 [P] [US2] Escribir `frontend/src/app/core/auth/guards/auth.guard.spec.ts`: con `AuthService` simulado, espera a `ready`; sin sesión devuelve `UrlTree` `/auth/login?returnUrl=%2Fsettings%2Fvenues` para esa ruta; con sesión devuelve `true` (contracts/routes.md, tabla de guards)
- [X] T046 [P] [US2] Escribir `frontend/src/app/core/auth/guards/membership.guard.spec.ts`: con `AcademyContextService` simulado, `active` → `true`; `none` → `/auth/access-denied`; `suspended` → `/auth/suspended`; `error` → `/error` (contracts/routes.md)
- [X] T047 [P] [US2] Escribir `frontend/src/app/core/auth/guards/guest.guard.spec.ts`: sin sesión → `true`; con sesión → `/home`

### Implementación de la Historia 2

- [X] T048 [US2] Crear los guards funcionales `frontend/src/app/core/auth/guards/auth.guard.ts`, `membership.guard.ts` y `guest.guard.ts` según la tabla de `contracts/routes.md`, esperando `AuthService.ready()` con `toObservable` + `filter` + `take(1)` (research R8)
- [X] T049 [P] [US2] Crear `frontend/src/app/features/auth/access-denied/access-denied.ts` (`app-access-denied-page`) y `frontend/src/app/features/auth/suspended/suspended.ts` (`app-suspended-page`): título, explicación en lenguaje claro ("Tu cuenta no tiene acceso a una academia." / "Tu academia está suspendida. Tus datos se conservan. Escríbenos para reactivarla.") y botón **Cerrar sesión** con `AuthService.signOut()`; añadirlas a `frontend/src/app/features/auth/auth.routes.ts` sin guards (FR-022)
- [X] T050 [P] [US2] Crear `frontend/src/app/features/errors/not-found/not-found.ts` (`app-not-found-page`: título "Página no encontrada", texto breve y enlace "Volver al inicio" a `/home`) y `frontend/src/app/features/errors/context-error/context-error.ts` (`app-context-error-page`: mensaje de `network` y botón **Reintentar** que llama a `AcademyContextService.reload()` y navega a `/home`) (FR-023, caso límite de conexión)
- [X] T051 [P] [US2] Crear `frontend/src/app/features/home/home.routes.ts` y `frontend/src/app/features/settings/settings.routes.ts` con `PlaceholderPage` ("Inicio"; "Academia" en `academy`; "Sedes" en `venues`)
- [X] T052 [US2] Añadir `guestGuard` a `login`, `register`, `verify-email` y `forgot-password` en `frontend/src/app/features/auth/auth.routes.ts`; **no** a `reset-password`, `access-denied` ni `suspended` (FR-020)
- [X] T053 [US2] Reescribir `frontend/src/app.routes.ts`: `''` → `redirectTo: 'home'`; `auth` → `loadChildren` de `auth.routes`; bajo `AppLayout` con `canActivate: [authGuard, membershipGuard]`, `home` y `settings` con `loadChildren`; `error` → `ContextError` (con `authGuard`); `**` → `NotFound`. Las demos dejan de estar en la raíz y se montan en la Historia 6 (FR-017 a FR-019, FR-023, FR-025)
- [X] T054 [US2] Ejecutar `npm run test:ci` y `npm run lint` hasta que T045–T047 pasen

**Punto de control**: rutas protegidas verificadas por pruebas (SC-002).

---

## Fase 6: Historia 3 — Retorno desde los enlaces de correo (Prioridad: P1)

**Objetivo**: `/auth/callback` completa el intercambio PKCE y lleva al lugar correcto.

**Prueba independiente**: pruebas de la pantalla en verde y sección 3 de `quickstart.md`.

### Pruebas de la Historia 3

- [X] T055 [US3] Escribir `frontend/src/app/features/auth/callback/callback.spec.ts` con `AuthRepository` y `Router` simulados: `?code=x` con éxito → navega a `/home` con `replaceUrl: true`; `?code=x&next=/auth/reset-password` → navega a `/auth/reset-password`; `next=https://malicioso.com`, `next=//malicioso.com` o `next=/settings` → se ignora y navega a `/home`; `?error=access_denied&error_code=otp_expired` → estado `invalid`; sin parámetros → `invalid`; intercambio rechazado con `other_browser` → estado `other_browser`; con `link_invalid` → `invalid` (contracts/routes.md)

### Implementación de la Historia 3

- [X] T056 [US3] Crear `frontend/src/app/features/auth/callback/callback.ts` (`app-callback-page`) según la tabla "Pantalla /auth/callback" de `contracts/routes.md`: estado en un signal (`processing`, `invalid`, `other_browser`); `processing` con `p-progressSpinner` y "Verificando…"; `invalid` con "El enlace venció o ya fue usado." y enlace a `/auth/login`; `other_browser` con el texto literal del contrato y enlaces a `/auth/login` y `/auth/forgot-password`; `next` aceptado solo si empieza por `/home` o `/auth/reset-password`; registrar la ruta `callback` (sin guards) en `frontend/src/app/features/auth/auth.routes.ts` (FR-021, research R7)
- [X] T057 [US3] Actualizar `supabase/config.toml`: `additional_redirect_urls = ["http://localhost:4200/auth/callback**"]` (retirar la entrada de `/auth/reset-password`); reiniciar Supabase local (`npm run db:stop` y `npm run db:start` desde la raíz) y **verificar en el momento** que el patrón acepta el parámetro `next`: pedir una recuperación de `owner.a@playertech.test` desde `/auth/forgot-password` y comprobar en el visor de correo que el enlace contiene `redirect_to=…%2Fauth%2Fcallback%3Fnext%3D…`; si Supabase lo rechaza, usar `http://localhost:4200/**` y anotarlo en `contracts/routes.md` (A1 de `/speckit-analyze`)
- [X] T058 [US3] Ejecutar `npm run test:ci` hasta que T055 pase

**Punto de control**: retorno de enlaces verificado por pruebas.

---

## Fase 7: Historia 4 — Navegación base de PlayerTech (Prioridad: P2)

**Objetivo**: Layout adoptado con marca, academia, menú propio, menú de usuario, modo claro/oscuro y español (ADR-015).

**Prueba independiente**: pruebas de navegación y de `LayoutService` en verde y sección 5 de `quickstart.md`.

### Pruebas de la Historia 4

- [X] T059 [P] [US4] Escribir `frontend/src/app/core/navigation/navigation.spec.ts`: `APP_NAVIGATION` contiene "Inicio" (`/home`) y "Configuración" con "Academia" (`/settings/academy`) y "Sedes" (`/settings/venues`), y ninguna ruta bajo `/dev`
- [X] T060 [P] [US4] Escribir `frontend/src/app/layout/service/layout.service.spec.ts`: el modo oscuro se guarda en `localStorage` (clave `playertech.darkTheme`) y se recupera al crear el servicio; si `localStorage` lanza una excepción al leer o escribir, el servicio funciona con el valor por defecto sin propagar el error (FR-032)

### Implementación de la Historia 4

- [X] T061 [US4] Crear `frontend/src/app/core/navigation/navigation.ts` con `NavigationItem` (`label`, `icon`, `routerLink?`, `items?`) y la constante `APP_NAVIGATION: MenuItem[]`: Inicio (`pi pi-home`); Configuración con Academia (`pi pi-building`) y Sedes (`pi pi-map-marker`). Sin entradas de demos (research R12, R13)
- [X] T062 [US4] Modificar `frontend/src/app/layout/component/app.menu.ts` para que el modelo sea `[...APP_NAVIGATION, ...(environment.production ? [] : DEV_NAVIGATION)]` (con `DEV_NAVIGATION` de la Historia 6; mientras no exista, solo `APP_NAVIGATION`) en lugar de la lista fija de Sakai
- [X] T063 [US4] Modificar `frontend/src/app/layout/component/app.topbar.ts`: marca en texto "PlayerTech" (sin el SVG de Sakai) con enlace a `/home`; nombre de la academia desde `AcademyContextService.academy()?.name`; botón claro/oscuro con `aria-label` "Cambiar a modo oscuro" / "Cambiar a modo claro"; menú de usuario con `p-menu` emergente (botón con las iniciales del correo y `aria-label` "Menú de usuario") con la opción "Cerrar sesión" (`AuthService.signOut()`); retirar `AppConfigurator`, el botón de paleta y los botones Calendar, Messages y Profile (FR-026, FR-027)
- [X] T064 [US4] Modificar `frontend/src/app/layout/service/layout.service.ts` hasta que T060 pase: configuración inicial con `primary: 'blue'` y `menuMode: 'static'`; leer y guardar `darkTheme` en `localStorage` (clave `playertech.darkTheme`) dentro de `try/catch`, y aplicar la clase `app-dark` al iniciar (FR-028, FR-032)
- [X] T065 [P] [US4] Modificar `frontend/src/app/layout/component/app.footer.ts` para mostrar "PlayerTech"
- [X] T066 [US4] Revisar a 360 px de ancho, con las herramientas del navegador, el layout de la aplicación, el menú desplegable, el menú de usuario y las pantallas de autenticación: sin desplazamiento horizontal (la página no se desplaza a lo ancho), foco visible al navegar con teclado y áreas táctiles de al menos 44 × 44 px (medidas con el inspector de elementos); corregir en los archivos de `layout/` o con utilidades de Tailwind (FR-031, SC-007)
- [X] T067 [US4] Ejecutar `npm run test:ci` y `npm run lint` hasta que T059 y T060 pasen

**Punto de control**: navegación base completa.

---

## Fase 8: Historia 5 — Capa de datos lista para las historias de usuario (Prioridad: P2)

**Objetivo**: Contrato de almacenamiento y verificación de que la arquitectura se respeta.

**Prueba independiente**: pruebas del repositorio de almacenamiento en verde y el `lint` falla ante una importación prohibida.

### Pruebas de la Historia 5

- [ ] T068 [P] [US5] Escribir `frontend/src/app/core/storage/data/supabase-file-storage.repository.spec.ts` con cliente simulado: `upload` construye la clave `{academyId}/{module}/{entityId}/{fileId}.{ext}` con el `academyId` del contexto, sube al bucket indicado y registra la fila en `files`; si el registro falla, retira el objeto y rechaza con `AppError`; `getUrl` usa URL pública en `public-assets` y URL firmada (3600 s por defecto) en `private-files`; `remove` actualiza `deleted_at` (contracts/repositories.md)

### Implementación de la Historia 5

- [ ] T069 [P] [US5] Crear `frontend/src/app/core/storage/data/file-storage.repository.ts` (clase abstracta con `upload`, `getUrl`, `remove` según `contracts/repositories.md`)
- [ ] T070 [US5] Crear `frontend/src/app/core/storage/data/supabase-file-storage.repository.ts` según `contracts/repositories.md` y ADR-013 (id con `crypto.randomUUID()`, extensión a partir del tipo MIME `image/png` → `png`, `image/jpeg` → `jpg`) hasta que T068 pase, y registrarlo en `frontend/src/app.config.ts` con `{ provide: FileStorageRepository, useClass: SupabaseFileStorageRepository }`
- [ ] T071 [US5] Verificar la regla de importaciones: añadir temporalmente `import { createClient } from '@supabase/supabase-js';` en `frontend/src/app/features/home/home.routes.ts`, confirmar que `npm run lint` falla con el mensaje de ADR-002 y retirar la línea (SC-005)
- [ ] T072 [US5] Ejecutar `npm run test:ci` hasta que T068 pase

**Punto de control**: los cuatro contratos del núcleo implementados y verificados.

---

## Fase 9: Historia 6 — Demos de la plantilla solo en desarrollo (Prioridad: P3)

**Objetivo**: `/dev` contiene solo las demos de SakaiNG y nada de ellas llega a producción (FE-02; CA-007 y CA-008 de T-00; FR-037).

**Prueba independiente**: `npm run check:bundle` en verde y sección 6 de `quickstart.md`.

### Implementación de la Historia 6

- [ ] T073 [US6] Crear `frontend/src/app/features/dev/dev.routes.ts` (`DEV_ROUTES`), solo con demos: `dev` bajo `AppLayout` sin guards, con `''` → `Dashboard`, `uikit` → `loadChildren` de `app/pages/uikit/uikit.routes`, `pages` → `loadChildren` de `app/pages/pages.routes`, `documentation` → `Documentation` y `landing` → `Landing` (componentes con `loadComponent`) (research R13)
- [ ] T074 [US6] Crear `frontend/src/app/features/dev/dev-navigation.ts` (`DEV_NAVIGATION: MenuItem[]`): sección "Demos" con "Dashboard de ejemplo" (`/dev`), "Componentes UI" (`/dev/uikit/formlayout`), "Ejemplo de gestión" (`/dev/pages/crud`) y "Documentación de Sakai" (`/dev/documentation`); conectarla en `frontend/src/app/layout/component/app.menu.ts` como indica T062
- [ ] T075 [US6] Añadir a `frontend/src/app.routes.ts` `...(environment.production ? [] : DEV_ROUTES)` antes de la ruta `**` (FR-024)
- [ ] T076 [US6] Crear `frontend/scripts/check-bundle.mjs` y el script `"check:bundle": "node scripts/check-bundle.mjs"` en `frontend/package.json`: recorre `dist/playertech/browser/**/*.js`; extrae con una expresión regular los selectores de los componentes de `src/app/pages/**/*.ts`; falla (código 1) si encuentra en `dist/` alguno de esos selectores, el texto `/dev/` de `DEV_NAVIGATION` o los patrones `service_role`, `sb_secret_` o `SUPABASE_SERVICE`; imprime un resumen con lo revisado (research R14)
- [ ] T077 [US6] Ejecutar `npm run build` y `npm run check:bundle`; confirmar que el bundle inicial es menor de 1 MB y que no hay fragmentos diferidos de las demos (SC-003, SC-004, research R16). Comprobar en desarrollo (`npm start`) que `/dev` muestra las demos

**Punto de control**: producción sin demos ni secretos.

---

## Fase 10: Pulido y validación transversal

**Propósito**: Documentación, validación de punta a punta y cierre de T-00.

- [ ] T078 [P] Corregir el apartado "Layout" de `docs/architecture/frontend.md`: la adopción del layout ya no es una excepción al principio V (Constitución 3.1.0 en adelante, ADR-015); en las rutas "SOLO DESARROLLO", aclarar que `/dev` contiene solo demos y que ninguna funcionalidad de PlayerTech se ubica ahí
- [ ] T079 [P] Actualizar `AGENTS.md` (sección Comandos, bloque de `frontend/`) con `npm run lint`, `npm run test:ci` y `npm run check:bundle`, e indicar Node 24
- [ ] T080 [P] Añadir una nota en `docs/backlog/user-stories/HU-001-*.md`, `HU-014-*.md` y `HU-016-*.md`: "Versión básica de la pantalla construida en la spec 002 (`features/auth/`); esta HU la completa con sus criterios de aceptación y la revisión de diseño de T-01"
- [ ] T081 Ejecutar de punta a punta `specs/002-frontend-foundation/quickstart.md` (secciones 1 a 7) con Supabase local y registrar los resultados en `frontend/README.md` (sección "Validación"); al terminar, `npm run db:reset` en la raíz
- [ ] T082 Revisión básica de experiencia y accesibilidad (principio XIII) de las pantallas construidas: autenticación (login, registro, verificación, recuperación, nueva contraseña), callback, acceso denegado, academia suspendida, página no encontrada, error de contexto y layout de la aplicación. Usar la herramienta de revisión del agente (en Claude Code: `/impeccable audit`) y traducir cualquier ajuste a los tres sitios de estilos de `AGENTS.md`; la revisión de diseño completa queda para T-01
- [ ] T083 Actualizar `docs/backlog/enablers/T-00-saas-foundation.md`: áreas 7 y 8 implementadas (spec `specs/002-frontend-foundation/`), CA-007, CA-008 y CA-009 verificados, y estado "Terminada" si todo pasa

---

## Dependencias y orden de ejecución

### Por fase

- **Fase 1 (Configuración)**: requiere Node 24. Sin otras dependencias.
- **Fase 2 (Fundaciones)**: depende de la Fase 1; **bloquea todas las historias**.
- **Fase 3 (US1)**: depende de la Fase 2. Deja `lint` y `test:ci` funcionando para las demás historias.
- **Fase 4 (US7)**: depende de la Fase 3.
- **Fase 5 (US2)**: depende de la Fase 4 (registra sus pantallas y les añade guards).
- **Fase 6 (US3)**: depende de la Fase 5 (`auth.routes.ts` y pantalla de recuperación).
- **Fase 7 (US4)**: depende de la Fase 5 (`AppLayout` protegido).
- **Fase 8 (US5)**: depende de la Fase 3; independiente de US7 y US2 a US4.
- **Fase 9 (US6)**: depende de las Fases 5 y 7 (rutas y menú).
- **Fase 10 (Pulido)**: depende de todas las historias.

### Dentro de cada historia

Primero las pruebas (deben fallar), después la implementación y por último `npm run test:ci` y `npm run lint`.

## Oportunidades de paralelismo

- Fase 2: T006, T008, T009, T011, T012, T013, T014, T015 y T019; T023 y T024.
- Fase 4: T033 a T036 (pruebas); T037 y T041.
- Fase 5: T045 a T047 (pruebas); T049, T050 y T051.
- La Fase 8 (US5) puede avanzar en paralelo con las Fases 6 y 7.
- Fase 10: T078, T079 y T080.

### Ejemplo de paralelismo en la Historia 7

```text
T033 supabase-legal-documents.repository.spec.ts
T034 login.spec.ts
T035 register.spec.ts
T036 forgot-password.spec.ts y reset-password.spec.ts
```

## Estrategia de implementación

### MVP primero

1. Fases 1 y 2: dependencias y núcleo.
2. Fase 3 (US1): controles de calidad en verde.
3. **Detenerse y validar**: `build`, `lint` y `test:ci` sin errores.

### Entrega incremental (etapas con revisión del responsable)

1. **Etapa 1**: Fases 1 a 3 (núcleo y calidad).
2. **Etapa 2**: Fases 4 a 7 (pantallas de autenticación, acceso protegido, retorno de enlaces y navegación). Al cerrarla, el responsable puede registrarse, verificar su correo, iniciar sesión y recorrer el esqueleto en las rutas reales, también desde el celular.
3. **Etapa 3**: Fases 8 a 10 (almacenamiento, demos solo en desarrollo, validación de punta a punta, revisión de experiencia y cierre de T-00).

## Notas

- `[P]` = archivos distintos y sin dependencias pendientes.
- La integración real con Supabase se valida con `quickstart.md`; las pruebas unitarias usan dobles.
- Ante una contradicción entre las tareas, el plan, la Constitución o los ADR, detenerse y resolverla con el flujo de Spec Kit.
