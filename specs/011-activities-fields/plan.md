# Plan de implementación: Actividades y canchas externas

**Branch**: `011-activities-fields` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Especificación de `/specs/011-activities-fields/spec.md` (Fase 2, spec 2: HU-005, HU-006, HU-036 y HU-037)

## Resumen

- **Base de datos** (R1 a R4): una migración con dos tablas, `external_fields` y `activities`, con `academy_id`, RLS por owner, auditoría y borrado lógico (ADR-012).
  - El lugar es una sede **o** una cancha, con claves compuestas que impiden mezclar academias.
  - **La regla «una actividad pasada no se modifica» va en la base de datos**, en un trigger, igual que «no crear en el pasado».
- **Repetición** (R5): el frontend calcula las fechas en la zona de Colombia y las inserta en **una sola petición**, así que se guardan todas o ninguna.
- **Frontend** (R6 y R7): una feature `activities` con el patrón de las specs 004 y 009 (`FormDrawer`). Actividades entra en la barra inferior. **Maquetas antes de implementar** (R8), incluida la ubicación del catálogo de canchas.

## Contexto técnico

**Lenguaje/versión**: TypeScript 5.9 y SQL (PostgreSQL 17); Node 24 LTS

**Dependencias principales**: Angular 21.2, PrimeNG 21.1 (preset PlayerTech), Tailwind CSS 4, `@supabase/supabase-js` 2.117.2. **Sin dependencias nuevas.**

**Almacenamiento**: Supabase. Dos tablas nuevas y dos triggers; en la nube con `db:push` tras el merge y con autorización

**Pruebas**: pgTAP nueva (`090-activities-fields.test.sql`); Vitest de `features/activities` y de las utilidades nuevas. Solo las pruebas de la spec

**Plataforma objetivo**: navegadores modernos, móvil primero desde 360 px

**Tipo de proyecto**: SPA Angular sobre BaaS

**Objetivos de rendimiento**: listado fluido con 200 actividades: se cargan las próximas o las pasadas según el filtro, en una sola consulta con el lugar embebido

**Restricciones**: capas página → servicio → repositorio abstracto → implementación Supabase; ADR-017 (`current_user_id()`); estilos solo por preset, Tailwind y layout; horas de Colombia (UTC−5, sin horario de verano)

**Escala/alcance**: 1 migración (2 tablas y 2 triggers), 1 feature, unas 5 pantallas o drawers

## Documentación de referencia obligatoria

La implementación DEBE leer estos documentos antes de empezar y aplicarlos junto con este plan. Ante un conflicto, se aplica la precedencia de `AGENTS.md` y se detiene la implementación hasta resolverlo.

| Documento | Qué se toma de él (y qué no aplica) |
|---|---|
| `.specify/memory/constitution.md` | Principios II, III, IV, VI, VIII, IX y XIII |
| `AGENTS.md` y `CLAUDE.md` | Reglas multi-tenant, capas, estilos, portabilidad, Impeccable, Git, `db:push` |
| HU-005, HU-006, HU-036 y HU-037 | Criterios y reglas. **No aplica**: lo que remite a la spec 3 |
| `docs/architecture/decisions.md` | ADR-012, ADR-017 y ADR-018 (DEC-32, DEC-35, DEC-44) |
| `docs/architecture/database-schema.md` | Convenciones; se amplía con las tablas nuevas |
| `docs/architecture/ui.md` y `DESIGN.md` | Patrón de página de gestión, drawers, navegación (se actualiza) |
| `specs/004-venues-management/` | Las sedes como lugar: `venues` con `is_active` y `deleted_at` |
| `specs/009-players-guardians-groups/` | Código base: `FormDrawer`, `searchKey`, `todayInColombia`, `supabase-client-mock`, pestañas de `PlayersShell` |
| `docs/engineering/testing.md` | Pruebas |

## Verificación de la Constitución

*Puerta: debe cumplirse antes de la Fase 0 y revisarse tras la Fase 1.*

| Principio | Estado | Evidencia |
|---|---|---|
| I. SDD | ✅ Cumple | Cuatro HU Definidas (DEC-44) |
| II. Simplicidad | ✅ Cumple | Repetición como inserción múltiple, sin tabla de series ni reglas de recurrencia; una sola columna de instante por hora |
| III. Separación de responsabilidades | ✅ Cumple | Repositorios abstractos para actividades y canchas |
| IV. Reutilización controlada | ✅ Cumple | `FormDrawer`, `searchKey`, `todayInColombia`; utilidades de hora de Colombia en `shared/text` (dos usos: actividades y, en la spec 3, la convocatoria) |
| VI. Multi-tenant | ✅ Cumple | `academy_id`, claves compuestas hacia sedes y canchas, RLS |
| VIII. Seguridad | ✅ Cumple | Fecha pasada, horas coherentes, lugar único y vigente, actividad pasada inmutable: en la base de datos |
| IX. Calidad verificable | ✅ Cumple | pgTAP, Vitest y quickstart |
| X. Documentación | ✅ Cumple | `database-schema.md` y `ui.md` se actualizan |
| XIII. Experiencia de usuario | ✅ Cumple | Maquetas aprobadas antes de implementar; revisión con Impeccable |

**Revisión tras la Fase 1**: sin violaciones ni excepciones.

## Estructura del proyecto

### Documentación (esta funcionalidad)

```text
specs/011-activities-fields/
├── plan.md
├── research.md               # R1 a R8
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── database.md
│   ├── repositories.md
│   ├── ui-contracts.md       # Aprobado (opción A)
│   └── acceptance-coverage.md
├── mockups/
├── checklists/requirements.md
└── tasks.md
```

### Código fuente

```text
supabase/
├── migrations/20261018120000_activities_fields.sql
└── tests/database/090-activities-fields.test.sql
frontend/src/app/
├── core/supabase/database.types.ts                   # Regenerado
├── core/navigation/navigation.ts                     # Actividades
├── shared/text/colombia-time.ts                      # Fecha y hora de Colombia ⇄ instante
└── features/activities/
    ├── models, data (activity y external-field), services
    ├── components (activity-form-drawer, external-field-drawer)
    ├── pages (activities-shell, activities-page, activity-page, fields-page)
    └── activities.routes.ts
docs/architecture/database-schema.md, docs/architecture/ui.md
```

## Complejidad

Sin excepciones a la Constitución.
