# Plan de implementación: Base del frontend y esqueleto de PlayerTech

**Branch**: `002-frontend-foundation` | **Date**: 2026-10-16 | **Spec**: [spec.md](./spec.md)

**Input**: Especificación de `/specs/002-frontend-foundation/spec.md` (habilitador T-00, áreas 7 y 8)

## Resumen

Convertir el proyecto `frontend/` (SakaiNG 21) en la base de PlayerTech:
- Reparar los controles de calidad: ESLint 9 con `angular-eslint`, Vitest con el builder oficial de Angular y renombrado del proyecto.
- Conectar Supabase con PKCE y configuración pública por entorno.
- Crear los contratos de autenticación, almacenamiento y contexto de academia con sus implementaciones Supabase.
- Montar el esqueleto: layout adoptado con marca y menú propios, preset de tema, `es-CO`, rutas protegidas por guards, retorno de enlaces de correo, páginas de estado y demos solo en desarrollo.

La regla de importaciones de ESLint y un script sobre el bundle hacen verificables en cada ejecución las reglas de arquitectura y de seguridad.

## Contexto técnico

**Lenguaje/versión**: TypeScript 5.9 (modo estricto) sobre **Node 24 LTS** (R1)

**Dependencias principales**: Angular 21.0, PrimeNG 21.0 con `@primeuix/themes` (Aura), Tailwind CSS 4.1 con `tailwindcss-primeui`, `@supabase/supabase-js` 2.117.2 (R4)

**Almacenamiento**: Supabase local de la spec 001 (PostgreSQL con RLS, Auth y Storage); sesión persistida por el cliente de Supabase en `localStorage`

**Pruebas**: Vitest 4.1.11 con `@angular/build:unit-test` y jsdom 27.4.0 (R3); validación manual con `quickstart.md`

**Plataforma objetivo**: navegadores modernos, móvil primero desde 360 px de ancho

**Tipo de proyecto**: SPA Angular (frontend) sobre BaaS

**Objetivos de rendimiento**: bundle inicial menor de 1 MB (R16); retorno de verificación en menos de 5 s en local (SC-006)

**Restricciones**:
- Sin secretos en el cliente.
- Componentes y servicios sin el SDK de Supabase.
- Estilos solo por preset, Tailwind y SCSS del layout (`AGENTS.md`).
- Demos de SakaiNG intactas.

**Escala/alcance**:
- Unas 15 rutas y 3 guards.
- 3 repositorios abstractos con su implementación.
- 4 pantallas funcionales (callback, acceso denegado, suspendida, 404) más el inicio de sesión de desarrollo.

## Documentación de referencia obligatoria

La implementación DEBE leer estos documentos antes de empezar y aplicarlos junto con este plan. Ante un conflicto, se aplica la precedencia de `AGENTS.md` y se detiene la implementación hasta resolverlo.

| Documento | Qué se toma de él (y qué no aplica) |
|---|---|
| `.specify/memory/constitution.md` | Principios II (simplicidad), III (separación de responsabilidades), V (layout adoptado y demos de referencia; estilos por tokens), VIII (sin secretos en el cliente), IX (pruebas), XIII (móvil primero y accesibilidad) |
| `AGENTS.md` | Reglas de estilos (los tres sitios permitidos y lo prohibido), capas del frontend, idioma y Git |
| `docs/architecture/decisions.md` | ADR-002 (repositorios), ADR-009 (capas del frontend), ADR-013 (almacenamiento portable), ADR-014 (Auth: verificación, recuperación y JWT; **no** el temporizador de inactividad, que es de HU-015), ADR-015 (FE-01 a FE-14), ADR-016 (plan de Supabase y entorno local) |
| `docs/architecture/frontend.md` | Estructura de carpetas, tabla de rutas, guards, acceso a datos, autenticación y manejo de errores. **Desactualizado**: el apartado "Layout" que describe la adopción como excepción al principio V se corrige en esta spec |
| `docs/architecture/ui.md` | Configuración visual, arquitectura de información (menú lateral y menú de usuario) y patrón de layout de autenticación. **No aplica**: patrón de página de gestión ni la tarjeta de inicio (HU-029 a HU-032) |
| `docs/engineering/coding-standards.md` | Organización por feature, responsabilidades de componentes y servicios, TypeScript y nombres |
| `docs/engineering/testing.md` | Niveles unitario y de componentes con Vitest. **No aplica**: Playwright (Fase 2) |
| `docs/engineering/security.md` | Autenticación, autorización por membresía, secretos y validación |
| `docs/engineering/sakai-upstream.md` | Cómo modificar el layout adoptado preservando la posibilidad de integrar actualizaciones |
| `docs/engineering/git.md` | Ramas y commits |
| `docs/product/glossary.md` | Vocabulario de los textos de la interfaz |
| `specs/001-database-foundation/contracts/` | Metadatos del registro, acceso por tabla, funciones y claves de almacenamiento que consumen los repositorios |
| `supabase/README.md` | Uso del entorno local y usuarios de prueba |

## Verificación de la Constitución

*Puerta: debe cumplirse antes de la Fase 0 y revisarse tras la Fase 1.*

| Principio | Estado | Evidencia |
|---|---|---|
| I. SDD | ✅ Cumple | La spec proviene del habilitador T-00 (áreas 7 y 8) y referencia CA-007 a CA-009 |
| II. Simplicidad | ✅ Cumple | Herramientas oficiales (builder de Vitest de Angular, schematic de `angular-eslint`); sin librerías de estado ni de i18n; Angular Testing Library se pospone (R3); sin RPC nueva para el contexto (R6) |
| III. Separación de responsabilidades | ✅ Cumple | Página → servicio → repositorio abstracto → implementación Supabase; regla de importaciones en ESLint (R2) |
| IV. Reutilización controlada | ✅ Cumple | Se adopta el layout existente; no se crean componentes que reemplacen a PrimeNG |
| V. Base tecnológica | ✅ Cumple | Layout adoptado modificado en sus archivos; demos intactas y solo en desarrollo; tema por preset (R12) |
| VI. Multi-tenant | ✅ Cumple | El contexto de academia sale de la membresía; ningún `academy_id` de la interfaz (R6) |
| VII. Trazabilidad | ✅ Cumple | T-00 → spec → plan → tareas → código → pruebas |
| VIII. Seguridad | ✅ Cumple | Solo clave publicable; verificación del bundle (R14); los guards no sustituyen a RLS; `next` del callback limitado a rutas internas (R7) |
| IX. Calidad verificable | ✅ Cumple | Pruebas de guards, callback, contexto y errores (FR-033); quickstart |
| X. Documentación | ✅ Cumple | Se corrige `frontend.md`; los contratos enlazan a la spec 001 sin copiarla |
| XI. Spec Kit | ✅ Cumple | Documentación de referencia listada con su alcance |
| XII. Excepciones | ✅ Ninguna | — |
| XIII. Experiencia de usuario | ✅ Cumple | 360 px sin desbordamiento, foco visible, etiquetas y textos en es-CO. La revisión de diseño completa (Impeccable) llega con T-01 y las HU; aquí se hace una revisión básica de experiencia y accesibilidad |

## Estructura del proyecto

### Documentación (esta funcionalidad)

```text
specs/002-frontend-foundation/
├── spec.md
├── plan.md                  # Este archivo
├── research.md              # Fase 0: decisiones R1–R16
├── data-model.md            # Fase 1: modelos de dominio y estados
├── quickstart.md            # Fase 1: guía de validación
├── contracts/
│   ├── repositories.md      # AuthRepository, AcademyContextRepository, FileStorageRepository
│   ├── routes.md            # Rutas, guards y estados de /auth/callback
│   └── app-errors.md        # Códigos y mensajes de error
├── checklists/requirements.md
└── tasks.md                 # Lo genera /speckit-tasks
```

### Código fuente

```text
frontend/
├── .nvmrc                               # Nuevo: 24
├── package.json                         # Renombrado; scripts lint, test, check:bundle; engines
├── angular.json                         # Proyecto playertech; builders unit-test y lint; fileReplacements
├── eslint.config.js                     # Reescrito (R2)
├── scripts/check-bundle.mjs             # Nuevo (R14)
├── src/
│   ├── index.html                       # PlayerTech, lang="es"
│   ├── main.ts
│   ├── app.config.ts                    # Proveedores: router, PrimeNG (preset + es), locale, errores, inicializadores, repositorios
│   ├── app.routes.ts                    # Rutas comunes + DEV_ROUTES condicionales (R13)
│   ├── app.component.ts                 # router-outlet + p-toast
│   ├── environments/                    # Nuevo (R5)
│   └── app/
│       ├── core/
│       │   ├── config/                  # Validación de la configuración (FR-007)
│       │   ├── supabase/                # supabase-client.ts + database.types.ts (spec 001)
│       │   ├── auth/                    # models, data (abstracto + supabase-auth.repository.ts), auth.service.ts, guards/
│       │   ├── academy-context/         # models, data, academy-context.service.ts
│       │   ├── storage/                 # models, data (abstracto + supabase-file-storage.repository.ts)
│       │   ├── errors/                  # app-error.ts, supabase-error.mapper.ts, error-messages.ts, global-error-handler.ts
│       │   ├── i18n/                    # primeng-es.ts
│       │   ├── theme/                   # playertech-preset.ts
│       │   └── navigation/              # navigation.ts
│       ├── shared/components/           # placeholder-page (marcador reutilizado por varias features)
│       ├── features/
│       │   ├── auth/                    # auth-layout, callback, access-denied, suspended, marcadores; auth.routes.ts
│       │   ├── home/                    # marcador
│       │   ├── settings/                # academy y venues: marcadores; settings.routes.ts
│       │   ├── errors/                  # not-found, contexto con error
│       │   └── dev/                     # dev-login; dev.routes.ts (demos + login)
│       ├── layout/                      # Adoptado: topbar, menu, footer, layout.service (R12)
│       └── pages/                       # Demos de SakaiNG, sin cambios
└── README.md                            # Reescrito
supabase/config.toml                     # Redirecciones de Auth ajustadas (contracts/routes.md)
docs/architecture/frontend.md            # Apartado "Layout" corregido
```

**Decisión de estructura:** se respeta `docs/architecture/frontend.md`. `app.config.ts` y `app.routes.ts` siguen en `src/`, donde los dejó SakaiNG, para no alterar el arranque. `shared/components/placeholder-page` se justifica porque lo usan tres features (auth, home y settings), según el principio IV.

## Diseño

### Arranque

```text
main.ts ─► appConfig
  ├─ provideAppInitializer: validar configuración (R5) ─► restaurar sesión (R9)
  ├─ providePrimeNG({ theme: PlayerTechPreset, translation: es })
  ├─ LOCALE_ID es-CO
  ├─ ErrorHandler → GlobalErrorHandler + MessageService
  └─ { provide: AuthRepository, useClass: SupabaseAuthRepository } (y los otros dos)
```

### Navegación protegida

```text
/home ─► authGuard (¿ready? ¿sesión?) ─► membershipGuard (contexto: active | none | suspended | error)
```

Tabla completa en [contracts/routes.md](contracts/routes.md).

### Estrategia de pruebas

| Prueba | Cubre |
|---|---|
| `supabase-error.mapper.spec.ts` | Cada código de [app-errors.md](contracts/app-errors.md) |
| `auth.guard.spec.ts`, `membership.guard.spec.ts`, `guest.guard.spec.ts` | Cada fila de la tabla de guards, con dobles de `AuthService` y `AcademyContextService` |
| `academy-context.service.spec.ts` | Estados `active`, `suspended`, `none`, `error` y `clear` al cerrar sesión, con un repositorio simulado |
| `callback.spec.ts` | Éxito con y sin `next`, `next` externo ignorado, `error` en URL, sin código, otro navegador |
| `supabase-academy-context.repository.spec.ts` | La tabla de deducción de R6, con el cliente simulado |
| `navigation.spec.ts` | Entradas del menú y la sección de desarrollo solo fuera de producción |
| `npm run lint` | Reglas de arquitectura (R2) |
| `npm run check:bundle` | Secretos y demos fuera de producción (R14) |

## Fase 0: Investigación

Ver [research.md](./research.md). Todas las incógnitas quedan resueltas:

| Incógnita | Resolución |
|---|---|
| Versión de Node | R1 — **Node 24 LTS** (requiere acción del responsable) |
| Análisis estático | R2 — `angular-eslint` 21.4.0 con regla de importaciones |
| Pruebas | R3 — Vitest con `@angular/build:unit-test` |
| Cliente y PKCE | R4 — `supabase-js` 2.117.2, intercambio explícito |
| Estado suspendido sin RPC | R6 — deducción por membresía y visibilidad |
| Enlace abierto en otro navegador | R7 — estado `other_browser` |
| Demos fuera de producción | R13 — rama condicional eliminada en compilación |

## Fase 1: Diseño

- [data-model.md](./data-model.md): modelos de dominio, transformaciones y estados.
- [contracts/repositories.md](./contracts/repositories.md), [contracts/routes.md](./contracts/routes.md) y [contracts/app-errors.md](./contracts/app-errors.md).
- [quickstart.md](./quickstart.md): validación de punta a punta.

**Cambios en la spec durante el plan:**
- FR-020 excluye la pantalla de nueva contraseña del `guestGuard`, porque usa la sesión temporal de recuperación.
- Se añade el caso límite del enlace abierto en otro navegador.

## Verificación de la Constitución tras el diseño

Todas las puertas siguen en **Cumple**. El diseño no añade librerías de componentes ni de CSS, mantiene la autorización en la base de datos, conserva las demos intactas y hace automáticas dos reglas que antes dependían de la revisión manual: importaciones del SDK y secretos en el bundle.

## Seguimiento de complejidad

No hay violaciones de la Constitución que justificar.
