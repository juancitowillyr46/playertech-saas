# Plan de implementación: Jugadores, acudientes y grupos

**Branch**: `009-players-guardians-groups` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Especificación de `/specs/009-players-guardians-groups/spec.md` (Fase 2, spec 1: HU-002, HU-003, HU-033, HU-004 y HU-034)

## Resumen

Primera spec de negocio. Tiene dos partes:

- **Base de datos** (R1 a R5): una migración con cinco tablas nuevas, `players`, `groups`, `group_members`, `guardians` y `guardian_links`, con `academy_id`, RLS por owner, auditoría y borrado lógico (ADR-012).
  - La función `current_user_id()` (ADR-017) evita usos nuevos de `auth.uid()`.
  - La normalización de nombres (sin tildes ni mayúsculas) garantiza en la base de datos que no haya jugadores duplicados (DEC-42).
  - Dos funciones SQL: `find_player_by_identity` (ofrecer actualizar al existente) y `add_player_guardian` (vincular sin duplicar a la persona, con la autorización de datos registrada en el servidor, DEC-39).
  - Pruebas pgTAP con aislamiento.
- **Frontend** (R6 a R9): features `players` (jugadores y sus acudientes) y `groups`, con el patrón de Sedes (spec 004). **Antes de implementar**, maquetas de baja fidelidad para la aprobación del responsable (FR-016, R9), incluida la navegación.

## Contexto técnico

**Lenguaje/versión**: TypeScript 5.9 y SQL (PostgreSQL 17); Node 24 LTS

**Dependencias principales**: Angular 21.2, PrimeNG 21.1 (preset PlayerTech), Tailwind CSS 4, `@supabase/supabase-js` 2.117.2, extensión `unaccent` de PostgreSQL. **Sin dependencias nuevas de npm.**

**Almacenamiento**: Supabase (local, y la nube de pruebas con `db:push` tras el merge): cinco tablas nuevas y dos funciones (R1 a R5)

**Pruebas**: pgTAP nuevas (`070-players-groups-guardians.test.sql`: esquema, reglas, duplicados, aislamiento, sin borrado físico) y las existentes; Vitest de repositorios, servicios y páginas de las features nuevas; quickstart contra Supabase local. Solo las pruebas de la spec (decisión del responsable)

**Plataforma objetivo**: navegadores modernos, móvil primero desde 360 px

**Tipo de proyecto**: SPA Angular sobre BaaS

**Objetivos de rendimiento**: listado y búsqueda fluidos con 200 jugadores (SC-002): una sola consulta con los grupos y el conteo de acudientes, y búsqueda en el cliente

**Restricciones**: capas página → servicio → repositorio abstracto → implementación Supabase; academia del contexto, validada por RLS; ADR-017 (portabilidad); estilos solo por preset, Tailwind y layout; textos en español de Colombia

**Escala/alcance**: 1 migración (5 tablas y 2 funciones de negocio), 2 features, unas 5 pantallas

## Documentación de referencia obligatoria

La implementación DEBE leer estos documentos antes de empezar y aplicarlos junto con este plan. Ante un conflicto, se aplica la precedencia de `AGENTS.md` y se detiene la implementación hasta resolverlo.

| Documento | Qué se toma de él (y qué no aplica) |
|---|---|
| `.specify/memory/constitution.md` | Principios II, III, IV, VI (multi-tenant), VIII (reglas en la base de datos), IX y XIII |
| `AGENTS.md` y `CLAUDE.md` | Reglas multi-tenant, capas, estilos, portabilidad, revisión con Impeccable, Git, `db:push` |
| HU-002, HU-003, HU-033, HU-004 y HU-034 | Criterios y reglas. **No aplica**: lo marcado para la spec 4 en HU-034 |
| `docs/architecture/decisions.md` | ADR-012 (DEC-27), ADR-017 (portabilidad), ADR-018 (DEC-30, DEC-31, DEC-35, DEC-36, DEC-39, DEC-40, DEC-42) |
| `docs/architecture/database-schema.md` y `supabase-migrations-guide.md` | Convenciones de tablas, migraciones y documentación del esquema (se amplía) |
| `docs/architecture/frontend.md` y `ui.md` | Estructura de features; patrón de página de gestión, ficha y navegación |
| `DESIGN.md` | Sistema visual Planilla |
| `specs/004-venues-management/` | Patrón de repositorio, servicio, página, errores y refresco |
| `specs/001-database-foundation/` | Funciones de autorización, aceptaciones legales, pruebas pgTAP |
| `docs/engineering/testing.md`, `coding-standards.md` y `security.md` | Pruebas, snake_case y camelCase, validación en el servidor |
| `docs/product/glossary.md` | Vocabulario: jugador, acudiente, grupo, parentesco |

## Verificación de la Constitución

*Puerta: debe cumplirse antes de la Fase 0 y revisarse tras la Fase 1.*

| Principio | Estado | Evidencia |
|---|---|---|
| I. SDD | ✅ Cumple | Cinco HU Definidas de un mismo tramo del flujo |
| II. Simplicidad | ✅ Cumple | Integrantes con borrado físico (relación sin historia, R2); búsqueda en el cliente; funciones SQL solo donde hay atomicidad o normalización |
| III. Separación de responsabilidades | ✅ Cumple | Repositorios abstractos e implementaciones Supabase por feature |
| IV. Reutilización controlada | ✅ Cumple | Validador de celular en `shared/forms` (lo usan jugadores y acudientes) |
| V. Base tecnológica | ✅ Cumple | PrimeNG y el preset existente |
| VI. Multi-tenant | ✅ Cumple | `academy_id` en todas las tablas, claves compuestas que impiden mezclar academias, RLS con las funciones de autorización |
| VII. Trazabilidad | ✅ Cumple | Matriz en `contracts/acceptance-coverage.md` |
| VIII. Seguridad | ✅ Cumple | Duplicados, formatos y permisos en la base de datos; autorización de datos registrada en el servidor |
| IX. Calidad verificable | ✅ Cumple | pgTAP nuevas, Vitest y quickstart |
| X. Documentación | ✅ Cumple | `database-schema.md` ampliado; HU cerradas al terminar |
| XI. Spec Kit | ✅ Cumple | Documentación de referencia listada |
| XII. Excepciones | ✅ Justificada | `group_members` usa borrado físico (R2): es una relación sin historia; registrado en Complejidad |
| XIII. Experiencia de usuario | ✅ Cumple | Maquetas aprobadas antes de implementar (R9); revisión con Impeccable |

**Revisión tras la Fase 1**: sin violaciones; una excepción justificada (abajo).

## Estructura del proyecto

### Documentación (esta funcionalidad)

```text
specs/009-players-guardians-groups/
├── plan.md
├── research.md                   # R1 a R9
├── data-model.md                 # Tablas, restricciones, RLS
├── quickstart.md
├── contracts/
│   ├── database.md               # Tablas, permisos y funciones SQL
│   ├── repositories.md           # Repositorios y servicios del frontend
│   ├── ui-contracts.md           # Pantallas (aprobadas: navegación B y drawers)
│   └── acceptance-coverage.md
├── mockups/                      # Maquetas aprobadas (R9)
├── checklists/requirements.md
└── tasks.md
```

### Código fuente

```text
supabase/
├── migrations/20261018100000_players_groups_guardians.sql
└── tests/database/070-players-groups-guardians.test.sql
frontend/src/app/
├── core/supabase/database.types.ts        # Regenerado (db:types)
├── core/navigation/navigation.ts          # Jugadores y Grupos (según maquetas)
├── shared/forms/phone.validator.ts        # Celular colombiano
└── features/
    ├── players/   (models, data, services, pages: players-page, player-page, player-form, guardians)
    └── groups/    (models, data, services, pages: groups-page, group-page)
docs/architecture/database-schema.md       # Tablas nuevas
```

**Decisión de estructura**: `players` agrupa jugadores y acudientes, porque los acudientes se gestionan desde la ficha del jugador; `groups` es su propia feature, como `venues`.

## Complejidad

| Excepción | Por qué es necesaria | Alternativa más simple descartada |
|---|---|---|
| `group_members` con borrado físico en lugar de lógico (DEC-27) | Es una relación sin historia: quitar a un jugador de un grupo no tiene valor de auditoría en el MVP, y el borrado lógico obligaría a índices parciales y filtros en cada consulta de integrantes | Borrado lógico en la relación: más complejidad sin requisito que la pida. Las tablas de negocio (`players`, `groups`, `guardians`, `guardian_links`) sí usan borrado lógico |
