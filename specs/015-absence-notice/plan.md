# Plan de implementación: Aviso de inasistencia

**Branch**: `015-absence-notice` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Especificación de `/specs/015-absence-notice/spec.md` (Fase 2, spec 5: HU-042)

## Resumen

- **Base de datos** (R1 y R2): una migración con la tabla `player_absences`, que guarda solo ausentes, con borrado lógico al desmarcar. Las funciones `set_absence` y `mark_absence_notified` son del owner, y un trigger garantiza el plazo (del inicio al final del día en Colombia) y que la actividad esté programada.
- **Lista** (R3): con convocatoria, los convocados y sus respuestas, de los repositorios de las specs 012 y 013; sin convocatoria, los grupos elegidos, de la spec 009.
- **Aviso** (R4): un mensaje sugerido y editable que reutiliza el envío por WhatsApp de la spec 012 y marca «Avisado» con la hora del servidor.
- **Frontend** (R5): una feature `absences` con la sección en el detalle de la actividad y dos drawers, la lista y el aviso.
- **Maquetas** antes de las tareas (R6).

## Contexto técnico

**Lenguaje/versión**: TypeScript 5.9 y SQL (PostgreSQL 17); Node 24 LTS

**Dependencias principales**: Angular 21.2, PrimeNG 21.1, Tailwind CSS 4, `@supabase/supabase-js` 2.117.2. **Sin dependencias nuevas.**

**Almacenamiento**: Supabase. Una tabla, dos funciones y un trigger; en la nube con `db:push` tras el merge y con autorización

**Pruebas**: pgTAP nueva (`130-player-absences.test.sql`); Vitest de `features/absences` y del detalle de la actividad. Solo las de la spec

**Plataforma objetivo**: navegadores modernos, móvil primero desde 360 px, uso con una mano en la cancha

**Tipo de proyecto**: SPA Angular sobre BaaS

**Objetivos de rendimiento**: marcar con un toque y actualización optimista; listas de 30 jugadores

**Restricciones**: capas y estilos del proyecto; ADR-017; solo ausencias (DEC-48)

**Escala/alcance**: 1 migración, 1 feature, 1 sección y 2 drawers

## Documentación de referencia obligatoria

La implementación DEBE leer estos documentos antes de empezar y aplicarlos junto con este plan. Ante un conflicto, se aplica la precedencia de `AGENTS.md` y se detiene la implementación hasta resolverlo.

| Documento | Qué se toma de él (y qué no aplica) |
|---|---|
| `.specify/memory/constitution.md` | Principios II, III, IV, VI, VIII, IX y XIII |
| `AGENTS.md` y `CLAUDE.md` | Reglas multi-tenant, capas, estilos, portabilidad, Impeccable, Git, `db:push` |
| HU-042 y EP-15 | Criterios y reglas. **No aplica**: la asistencia formal (Etapa 2) |
| `docs/architecture/decisions.md` | ADR-012, ADR-017 y ADR-018 (DEC-31, DEC-45 y DEC-48) |
| `docs/product/scope.md` | La excepción de DEC-48 en «Asistencia» |
| `docs/engineering/coding-standards.md` y `testing.md` | Claridad sobre brevedad, Prettier, sin `any` ni reglas de lint desactivadas, filas tipadas; proceso de pruebas por spec |
| `docs/architecture/database-schema.md`, `frontend.md`, `ui.md` y `DESIGN.md` | Convenciones, capas, drawers y sistema visual |
| `specs/009-…`, `011-…`, `012-call-ups` y `013-responses-tracking` | Grupos y acudientes, actividades (`colombia-time`), convocados, respuestas, `whatsappChat` y `copyText`, `relationshipLabel` y `fullNameWithNickname` |

## Verificación de la Constitución

| Principio | Estado | Evidencia |
|---|---|---|
| I. SDD | ✅ Cumple | HU-042 Definida (DEC-48) |
| II. Simplicidad | ✅ Cumple | Solo filas de ausentes; el plazo se calcula con la hora de inicio |
| III. Separación de responsabilidades | ✅ Cumple | Feature propia `absences`; el mensaje es una función pura |
| IV. Reutilización controlada | ✅ Cumple | Convocados, respuestas, grupos, acudientes y WhatsApp de las specs 009 a 013 |
| VI. Multi-tenant | ✅ Cumple | `academy_id`, claves compuestas y RLS |
| VIII. Seguridad | ✅ Cumple | Plazo, actividad programada y owner en la base de datos |
| IX. Calidad verificable | ✅ Cumple | pgTAP, Vitest y quickstart |
| XIII. Experiencia de usuario | ✅ Cumple | Maquetas antes de las tareas; uso con una mano |

Revisión tras el diseño: sin cambios. Sin excepciones.

## Estructura del proyecto

```text
specs/015-absence-notice/  plan.md · research.md · data-model.md · quickstart.md · contracts/ · mockups/ · tasks.md
supabase/migrations/20261024100000_player_absences.sql
supabase/tests/database/130-player-absences.test.sql
frontend/src/app/
├── features/absences/            # NUEVA: modelos, repositorio, servicio, mensaje, sección y drawers
└── features/activities/pages/activity-page   # incluye la sección
```
