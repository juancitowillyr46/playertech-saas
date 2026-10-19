# Plan de implementación: Asignar acudientes ya registrados

**Branch**: `010-guardian-assignment` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Especificación de `/specs/010-guardian-assignment/spec.md` (ajuste de la spec 009: HU-035; DEC-43 y DEC-39 ajustada)

## Resumen

Ajuste pequeño sobre la spec 009. Tiene dos partes:

- **Base de datos** (R1 a R3): una migración que mueve la autorización de datos de `guardian_links` a `guardians`, trasladando la del primer vínculo de cada acudiente.
  - Una función nueva, `assign_guardians`, asigna uno o varios acudientes existentes a un jugador: los vínculos nacen validados, se omiten los repetidos y se hace en una sola operación.
  - `add_player_guardian` se ajusta: la autorización se guarda en la persona nueva.
- **Frontend** (R4 y R5):
  - el drawer «Agregar acudiente» abre primero la lista de acudientes de la academia, con buscador;
  - un drawer nuevo, «Copiar acudientes de un hermano»;
  - todo dentro de la feature `players`, con el armazón `form-drawer` de la spec 009.
  - **Maquetas antes de implementar** (R6).

## Contexto técnico

**Lenguaje/versión**: TypeScript 5.9 y SQL (PostgreSQL 17); Node 24 LTS

**Dependencias principales**: Angular 21.2, PrimeNG 21.1 (preset PlayerTech), Tailwind CSS 4, `@supabase/supabase-js` 2.117.2. **Sin dependencias nuevas.**

**Almacenamiento**: Supabase. Una migración que altera `guardians` y `guardian_links`, crea una función y ajusta otra. Se aplica en local y, tras el merge y con autorización, en la nube con `db:push`, porque **la nube ya tiene datos de la spec 009**, que se trasladan

**Pruebas**: pgTAP nueva (`080-guardian-assignment.test.sql`) y ajuste de `070` (las columnas de autorización cambian de tabla); Vitest de las piezas nuevas y de las modificadas de `features/players`. Solo las pruebas de la spec

**Plataforma objetivo**: navegadores modernos, móvil primero desde 360 px

**Tipo de proyecto**: SPA Angular sobre BaaS

**Objetivos de rendimiento**: lista y búsqueda fluidas con 300 acudientes (una consulta, búsqueda en el cliente)

**Restricciones**: capas página → servicio → repositorio abstracto → implementación Supabase; ADR-017 (`current_user_id()`); estilos solo por preset, Tailwind y layout

**Escala/alcance**: 1 migración, 1 función nueva y 1 ajustada; 2 drawers nuevos; cambios en la ficha del jugador

## Documentación de referencia obligatoria

La implementación DEBE leer estos documentos antes de empezar y aplicarlos junto con este plan. Ante un conflicto, se aplica la precedencia de `AGENTS.md` y se detiene la implementación hasta resolverlo.

| Documento | Qué se toma de él (y qué no aplica) |
|---|---|
| `.specify/memory/constitution.md` | Principios II, III, IV, VI, VIII, IX y XIII |
| `AGENTS.md` y `CLAUDE.md` | Reglas multi-tenant, capas, estilos, portabilidad, Impeccable, Git, `db:push` |
| HU-035 y HU-034 | Criterios y reglas. **No aplica**: lo marcado para la spec 4 |
| `docs/architecture/decisions.md` | ADR-012, ADR-017 y ADR-018 (DEC-39 ajustada, DEC-40, DEC-43) |
| `docs/architecture/database-schema.md` | Sección de la spec 009 (se actualiza: la autorización pasa a `guardians`) |
| `docs/architecture/ui.md` y `DESIGN.md` | Patrón de drawer y sistema visual Planilla |
| `specs/009-players-guardians-groups/` | Modelo, contratos y código base: `add_player_guardian`, `GuardianRepository`, `PlayerDetailService`, `GuardianDrawer`, `FormDrawer` |
| `docs/engineering/testing.md` y `deployment.md` | Pruebas; `db:push` con datos existentes |

## Verificación de la Constitución

*Puerta: debe cumplirse antes de la Fase 0 y revisarse tras la Fase 1.*

| Principio | Estado | Evidencia |
|---|---|---|
| I. SDD | ✅ Cumple | HU-035 Definida, DEC-43 registrada |
| II. Simplicidad | ✅ Cumple | Una sola función sirve para asignar uno o varios (A y B); la búsqueda reutiliza `searchKey` y la lista de jugadores ya existente |
| III. Separación de responsabilidades | ✅ Cumple | Métodos nuevos en `GuardianRepository` y `PlayerDetailService` |
| IV. Reutilización controlada | ✅ Cumple | `FormDrawer`, `searchKey`, `RELATIONSHIP_LABELS` y `shortName` existentes |
| VI. Multi-tenant | ✅ Cumple | `assign_guardians` comprueba que el jugador y los acudientes son de la academia del owner |
| VIII. Seguridad | ✅ Cumple | Vínculos sin duplicar y autorización obligatoria en la base de datos |
| IX. Calidad verificable | ✅ Cumple | pgTAP (incluido el traslado de datos) y Vitest |
| X. Documentación | ✅ Cumple | `database-schema.md` y contratos de la spec 009 se actualizan |
| XIII. Experiencia de usuario | ✅ Cumple | Maquetas aprobadas antes de implementar; revisión con Impeccable |

**Revisión tras la Fase 1**: sin violaciones ni excepciones nuevas.

## Estructura del proyecto

### Documentación (esta funcionalidad)

```text
specs/010-guardian-assignment/
├── plan.md
├── research.md               # R1 a R6
├── data-model.md             # Cambios de guardians y guardian_links
├── quickstart.md
├── contracts/
│   ├── database.md           # assign_guardians, add_player_guardian ajustada, traslado
│   ├── repositories.md       # Métodos nuevos
│   ├── ui-contracts.md       # Drawers (aprobados)
│   └── acceptance-coverage.md
├── mockups/                  # Maquetas aprobadas (R6)
├── checklists/requirements.md
└── tasks.md
```

### Código fuente

```text
supabase/
├── migrations/20261018110000_guardian_consent_and_assignment.sql
└── tests/database/080-guardian-assignment.test.sql   (+ ajuste de 070)
frontend/src/app/
├── core/supabase/database.types.ts                   # Regenerado
└── features/players/
    ├── data/guardian.repository.ts, supabase-guardian.repository.ts   # listGuardians, assign
    ├── services/player-detail.service.ts                              # opciones, hermanos, asignar
    ├── components/guardian-picker-drawer/                             # Lista con buscador (A)
    ├── components/copy-guardians-drawer/                              # Copiar de un hermano (B)
    └── pages/player-page/                                             # Abre los drawers
docs/architecture/database-schema.md
```

## Complejidad

Sin excepciones a la Constitución.
