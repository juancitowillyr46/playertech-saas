# Plan de implementación: Convocatoria y mensaje de WhatsApp

**Branch**: `012-call-ups` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Especificación de `/specs/012-call-ups/spec.md` (Fase 2, spec 3: HU-007, HU-008, HU-012, HU-013 y HU-038)

## Resumen

- **Base de datos** (R1 a R4): una migración con tres tablas, `call_ups`, `call_up_lists` (con su enlace secreto y el texto propio) y `call_up_players`, con `academy_id`, RLS por owner y claves compuestas.
  - **Reglas en la base de datos:**
    - la fecha límite debe estar entre ahora y el inicio;
    - no se modifica una convocatoria cerrada;
    - un jugador aparece una vez por convocatoria;
    - cancelar la actividad cierra su convocatoria;
    - un cambio de hora no puede dejar la fecha límite después del inicio.
  - **Creación atómica:** la función `create_call_up` crea la convocatoria, sus listas y sus convocados en una sola operación.
- **Mensajes y WhatsApp** (R5): funciones puras en el frontend arman el mensaje (texto propio y bloque generado) y los enlaces de WhatsApp (`wa.me`). No se usa ninguna API y no se agregan dependencias.
- **Frontend** (R6 y R7): una feature `call-ups` con la sección «Convocatoria» en el detalle de la actividad y drawers para convocar, ver el mensaje y compartirlo, y avisar cambios. La ruta pública `/c/:token` es una página fija, «Pronto podrás responder aquí». **Maquetas antes de implementar** (R8).

## Contexto técnico

**Lenguaje/versión**: TypeScript 5.9 y SQL (PostgreSQL 17); Node 24 LTS

**Dependencias principales**: Angular 21.2, PrimeNG 21.1, Tailwind CSS 4, `@supabase/supabase-js` 2.117.2. **Sin dependencias nuevas.**

**Almacenamiento**: Supabase. Tres tablas nuevas, una función y triggers; en la nube con `db:push` tras el merge y con autorización

**Pruebas**: pgTAP nueva (`100-call-ups.test.sql`); Vitest de `features/call-ups`, de los cambios en `features/activities` y de las funciones de mensaje. Solo las pruebas de la spec

**Plataforma objetivo**: navegadores modernos, móvil primero desde 360 px; el menú de compartir del celular (Web Share) cuando exista

**Tipo de proyecto**: SPA Angular sobre BaaS

**Objetivos de rendimiento**: la convocatoria con sus listas, convocados y acudientes se lee en una sola consulta; mensajes de 30 convocados

**Restricciones**: capas y estilos del proyecto; ADR-017; el enlace no da acceso a datos en esta spec (FR-009)

**Escala/alcance**: 1 migración, 1 feature, unos 4 drawers y una página pública fija

## Documentación de referencia obligatoria

La implementación DEBE leer estos documentos antes de empezar y aplicarlos junto con este plan. Ante un conflicto, se aplica la precedencia de `AGENTS.md` y se detiene la implementación hasta resolverlo.

| Documento | Qué se toma de él (y qué no aplica) |
|---|---|
| `.specify/memory/constitution.md` | Principios II, III, IV, VI, VIII, IX y XIII |
| `AGENTS.md` y `CLAUDE.md` | Reglas multi-tenant, capas, estilos, portabilidad, Impeccable, Git, `db:push` |
| HU-007, HU-008, HU-012, HU-013 y HU-038 | Criterios y reglas. **No aplica**: responder desde el enlace (spec 4) |
| `docs/architecture/decisions.md` | ADR-012, ADR-017 y ADR-018 (DEC-31, DEC-34, DEC-35, DEC-45) |
| `docs/product/call-up-flow.md` | Flujo; aquí solo la parte del owner hasta compartir |
| `docs/engineering/security.md` | SEC-03 (enlace secreto): aquí solo se genera |
| `docs/engineering/coding-standards.md` y `testing.md` | Claridad sobre brevedad, formato con Prettier, sin `any` ni reglas de lint desactivadas, interfaces de fila en los repositorios; proceso de pruebas por spec |
| `docs/architecture/database-schema.md`, `ui.md` y `DESIGN.md` | Convenciones, drawers y sistema visual; se amplían |
| `specs/009-...`, `010-...` y `011-...` | Jugadores, grupos y acudientes (celulares), actividades (`activity-page`, `colombia-time`, `FormDrawer`) |

## Verificación de la Constitución

| Principio | Estado | Evidencia |
|---|---|---|
| I. SDD | ✅ Cumple | Cinco HU Definidas (DEC-45) |
| II. Simplicidad | ✅ Cumple | Estado «abierta» calculado (`closed_at`, fecha límite e inicio), sin tareas programadas; mensajes como funciones puras; WhatsApp por enlace `wa.me`, sin API |
| III. Separación de responsabilidades | ✅ Cumple | `CallUpRepository` abstracto; la construcción del mensaje está separada de la pantalla |
| IV. Reutilización controlada | ✅ Cumple | `FormDrawer`, `colombia-time`, `shortName`, `activityTitle` |
| VI. Multi-tenant | ✅ Cumple | `academy_id` y claves compuestas hacia actividades, grupos y jugadores; RLS |
| VIII. Seguridad | ✅ Cumple | Reglas de fecha límite, cierre y unicidad en la base de datos; el enlace (122 bits aleatorios) no expone datos todavía |
| IX. Calidad verificable | ✅ Cumple | pgTAP, Vitest y quickstart |
| XII. Excepciones | ✅ Justificada | `call_up_players` con borrado físico (relación sin historia, como `group_members`) |
| XIII. Experiencia de usuario | ✅ Cumple | Maquetas aprobadas antes de implementar |

## Estructura del proyecto

```text
specs/012-call-ups/  plan.md · research.md · data-model.md · quickstart.md · contracts/ · mockups/ · tasks.md
supabase/migrations/20261019100000_call_ups.sql
supabase/tests/database/100-call-ups.test.sql
frontend/src/app/
├── features/call-ups/
│   ├── models, data (call-up repository), services
│   ├── messages/ (call-up-messages.ts: mensaje de lista, personal, avisos; whatsapp.ts: enlaces)
│   ├── components (call-up-section, call-up-drawer, message-drawer, notice-drawer)
│   └── pages/public-call-up (ruta pública /c/:token, fija)
├── features/activities/pages/activity-page    # incluye la sección y ofrece avisos
└── app.routes.ts                              # /c/:token fuera del layout autenticado
```

## Complejidad

| Excepción | Por qué es necesaria | Alternativa descartada |
|---|---|---|
| `call_up_players` con borrado físico | Quitar a un convocado no tiene valor de auditoría en el MVP (el historial de respuestas es la spec 4) | Borrado lógico: índices parciales y filtros sin requisito que lo pida |
