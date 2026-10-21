# Plan de implementación: Respuesta del acudiente y seguimiento

**Branch**: `013-responses-tracking` | **Date**: 2026-10-21 | **Spec**: [spec.md](./spec.md)

**Input**: Especificación de `/specs/013-responses-tracking/spec.md` (Fase 2, spec 4a: HU-009, HU-010, HU-011 y HU-040)

## Resumen

- **Base de datos** (R1 a R6): una migración.
  - **Tablas nuevas:** `guardian_devices` (la marca del navegador, guardada como huella) y `call_up_responses` (registro de solo inserción).
  - **Cambios:** `guardians` y `guardian_links` aceptan filas creadas desde el enlace (`source = 'link'`, sin autor).
  - **Vistas:** `call_up_current_responses` y `call_up_summaries`.
  - **Funciones públicas** (`security definer`, para `anon`): `public_call_up`, `public_identify` y `public_respond`. Aplican la privacidad, el cierre y el límite de 3 cambios en el servidor.
  - **Función del owner:** `review_guardian`, para validar o rechazar. El owner registra respuestas por RLS.
- **Página del enlace** (R7): una feature nueva, `call-up-response`, que reemplaza «Pronto podrás responder aquí». Tiene los estados elegir, identificarse, responder, listo, solo lectura y no disponible. La llave del dispositivo se guarda en `localStorage`.
- **Owner** (R8):
  - la sección «Convocatoria» suma totales, el estado por jugador y «Actualizar»;
  - un drawer por jugador con el historial, «Registrar respuesta» y la opción de validar o rechazar;
  - el bloque «Por validar» en la ficha del jugador;
  - la etiqueta «12/17» en la lista de actividades.
- **Maquetas** antes de las tareas (R9).

## Contexto técnico

**Lenguaje/versión**: TypeScript 5.9 y SQL (PostgreSQL 17); Node 24 LTS

**Dependencias principales**: Angular 21.2, PrimeNG 21.1, Tailwind CSS 4, `@supabase/supabase-js` 2.117.2; `pgcrypto` (ya presente en Supabase, declarado en la migración). **Sin dependencias nuevas.**

**Almacenamiento**: Supabase. Dos tablas nuevas, dos columnas en tablas existentes, dos vistas y cuatro funciones; en la nube con `db:push` tras el merge y con autorización

**Pruebas**: pgTAP nueva (`110-call-up-responses.test.sql`), con acceso público y aislamiento; Vitest de `features/call-up-response` y de lo que cambia en `call-ups`, `activities` y `players`. Solo las pruebas de la spec

**Plataforma objetivo**: navegadores modernos, móvil primero desde 360 px; la página del enlace se abre desde WhatsApp (navegador interno incluido)

**Tipo de proyecto**: SPA Angular sobre BaaS

**Objetivos de rendimiento**: la página del enlace se carga con una sola llamada; el seguimiento, con una lectura de la vista por convocatoria; listas de 30 convocados

**Restricciones**: capas y estilos del proyecto; ADR-017 (sin `auth.uid()` nuevos ni Edge Functions); `anon` sin acceso a tablas (FR-017); sin datos de menores más allá de nombre, inicial y apodo

**Escala/alcance**: 1 migración, 1 feature nueva, 3 features ampliadas, 1 drawer nuevo, 1 página pública

## Documentación de referencia obligatoria

La implementación DEBE leer estos documentos antes de empezar y aplicarlos junto con este plan. Ante un conflicto, se aplica la precedencia de `AGENTS.md` y se detiene la implementación hasta resolverlo.

| Documento | Qué se toma de él (y qué no aplica) |
|---|---|
| `.specify/memory/constitution.md` | Principios II, III, IV, VI, VIII, IX, XII y XIII |
| `AGENTS.md` y `CLAUDE.md` | Reglas multi-tenant, capas, estilos, portabilidad, Impeccable, Git, `db:push` |
| HU-009, HU-010, HU-011 y HU-040 | Criterios y reglas. **No aplica**: HU-041 (spec 014) |
| `docs/architecture/decisions.md` | ADR-012, ADR-017 y ADR-018 (DEC-31, DEC-33, DEC-38, DEC-39, DEC-40, DEC-45 y DEC-46). **No aplica**: la parte de DEC-41 aplazada |
| `docs/product/call-up-flow.md` | Flujo completo del acudiente y del owner |
| `docs/engineering/security.md` | SEC-03 y sus mitigaciones (enlace que caduca, inicial del apellido, validación del owner, límite de cambios, registro de quién y cuándo) |
| `docs/engineering/coding-standards.md` y `testing.md` | Claridad sobre brevedad, Prettier, sin `any` ni reglas de lint desactivadas, filas tipadas en los repositorios; proceso de pruebas por spec |
| `docs/architecture/supabase.md` y `database-schema.md` | Funciones `security definer` con `search_path` vacío, privilegios por columna, RLS; convenciones de tablas |
| `docs/architecture/frontend.md`, `ui.md` y `DESIGN.md` | Capas, drawers, sistema visual |
| `docs/product/glossary.md` | Acudiente, convocatoria, convocado, owner |
| `specs/009-…`, `010-…`, `011-…` y `012-call-ups` | Acudientes y autorización (`add_player_guardian`, `assign_guardians`), actividades, convocatoria (`call_up_is_open`, `CallUpService`, sección y drawers), nombres (`shortName`, `fullNameWithNickname`) |

## Verificación de la Constitución

| Principio | Estado | Evidencia |
|---|---|---|
| I. SDD | ✅ Cumple | Cuatro HU Definidas (DEC-46) |
| II. Simplicidad | ✅ Cumple | La respuesta vigente se calcula desde el registro, no se guarda dos veces; sin Realtime ni tareas programadas; la llave del dispositivo, en `localStorage` |
| III. Separación de responsabilidades | ✅ Cumple | La página pública es una feature propia; repositorios abstractos; las opciones y los motivos, como funciones puras |
| IV. Reutilización controlada | ✅ Cumple | `call_up_is_open`, `FormDrawer`, `colombia-time`, `shortName`; una sola vía de revisión (`GuardianRepository.review`) |
| VI. Multi-tenant | ✅ Cumple | `academy_id` y claves compuestas; RLS; las funciones públicas derivan la academia del enlace, nunca del cliente |
| VIII. Seguridad | ✅ Cumple | `anon` solo ejecuta tres funciones que devuelven lo mínimo; secreto del dispositivo guardado como huella; límite de cambios y cierre en el servidor; rechazo silencioso |
| IX. Calidad verificable | ✅ Cumple | pgTAP de acceso público y aislamiento, Vitest y quickstart (`contracts/acceptance-coverage.md`) |
| XII. Excepciones | ✅ Justificada | `call_up_responses` y `guardian_devices` sin borrado lógico (historial y evidencia); `created_by` nulo en filas del enlace |
| XIII. Experiencia de usuario | ✅ Cumple | Maquetas aprobadas antes de las tareas; la página del enlace pensada para el navegador de WhatsApp |

Revisión tras el diseño: sin cambios. Las tres excepciones se justifican abajo.

## Estructura del proyecto

```text
specs/013-responses-tracking/  plan.md · research.md · data-model.md · quickstart.md · contracts/ · mockups/ · tasks.md
supabase/migrations/20261021100000_call_up_responses.sql
supabase/tests/database/110-call-up-responses.test.sql
frontend/src/app/
├── features/call-up-response/          # NUEVA: página pública del acudiente
│   ├── models, data (public-call-up repository, device-key store), services
│   ├── options/response-options.ts      # respuestas, motivos, textos de cambios
│   └── pages/call-up-response (ruta /c/:token; reemplaza call-ups/pages/public-call-up)
├── features/call-ups/                   # seguimiento: sección, response-drawer, repositorio y servicio
├── features/activities/pages/activities-page   # «12/17»
└── features/players/                    # «Por validar» en la ficha; GuardianRepository.review y pending
```

## Complejidad

| Excepción | Por qué es necesaria | Alternativa descartada |
|---|---|---|
| `call_up_responses` sin `deleted_at` | El historial es la evidencia de quién respondió y cuándo (DEC-33, SEC-03); no se edita ni se borra | Borrado lógico: permitiría ocultar respuestas y obligaría a filtrar en cada lectura |
| `guardian_devices` sin `deleted_at` | Revocar (`revoked`) es su baja; el dispositivo se conserva porque las respuestas lo referencian como evidencia de quién respondió (SEC-03) | Borrado lógico: duplicaría el estado `revoked` y dejaría respuestas apuntando a filas ocultas |
| `created_by` nulo en `guardians` y `guardian_links` creados desde el enlace | No hay un usuario autenticado; atribuirlos al owner sería falso | Usuario técnico en `auth.users`: referencia nueva al esquema `auth` (ADR-017) |
