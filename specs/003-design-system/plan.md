# Plan de implementación: Sistema de diseño PlayerTech

**Branch**: `003-design-system` | **Date**: 2026-10-17 | **Spec**: [spec.md](./spec.md)

**Input**: Especificación de `/specs/003-design-system/spec.md` (habilitador T-01)

## Resumen

Dar a PlayerTech una identidad visual y de experiencia propia, sin abandonar PrimeNG, el layout de Sakai adoptado ni Tailwind:

1. **Brief y dirección.** `PRODUCT.md` con `/impeccable init`, aprobado por el responsable de producto. Después, 2 o 3 direcciones visuales code-led, en la página de decisión de Impeccable, de las que el responsable de producto elige una (R1, R2).
2. **Tokens.** La dirección se traduce al preset de PlayerTech sobre Aura, en modo claro y oscuro, con tipografía alojada en el proyecto, preferencia del sistema y movimiento reducido (R3 a R6).
3. **Chasis y pantallas modelo.**
   - Chasis: topbar, menú y menú de usuario, más dos componentes compartidos, el encabezado de página y la marca tipográfica (R7).
   - Inicio de sesión y registro: se rediseñan con las observaciones del responsable de producto (R14).
   - Sedes e inicio: viven en sus rutas reales con datos reales de solo lectura; la escritura queda como maqueta (R8, R9).
4. **Correos y documentación.** Correos de confirmación y recuperación en `supabase/templates/` (R10). `DESIGN.md` se documenta desde lo construido y se actualizan `ui.md` y las decisiones (R15).

Las reglas de estilo se comprueban en cada ejecución con ESLint y `check:styles` (R11). Cada pantalla pasa crítica, auditoría y pulido de Impeccable (R12).

## Contexto técnico

**Lenguaje/versión**: TypeScript 5.9 (modo estricto) sobre Node 24 LTS

**Dependencias principales**:
- Angular 21.2, PrimeNG 21.1 con `@primeuix/themes` (Aura), `@angular/cdk` 21.2 (`BreakpointObserver`).
- Tailwind CSS 4 con `tailwindcss-primeui`.
- `@supabase/supabase-js` 2.117.2.
- **Sin dependencias nuevas** de ejecución ni de estilos (R4, R10, R11).

**Almacenamiento**: Supabase local (spec 001). Lecturas de `venues`, `subscriptions` y `plans` bajo RLS; logo por `FileStorageRepository`. Sin migraciones nuevas.

**Pruebas**:
- Vitest 4.1 con Angular Testing Library (`docs/engineering/testing.md`).
- Validación visual y de accesibilidad con Impeccable y puppeteer-core (en el scratchpad) según `quickstart.md`.

**Plataforma objetivo**: navegadores modernos, móvil primero desde 360 px; clientes de correo móviles y de escritorio

**Tipo de proyecto**: SPA Angular sobre BaaS, más plantillas de correo de Supabase Auth

**Objetivos de rendimiento**:
- El bundle inicial no crece más de 50 KB frente a los 919 KB actuales.
- La fuente principal pesa como máximo 60 KB en total (`woff2`, subconjunto latino).
- No hay salto de diseño visible al cargar la fuente.

**Restricciones**:
- Estilos solo por preset, utilidades de Tailwind y SCSS del layout (`AGENTS.md`).
- Sin `!important`, sin estilos en línea y sin selectores `.p-*`.
- Demos de SakaiNG intactas.
- Sin secretos; la capa de datos no cambia de patrón.
- Textos en español de Colombia.

**Escala/alcance**:
- 1 preset y 2 componentes compartidos.
- 2 repositorios de solo lectura.
- 4 pantallas modelo y 8 pantallas de acceso y de estado que adoptan la identidad.
- 2 plantillas de correo y 2 documentos raíz (`PRODUCT.md`, `DESIGN.md`).

## Documentación de referencia obligatoria

La implementación DEBE leer estos documentos antes de empezar y aplicarlos junto con este plan. Ante un conflicto, se aplica la precedencia de `AGENTS.md` y se detiene la implementación hasta resolverlo.

| Documento | Qué se toma de él (y qué no aplica) |
|---|---|
| `.specify/memory/constitution.md` | Principios II (simplicidad: sin dependencias nuevas), III (capas), IV (`shared/` solo con dos usos), V (estilos por tokens, layout adoptado, demos intactas), VI (sin `academy_id` del cliente), IX (pruebas), X (enlazar, no duplicar) y XIII (móvil primero, accesibilidad y revisión de cada pantalla) |
| `AGENTS.md` y `CLAUDE.md` | Los tres sitios de estilos y lo prohibido; uso de Impeccable (comandos de estética fuerte solo si se piden, hooks y telemetría desactivados); idioma; Git |
| `docs/backlog/enablers/T-01-design-system.md` | Brief de marca (usuario, personalidad, referencias y restricciones), alcance y criterios CA-001 a CA-007. **No aplica**: la sección "Herramientas" como lista cerrada; se usan los comandos que pida el flujo de R1 |
| `docs/architecture/decisions.md` | ADR-002 y ADR-009 (repositorios y capas), ADR-003 (PrimeNG sin componentes propios innecesarios), ADR-013 (logo por almacenamiento portable), ADR-014 (correos y PKCE), ADR-015 (FE-06, FE-11 y FE-13) |
| `docs/architecture/ui.md` | Arquitectura de información, patrón de layout de autenticación, patrón de página de gestión y patrón de inicio con tareas pendientes. La sección "Tema" queda **sustituida** por `DESIGN.md` en esta spec |
| `docs/architecture/frontend.md` | Estructura de carpetas (`features/venues/`, `features/home/`, `shared/components/`), rutas y acceso a datos |
| `docs/engineering/sakai-upstream.md` | Cómo modificar el layout adoptado y sus parciales SCSS sin perder la posibilidad de integrar actualizaciones |
| `docs/engineering/coding-standards.md` | Organización por feature, componentes y servicios, nombres |
| `docs/engineering/testing.md` | Pruebas unitarias y de componentes con Vitest. **No aplica**: Playwright (Fase 2) |
| `docs/engineering/security.md` | Lecturas bajo RLS, sin datos de otras academias. **No aplica**: autenticación (sin cambios de comportamiento) |
| `docs/product/vision.md` y `docs/product/glossary.md` | Fuente para `PRODUCT.md` (se enlaza, no se repite) y vocabulario de todos los textos |
| `docs/backlog/user-stories/HU-001`, `HU-014`, `HU-030` y `HU-032` | Origen de las pantallas modelo. Se adelantan solo CA-001 a CA-003 de HU-030 y CA-001 de HU-032 (lectura). **No aplica**: escritura de sedes (HU-029 y HU-031) ni progreso de "Completa tu academia" |
| `specs/001-database-foundation/contracts/database-api.md` | Acceso por tabla para `venues`, `subscriptions`, `plans` y `academies` |
| `specs/002-frontend-foundation/` | Comportamiento y pruebas de las pantallas de acceso que se conservan (FR-015); contratos de rutas y errores. FR-037: nada de PlayerTech bajo `/dev` |
| `.claude/skills/impeccable/SKILL.md` y sus referencias `init.md`, `new-work.md`, `document.md`, `critique.md`, `audit.md`, `polish.md` y `craft-floor.md` | Proceso de R1, modo Operate y suelo de calidad antes de cualquier edición de interfaz |
| `supabase/README.md` | Arranque, reinicio y Mailpit en el entorno local |

## Verificación de la Constitución

*Puerta: debe cumplirse antes de la Fase 0 y revisarse tras la Fase 1.*

| Principio | Estado | Evidencia |
|---|---|---|
| I. SDD | ✅ Cumple | La spec proviene del habilitador T-01 y referencia sus criterios CA-001 a CA-007 |
| II. Simplicidad | ✅ Cumple | Sin dependencias nuevas: la fuente se aloja en el proyecto (R4), los correos son HTML sin herramientas de compilación (R10) y las reglas se comprueban con un script en lugar de Stylelint (R11) |
| III. Separación de responsabilidades | ✅ Cumple | Las lecturas nuevas pasan por página → servicio → repositorio abstracto → implementación Supabase (R9) |
| IV. Reutilización controlada | ✅ Cumple | `page-header` y `brand-mark` van a `shared/` porque los usan dos features; el resto queda en su feature |
| V. Base tecnológica | ✅ Cumple | Identidad por preset, Tailwind y SCSS del layout; `fullScreen` del drawer en lugar de estilos (R8); demos intactas; verificación automática (R11) |
| VI. Multi-tenant | ✅ Cumple | Las lecturas dependen de RLS y el cliente no envía `academy_id` (R9) |
| VII. Trazabilidad | ✅ Cumple | T-01 → spec → plan → tareas → código → pruebas; HU-030 y HU-032 reciben la nota de lectura disponible |
| VIII. Seguridad | ✅ Cumple | Sin escritura nueva; `check:bundle` se mantiene; los correos conservan el flujo PKCE (R10) |
| IX. Calidad verificable | ✅ Cumple | Pruebas nuevas (R13), `check:styles`, mediciones de contraste y áreas táctiles (R12) |
| X. Documentación | ✅ Cumple | `DESIGN.md` es la única fuente del sistema visual; `ui.md` lo enlaza; `PRODUCT.md` enlaza la visión (R15) |
| XI. Spec Kit | ✅ Cumple | Documentación de referencia listada con su alcance |
| XII. Excepciones controladas | ✅ Sin excepciones | El HTML de correo con estilos en línea queda fuera del ámbito de las reglas de la aplicación Angular y se documenta (R10) |
| XIII. Experiencia de usuario | ✅ Cumple | Móvil primero, AA en ambos modos, 44 px, revisión con Impeccable de cada pantalla, textos con el glosario |

**Revisión tras la Fase 1**: el diseño (contratos, modelo de datos y quickstart) no introduce violaciones. La sección de complejidad queda vacía.

## Estructura del proyecto

### Documentación (esta funcionalidad)

```text
specs/003-design-system/
├── plan.md              # Este archivo
├── research.md          # Fase 0 (R1 a R15)
├── data-model.md        # Fase 1: modelos de lectura y artefactos de diseño
├── quickstart.md        # Fase 1: guía de validación
├── contracts/
│   ├── repositories.md  # VenueRepository y HomeSummaryRepository
│   ├── ui-contracts.md  # Encabezado, marca, listado adaptable, maqueta y tokens obligatorios
│   └── email-templates.md
├── checklists/requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks)
```

### Código fuente (raíz del repositorio)

```text
PRODUCT.md                               # Nuevo (R1)
DESIGN.md                                # Nuevo, documentado al final (R1, R15)
.gitignore                               # Muestras de dirección de Impeccable (R2)
supabase/
├── config.toml                          # Plantillas confirmation y recovery (R10)
└── templates/
    ├── confirmation.html                # Nuevo
    └── recovery.html                    # Nuevo
frontend/
├── eslint.config.js                     # template/no-inline-styles (R11)
├── package.json                         # Script check:styles
├── scripts/check-styles.mjs             # Nuevo (R11)
├── public/fonts/                        # woff2 y licencia (R4)
└── src/
    ├── index.html                       # Sin cdnfonts; preload de la fuente
    ├── assets/
    │   ├── styles.scss                  # @font-face
    │   ├── tailwind.css                 # @theme: familia tipográfica
    │   └── layout/                      # _core, _typography, _topbar, _menu, _main, _responsive, variables/
    └── app/
        ├── core/theme/playertech-preset.ts       # Preset completo (R3)
        ├── layout/
        │   ├── component/app.topbar.ts, app.menu.ts, app.menuitem.ts, app.sidebar.ts
        │   └── service/layout.service.ts          # Preferencia del sistema (R5)
        ├── shared/components/
        │   ├── page-header/                       # Nuevo (R7)
        │   └── brand-mark/                        # Nuevo (R7)
        └── features/
            ├── auth/                              # Rediseño de las 8 pantallas y del layout de acceso
            ├── errors/                            # 404 y error de contexto con la identidad
            ├── home/
            │   ├── home.routes.ts                 # Sustituye el placeholder
            │   ├── pages/home-page/               # Nuevo
            │   ├── services/home-summary.service.ts # Nuevo
            │   ├── models/home-summary.models.ts  # Nuevo
            │   └── data/home-summary.repository.ts, supabase-home-summary.repository.ts
            ├── venues/
            │   ├── venues.routes.ts               # Nuevo; lo carga settings.routes.ts
            │   ├── pages/venues-page/             # Nuevo: tabla, filas regladas, drawer de maqueta
            │   ├── services/venues.service.ts     # Nuevo
            │   ├── models/venue.models.ts         # Nuevo
            │   └── data/venue.repository.ts, supabase-venue.repository.ts
            └── settings/settings.routes.ts        # venues → features/venues
```

**Decisión de estructura**: Se sigue la estructura de `docs/architecture/frontend.md`. Sedes pasa a su propia feature (`features/venues/`), como ya prevé ese documento, y `settings.routes.ts` solo la monta. El layout adoptado se modifica en sus propios archivos y parciales. No se crean hojas de estilos paralelas.

## Orden de trabajo y puntos de decisión

| Etapa | Contenido | Decide el responsable de producto |
|---|---|---|
| 1 | `PRODUCT.md` con `/impeccable init` (US1) | **Aprueba el brief** |
| 2 | Direcciones visuales en la página de decisión (US2) | **Elige la dirección** |
| 3 | Preset, tipografía, modos, movimiento y reglas automáticas (US3) | — |
| 4 | Chasis, encabezado y marca (US4) | — |
| 5 | Inicio de sesión y registro con sus observaciones; demás pantallas de acceso y de estado (US5) | **Aporta las observaciones** de experiencia (R14) |
| 6 | Sedes e inicio con datos reales y patrones móviles (US5, US6) | — |
| 7 | Correos (US7) | — |
| 8 | `DESIGN.md`, `ui.md`, decisiones, crítica, auditoría y pulido finales | **Revisa las pantallas modelo** |

## Complejidad

Sin violaciones de la Constitución que justificar.
