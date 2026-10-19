---

description: "Lista de tareas para asignar acudientes ya registrados (spec 010)"
---

# Tareas: Asignar acudientes ya registrados

**Input**: Documentos de diseño de `/specs/010-guardian-assignment/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md, mockups/ (aprobadas)

**Tests**: Se incluyen porque la spec las exige (FR-012, SC-006). Se ejecutan **solo las de la spec**: pgTAP completo y Vitest de `features/players`.

**Organización**: la base de datos y el repositorio los usan las tres historias (Fase 2). Orden: US3 (la autorización, base de las demás), US1, US2 y US4.

## Formato: `[ID] [P?] [Story] Descripción`

## Convenciones

- Antes de empezar, leer la documentación de referencia de `plan.md` (principio XI). Las pantallas siguen `mockups/` y `contracts/ui-contracts.md`.
- Capas y estilos como en la spec 009; `FormDrawer`, `searchKey`, `shortName` y `RELATIONSHIP_LABELS` se reutilizan.
- Sin usos nuevos de `auth.uid()` (`current_user_id()`). `npm run db:reset` solo con autorización; la migración se aplica con `npx supabase migration up`.

---

## Fase 1: Configuración

- [ ] T001 Con la base de datos de la spec 009 (sin la migración nueva), comprobar `npm run db:test` en verde (180/180) y sembrar por SQL los datos del paso 1.1 del quickstart en la academia A (Samuel con su mamá y su papá, Mateo con el mismo papá) para verificar el traslado

---

## Fase 2: Fundaciones (bloqueantes)

- [ ] T002 Escribir `supabase/tests/database/080-guardian-assignment.test.sql` (research R5). Debe cubrir:
  - `guardians.consent_document_id` y `consent_at` existen y son `not null`;
  - `guardian_links` ya no tiene esas columnas;
  - `add_player_guardian` guarda la Política vigente en la persona nueva;
  - `assign_guardians`:
    - asigna uno y devuelve 1;
    - asigna varios;
    - omite los ya vinculados (devuelve los creados);
    - con un parentesco inválido o `self` falla con `23514`;
    - con un acudiente de otra academia falla con `42501` sin asignar ninguno;
    - el owner B con un jugador de A falla con `42501`;
    - anon no tiene acceso.
- [ ] T003 Crear `supabase/migrations/20261018110000_guardian_consent_and_assignment.sql` según `data-model.md` y `contracts/database.md`:
  - columnas nuevas en `guardians`;
  - traslado del primer vínculo (`distinct on (guardian_id) order by created_at`, incluidos los retirados);
  - `set not null` y `drop column` en `guardian_links`;
  - `create or replace` de `add_player_guardian`;
  - `assign_guardians` (`security definer`, `set search_path = ''`, sin `execute` para `anon`, comentarios en español).
- [ ] T004 Ajustar `supabase/tests/database/070-players-groups-guardians.test.sql`: la aserción de la Política vigente pasa de `guardian_links` a `guardians`
- [ ] T005 Aplicar con `npx supabase migration up`, verificar por SQL el traslado de T001 (paso 1.3 del quickstart) y ejecutar `npm run db:test` en verde; regenerar `frontend/src/app/core/supabase/database.types.ts` con `npm run db:types`
- [ ] T006 [P] Actualizar la sección de la spec 009 en `docs/architecture/database-schema.md` (autorización en `guardians`, `assign_guardians`) y la nota de `specs/009-players-guardians-groups/contracts/database.md` que remite a esta spec
- [ ] T007 Ampliar `frontend/src/app/features/players/models/player.models.ts` (`GuardianOption`, `GuardianAssignment`) y `data/guardian.repository.ts` según `contracts/repositories.md`
- [ ] T008 Ampliar `frontend/src/app/features/players/data/supabase-guardian.repository.spec.ts` y `supabase-guardian.repository.ts`:
  - `listGuardians`: una consulta de acudientes no eliminados con sus vínculos no eliminados y los jugadores activos y no eliminados, ordenada por nombre, con `name = shortName`;
  - `assign`: llama a `rpc('assign_guardians', { p_player_id, p_assignments })` con `guardian_id` y `relationship`, devuelve el número, y traduce `42501` a `not_found`.

---

## Fase 3: US3 — La autorización es de la persona (P1)

- [ ] T009 [US3] Verificar con el formulario de registro de la spec 009 (`GuardianDrawer`) que registrar a un acudiente nuevo sigue exigiendo la casilla y que sus pruebas siguen en verde; sin cambios en la pantalla

---

## Fase 4: US1 — Elegir un acudiente ya registrado (P1) 🎯 MVP

- [ ] T010 [US1] Ampliar `player-detail.service.spec.ts` y `player-detail.service.ts`:
  - `guardianOptions()` con `alreadyLinked`;
  - `assignGuardians(assignments)` con `run()`, refresco y el número asignado.
- [ ] T011 [US1] Crear `frontend/src/app/features/players/components/guardian-picker-drawer/guardian-picker-drawer.ts` según `mockups/Picker.dc.html` y `PickerSelected.dc.html`:
  - buscador (`searchKey` de nombre y celular);
  - filas con nombre, celular y «Papá de Samuel V. · …»;
  - las ya vinculadas, deshabilitadas con «Ya es acudiente de [jugador]»;
  - al elegir, el parentesco con radios de 44 px y el texto de la autorización ya dada;
  - el botón «Asignar a [jugador]», deshabilitado sin elección;
  - «Registrar un acudiente nuevo» emite `registerNew`.
- [ ] T012 [US1] Cambiar `player-page.ts`: «Agregar acudiente» carga las opciones y abre el selector si hay alguna; si no, el formulario (`GuardianDrawer`). `registerNew` cierra el selector y abre el formulario. Aviso «[nombre] quedó como acudiente de [jugador]».
- [ ] T013 [US1] Ampliar `player-page.spec.ts`:
  - el selector lista, busca y deshabilita el ya vinculado (CA-001, CA-002, CA-004);
  - asigna sin casilla (CA-003);
  - sin acudientes en la academia, abre el formulario; «Registrar un acudiente nuevo» también (CA-006).

---

## Fase 5: US2 — Copiar los acudientes de un hermano (P1)

- [ ] T014 [US2] Ampliar `player-detail.service.spec.ts` y `player-detail.service.ts` con `siblings()` (jugadores con `guardianCount > 0` excepto el actual) y `siblingGuardians(playerId)`
- [ ] T015 [US2] Crear `frontend/src/app/features/players/components/copy-guardians-drawer/copy-guardians-drawer.ts` según `mockups/CopySibling.dc.html`:
  - paso 1, buscador de hermanos;
  - paso 2, el hermano con «Cambiar» y sus acudientes con casilla (marcados por defecto) y un `p-select` de parentesco por fila;
  - los ya vinculados, deshabilitados;
  - el botón «Asignar N acudientes»;
  - si no queda ninguno por asignar, el aviso «Todos sus acudientes ya son de [jugador]».
- [ ] T016 [US2] En `player-page.ts`, «Copiar de un hermano» (solo si hay hermanos con acudientes) abre el drawer; aviso «N acudientes asignados a [jugador]»
- [ ] T017 [US2] Ampliar `player-page.spec.ts`: copiar con uno desmarcado y un parentesco cambiado (CA-005); el ya vinculado no se repite; la acción no aparece sin hermanos con acudientes

---

## Fase 6: US4 — Pantallas revisadas (P2)

- [ ] T018 [US4] Revisar los dos drawers y la ficha a 360 px y en escritorio, en claro y oscuro, con Impeccable (detector y revisión manual): 44 px, foco, etiquetas, sin desbordamiento con nombres largos

---

## Fase 7: Cierre

- [ ] T019 Ejecutar `npm run db:test` y `npx ng test --watch=false --include src/app/features/players`; después, una sola vez, `npm run lint`, `npm run check:styles` y `npm run build`
- [ ] T020 Recorrer `quickstart.md` (pasos 2 a 5) y anotar los resultados; el responsable valida desde el celular
- [ ] T021 Restaurar la academia A del seed: borrar por SQL los jugadores, grupos, acudientes y vínculos creados, y confirmar `npm run db:test` en verde
- [ ] T022 [P] Marcar HU-035 como «Terminada (entorno local)» en la HU, en EP-10 y en `docs/backlog/README.md`; marcar T044 de la spec 009
- [ ] T023 Tras el merge y con autorización, `npm run db:push`: primero con `--dry-run`, y verificar por SQL en la nube que ningún acudiente quedó sin autorización

---

## Dependencias

- T001 → T002 → T003 → T004 → T005 → T007 → T008. T006 en paralelo tras T005.
- US3 (T009) tras la Fase 2; US1 (T010 a T013) antes que US2 (T014 a T017), porque comparten el servicio y la ficha.
- US4 y el cierre, al final.

## Estrategia

MVP: Fases 1 a 4 (elegir un acudiente). Luego copiar de un hermano, la revisión y el cierre. El responsable valida desde el celular antes del commit y del PR.
