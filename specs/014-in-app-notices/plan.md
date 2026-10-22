# Plan de implementación: Avisos en la aplicación

**Branch**: `014-in-app-notices` | **Date**: 2026-10-21 | **Spec**: [spec.md](./spec.md)

**Input**: Especificación de `/specs/014-in-app-notices/spec.md` (Fase 2, spec 4b: HU-041)

## Resumen

- **Base de datos** (R1 y R2): una migración con:
  - la tabla `call_up_visits`, una visita por usuario y convocatoria;
  - la función `mark_call_up_seen`;
  - dos vistas con `security_invoker`: `guardian_pending_reviews` (todos los pendientes de la academia, la misma regla de la spec 013) y `call_up_new_responses` (respuestas de acudientes posteriores a la visita del usuario).
- **Contador** (R3): `core/notices` tiene un repositorio abstracto y un servicio raíz. Se actualiza al navegar (como máximo cada 30 segundos), al volver a la pestaña y tras validar. La barra inferior y el menú lateral muestran un `p-badge` en «Inicio» (ajuste del 2026-10-22).
- **Inicio y drawer** (R4): la sección «Avisos» va arriba del resumen. El drawer de pendientes, agrupados por jugador, vive en `features/players` y reutiliza `GuardianRepository.review`.
- **Visto** (R5): `CallUpService.load` marca la convocatoria como vista y refresca los avisos.
- **Maquetas** antes de las tareas (R6).

## Contexto técnico

**Lenguaje/versión**: TypeScript 5.9 y SQL (PostgreSQL 17); Node 24 LTS

**Dependencias principales**: Angular 21.2, PrimeNG 21.1 (`p-badge`), Tailwind CSS 4, `@supabase/supabase-js` 2.117.2. **Sin dependencias nuevas.**

**Almacenamiento**: Supabase. Una tabla, una función y dos vistas; en la nube con `db:push` tras el merge y con autorización

**Pruebas**: pgTAP nueva (`120-in-app-notices.test.sql`); Vitest de `core/notices`, de la navegación (`layout`), del inicio, del drawer y de los cambios en `call-ups` y `players`. Solo las de la spec

**Plataforma objetivo**: navegadores modernos, móvil primero desde 360 px

**Tipo de proyecto**: SPA Angular sobre BaaS

**Objetivos de rendimiento**: el contador es un `count` y se lee como máximo cada 30 segundos al navegar; el inicio, dos lecturas

**Restricciones**: capas y estilos del proyecto; el layout solo depende de `core`; ADR-017; sin Realtime (DEC-46)

**Escala/alcance**: 1 migración, 1 servicio de core, cambios en el layout, el inicio, `call-ups` y `players`, 1 drawer nuevo

## Documentación de referencia obligatoria

La implementación DEBE leer estos documentos antes de empezar y aplicarlos junto con este plan. Ante un conflicto, se aplica la precedencia de `AGENTS.md` y se detiene la implementación hasta resolverlo.

| Documento | Qué se toma de él (y qué no aplica) |
|---|---|
| `.specify/memory/constitution.md` | Principios II, III, IV, VI, VIII, IX, XII y XIII |
| `AGENTS.md` y `CLAUDE.md` | Reglas multi-tenant, capas, estilos, portabilidad, Impeccable, Git, `db:push` |
| HU-041 | Criterios y reglas |
| `docs/architecture/decisions.md` | ADR-012, ADR-017 y ADR-018 (DEC-41, DEC-46 y DEC-47). **No aplica**: push (T-03) |
| `docs/engineering/coding-standards.md` y `testing.md` | Claridad sobre brevedad, Prettier, sin `any` ni reglas de lint desactivadas, filas tipadas; proceso de pruebas por spec |
| `docs/architecture/supabase.md` y `database-schema.md` | RLS, vistas con `security_invoker`, convenciones; se amplían |
| `docs/architecture/frontend.md`, `ui.md` y `DESIGN.md` | Capas (el layout depende solo de `core`), navegación, drawers, sistema visual |
| `specs/013-responses-tracking` | Vistas de respuestas, `pending`, `review_guardian`, bloque «Por validar», `CallUpService` |

## Verificación de la Constitución

| Principio | Estado | Evidencia |
|---|---|---|
| I. SDD | ✅ Cumple | HU-041 Definida (DEC-47) |
| II. Simplicidad | ✅ Cumple | Contadores calculados con vistas; sin Realtime ni tareas programadas |
| III. Separación de responsabilidades | ✅ Cumple | `core/notices` para la navegación; el drawer en `players`; el visto en `call-ups` |
| IV. Reutilización controlada | ✅ Cumple | `guardian_pending_reviews` es la única regla de pendientes, también para la ficha; `review` sin cambios |
| VI. Multi-tenant | ✅ Cumple | `academy_id`, clave compuesta y RLS por usuario y academia |
| VIII. Seguridad | ✅ Cumple | Cada usuario solo ve y escribe sus visitas; las vistas heredan la RLS |
| IX. Calidad verificable | ✅ Cumple | pgTAP, Vitest y quickstart |
| XII. Excepciones | ✅ Justificada | `call_up_visits` sin borrado lógico |
| XIII. Experiencia de usuario | ✅ Cumple | Maquetas antes de las tareas |

Revisión tras el diseño: sin cambios.

## Estructura del proyecto

```text
specs/014-in-app-notices/  plan.md · research.md · data-model.md · quickstart.md · contracts/ · mockups/ · tasks.md
supabase/migrations/20261022100000_in_app_notices.sql
supabase/tests/database/120-in-app-notices.test.sql
frontend/src/app/
├── core/notices/                     # NUEVO: repositorio abstracto, Supabase, NoticesService
├── layout/component/                 # app.bottomnav y app.menuitem: contador en «Inicio»
├── features/home/pages/home-page     # sección «Avisos»
├── features/players/components/pending-reviews-drawer   # NUEVO
├── features/players/data             # pendingByAcademy; pending lee la vista
└── features/call-ups                 # markSeen en el repositorio y el servicio
```

## Complejidad

| Excepción | Por qué es necesaria | Alternativa descartada |
|---|---|---|
| `call_up_visits` sin `deleted_at` | Dato técnico que se sobrescribe; no tiene historia | Borrado lógico: filtros sin requisito que lo pida |
