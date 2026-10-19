---

description: "Lista de tareas para actividades y canchas externas (Fase 2, spec 2)"
---

# Tareas: Actividades y canchas externas

**Input**: Documentos de diseño de `/specs/011-activities-fields/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md, mockups/ (aprobadas, opción A)

**Tests**: Se incluyen porque la spec las exige (FR-015, SC-007). **Solo las de la spec**: pgTAP completo y Vitest de `features/activities` y `shared/text`. Una prueba que falle se reintenta como máximo una vez.

**Organización**: la base de datos, las utilidades de hora, los repositorios y la navegación los usan todas las historias (Fase 2). Orden: US1 y US2 (programar y repetir), US3 (consultar), US4 (gestionar), US5 (canchas) y US6.

## Convenciones

- Antes de empezar, leer la documentación de referencia de `plan.md` (principio XI). Las pantallas siguen `mockups/` y `contracts/ui-contracts.md`.
- **Patrón**: las specs 004 y 009 (`FormDrawer`, `run()` con refresco, `supabase-client-mock`, pestañas como `PlayersShell`).
- **Base de datos**: `current_user_id()` (ADR-017); la migración se aplica con `npx supabase migration up` y `npm run db:reset` solo con autorización.
- **Horas**: siempre con `shared/text/colombia-time.ts`; nunca con la zona del dispositivo.

---

## Fase 1: Configuración

- [ ] T001 Comprobar `npm run db:test` en verde (194/194) antes de cambiar nada

---

## Fase 2: Fundaciones (bloqueantes)

- [ ] T002 Escribir `supabase/tests/database/090-activities-fields.test.sql` (research R8). Debe cubrir:
  - RLS en las dos tablas y sin `delete`;
  - canchas: nombre único sin distinguir mayúsculas ni espacios, y uno retirado se reutiliza;
  - actividad con sede y con cancha;
  - con los dos lugares o sin ninguno, `23514`;
  - sede inactiva o cancha retirada al crear, `23514`;
  - sede de la academia B, `23503`;
  - fecha pasada, `23514`;
  - `ends_at <= starts_at` o `call_at > starts_at`, `23514`;
  - rival en un entrenamiento, `23514`;
  - inserción múltiple con `series_id`;
  - cancelar y reactivar una próxima;
  - una pasada (preparada como superusuario con el trigger desactivado en la transacción): editar o cancelar, `23514`; eliminar (`deleted_at`) se permite;
  - retirar la cancha conserva la actividad;
  - aislamiento A/B;
  - anon sin acceso.
- [ ] T003 Crear `supabase/migrations/20261018120000_activities_fields.sql` según `data-model.md` y `contracts/database.md`:
  - tablas, checks e índices;
  - trigger `activities_guard` (`security invoker`, `set search_path = ''`, sin `execute` para los roles);
  - `set_updated_at`, RLS, políticas y GRANT por columna;
  - comentarios en español.
- [ ] T004 Aplicar con `npx supabase migration up`, ejecutar `npm run db:test` en verde y regenerar los tipos con `npm run db:types`
- [ ] T005 [P] Documentar las tablas en `docs/architecture/database-schema.md` (sección Fase 2)
- [ ] T006 [P] Añadir `23503 → rule_violation` a `frontend/src/app/core/errors/supabase-error.mapper.ts` y a su `.spec.ts`
- [ ] T007 [P] Crear `frontend/src/app/shared/text/colombia-time.ts` y su `.spec.ts` (`contracts/repositories.md`):
  - `toInstant`, `fromInstant` y `dayKey`, con el desfase fijo `-05:00`;
  - `weeklyDates(from, until, weekdays)`, que incluye los extremos y respeta los días;
  - `dayLabel(dayKey, today)`: «Hoy», «Mañana» o «Martes 20 de octubre».
- [ ] T008 [P] Crear `frontend/src/app/features/activities/models/activity.models.ts` (`ActivityType`, `ActivityStatus`, `Place`, `ActivityInput`, `Activity`, `ExternalField`, etiquetas en español e `isPast(activity, now)`)
- [ ] T009 Crear `features/activities/data/activity.repository.ts`, `supabase-activity.repository.ts` y su `.spec.ts`:
  - `list(when)` con el lugar embebido (`venues(...)` y `external_fields(...)`): las próximas con `starts_at >= ahora` en orden ascendente y las pasadas con `< ahora` en descendente;
  - `create` con un solo `insert` de varias filas, la academia del contexto y el `series_id`, que devuelve cuántas creó;
  - `update`, `setStatus` y `delete`, con `deleted_at is null` y PGRST116 → `not_found`.
- [ ] T010 [P] Crear `features/activities/data/external-field.repository.ts`, `supabase-external-field.repository.ts` y su `.spec.ts` (`list`, `create` que devuelve la cancha, `update` y `retire`)
- [ ] T011 Registrar los repositorios en `frontend/src/app.config.ts`. Crear `features/activities/activities.routes.ts` (shell con pestañas Actividades | Canchas, `:id` al final) y registrarla en `app.routes.ts`. Añadir «Actividades» (`pi pi-fw pi-calendar`) a General en `core/navigation/navigation.ts` y ajustar `navigation.spec.ts` y `app.bottomnav.spec.ts` (Inicio · Jugadores · Actividades · Academia · Sedes). Actualizar el esquema de navegación de `docs/architecture/ui.md`
- [ ] T012 Crear `features/activities/pages/activities-shell/activities-shell.ts` (pestañas, como `PlayersShell`) y su `.spec.ts`

---

## Fase 3: US1 y US2 — Programar y repetir (P1) 🎯 MVP

- [ ] T013 [US1] Crear `features/activities/services/activities.service.ts` y su `.spec.ts`:
  - `load(when)` y `typeFilter`;
  - `days` (grupos por `dayKey`);
  - `placeOptions()`: sedes activas de `VenueRepository` y canchas;
  - `create(form)`: sin repetición, una sola actividad; con repetición, `weeklyDates` con el mismo horario y un `series_id` (`randomUuid`);
  - `run()` con refresco y `busy`.
- [ ] T014 [US1] Crear `features/activities/components/activity-form-drawer/activity-form-drawer.ts` según `mockups/Form.dc.html` y `FormRepeat.dc.html`:
  - tipo con radios de 44 px;
  - fecha (`p-datepicker` con `showOnFocus` en falso, desde hoy) y horas (`p-datepicker timeOnly`, 12 h);
  - lugar (`p-select` agrupado, con «Nueva cancha»);
  - rival y torneo solo en competencia (se limpian al cambiar a entrenamiento);
  - observaciones (500 caracteres);
  - «Repetir» solo al crear: botones de día con `aria-pressed`, «Hasta» (6 meses como máximo) y el resumen «Se crearán N»;
  - validaciones de HU-005 (CA-003) junto al campo.
- [ ] T015 [US1] Crear `features/activities/components/external-field-drawer/external-field-drawer.ts` (nombre de 1 a 80 caracteres, dirección, ciudad e indicaciones; nombre repetido junto al campo). Desde el formulario, «Nueva cancha» la crea y la deja elegida
- [ ] T016 [US1] Crear `features/activities/pages/activities-page/activities-page.ts` con la acción «Nueva actividad» y el aviso «Actividad creada» o «Se crearon N actividades». El listado se completa en US3
- [ ] T017 [US1] Escribir `activities-page.spec.ts` (parte de creación):
  - entrenamiento en una sede y competencia con rival (CA-001, CA-002, CA-004);
  - obligatorios y horas incoherentes (CA-003);
  - «Nueva cancha» desde el formulario (CA-005);
  - repetición con el resumen y la cantidad creada (CA-006).

---

## Fase 4: US3 — Consultar (P1)

- [ ] T018 [US3] Completar `activities-page.ts` según `mockups/Main.dc.html`: selector Próximas | Pasadas, filtro por tipo, grupos por día con `dayLabel`, filas con la hora, el tipo, «vs. rival» y el lugar, el sello «Cancelada», y los estados de carga, error y vacío. Ampliar su `.spec.ts` (CA-001 a CA-005 de HU-006)

---

## Fase 5: US4 — Gestionar (P1)

- [ ] T019 [US4] Crear `features/activities/pages/activity-page/activity-page.ts` y su `.spec.ts` según `mockups/Detail.dc.html`:
  - todos los datos;
  - si es **próxima**: Editar (el mismo drawer, sin «Repetir»), Cancelar o Reactivar (con confirmación) y, en ⋮, Eliminar (confirmación con el tipo, la fecha y la hora);
  - si es **pasada**: el aviso «Esta actividad ya pasó: no se puede modificar» y solo Eliminar;
  - `not_found`;
  - pruebas: CA-001 a CA-006 de HU-036 y CA-004 de HU-006.

---

## Fase 6: US5 — Canchas (P2)

- [ ] T020 [US5] Crear `features/activities/services/external-fields.service.ts` y `pages/fields-page/fields-page.ts`, con sus `.spec.ts`, según `mockups/Fields.dc.html`: lista con la ciudad, «Nueva cancha», ⋮ con Editar y Retirar (con confirmación), estado vacío y nombre repetido (CA-002 a CA-004 de HU-037)

---

## Fase 7: US6 — Revisión (P2)

- [ ] T021 [US6] Revisar a 360 px y en escritorio, en claro y oscuro, el listado, el detalle, los dos drawers y las canchas con Impeccable (detector y revisión manual): 44 px, foco, etiquetas, textos largos

---

## Fase 8: Cierre

- [ ] T022 Ejecutar `npm run db:test` y `npx ng test --watch=false --include src/app/features/activities --include src/app/shared/text --include src/app/core`; después, una sola vez, `npm run lint`, `npm run check:styles` y `npm run build`. No encadenar el commit a las pruebas
- [ ] T023 Recorrer `quickstart.md` y anotar los resultados; el responsable valida desde el celular
- [ ] T024 Confirmar que la academia A del seed no tiene actividades ni canchas y que `npm run db:test` está en verde
- [ ] T025 [P] Marcar HU-005, HU-006, HU-036 y HU-037 como «Terminada (entorno local)» en las HU, en EP-04, en EP-14 y en `docs/backlog/README.md`
- [ ] T026 Tras el merge y con autorización: `npm run db:push`, primero con `--dry-run`

---

## Dependencias

- T001 → T002 → T003 → T004. T005 a T008 en paralelo tras T004; T009 y T010 tras T008; T011 → T012.
- US1 (T013 a T017) → US3 (T018) → US4 (T019). US5 (T020) puede hacerse tras T015.
- US6 y el cierre, al final.

## Estrategia

MVP: Fases 1 a 3 (programar y repetir). Luego consultar, gestionar y canchas. El responsable valida desde el celular antes del commit y del PR.
