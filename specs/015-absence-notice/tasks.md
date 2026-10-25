---

description: "Lista de tareas del aviso de inasistencia (Fase 2, spec 5)"
---

# Tareas: Aviso de inasistencia

**Input**: Documentos de diseño de `/specs/015-absence-notice/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md, mockups/ (aprobadas el 2026-10-24)

**Tests**: se incluyen porque la spec los exige (FR-013). Son solo los de la spec, según `docs/engineering/testing.md`:
- pgTAP: el archivo nuevo y, antes del cierre, el conjunto completo;
- Vitest: `features/absences` y el detalle de la actividad.

**Organización**: la base de datos, el repositorio y el servicio base van en la Fase 2. Después siguen las historias:
1. US1: marcar a quien no llegó.
2. US2: avisar al acudiente.
3. US3: revisión.

## Convenciones

- **Antes de empezar:** leer la documentación de referencia de `plan.md` (principio XI). Las pantallas siguen `mockups/` y `contracts/contracts.md`.
- **Patrones de las specs 012 a 014:**
  - `FormDrawer` con reinicio `untracked`;
  - `supabase-client-mock`;
  - `relationshipLabel` y `fullNameWithNickname`;
  - `colombia-time` para las horas;
  - Prettier solo en los archivos tocados.
- **ADR-017:** `current_user_id()`; sin `auth.uid()` nuevos. La migración se aplica con `npx supabase migration up`, nunca con `db:reset`.
- **Datos locales:** no borrar los datos de prueba de la academia C.

## Notas de implementación

- **Actividad cancelada después de marcar**: la sección se oculta y sus marcas no se muestran (MVP). Las marcas se conservan en la base de datos.
- **Error al marcar**: la marca optimista se revierte y se muestra el error; el owner la toca de nuevo para reintentar (spec, caso «Sin conexión»).

- **Mensaje**: «… en Sede principal»: el lugar es un nombre libre, así que no lleva artículo (el ejemplo de las maquetas decía «en la Sede principal»).
- **Pruebas de base de datos**: las actividades pasadas se crean sin la guarda `activities_guard`, que solo deja crear actividades futuras. No hay miembros que no sean owner en el MVP (DEC-02): la prueba de «un miembro que no es owner no marca» queda para EP-11.
- **Pruebas de la interfaz**: los drawers de la lista y del aviso se prueban a través de la sección (`absence-section.spec.ts`), con los datos de `features/absences/testing/absence-fixtures.ts`.
- **Revisión (T017)**: el detector de Impeccable no encontró hallazgos. Las pantallas requieren sesión: se revisaron en el código (filas de 52 px, `aria-pressed`, nombres accesibles, resumen con `aria-live`, solo tokens) y quedan para la validación en el celular.
- **Resultados**:
  - pgTAP 334/334 (19 nuevas);
  - Vitest de `features/absences` y del detalle de la actividad: 26/26;
  - lint, `check:styles` y compilación en verde.

---

## Fase 1: Configuración

- [X] T001 Comprobar `npm run db:test` en verde (315/315)

---

## Fase 2: Fundaciones (bloqueantes)

- [X] T002 Escribir `supabase/tests/database/130-player-absences.test.sql` con todo lo de `contracts/contracts.md` (base de datos), sobre `tests.academy_of('academia-a')` y la B. Las actividades se crean con `starts_at` relativo a `now()` (empezada hace una hora, por empezar en una hora y de ayer), en hora de Colombia:
  - **Marcar y desmarcar:**
    - `set_absence(…, true)` crea la ausencia con `marked_by` y `marked_at`;
    - `set_absence(…, false)` pone `deleted_at`;
    - volver a marcar limpia `deleted_at` y conserva `notified_at`;
    - una sola fila por actividad y jugador.
  - **Plazo:** antes del inicio, en una actividad de ayer y en una que empezó a las 11:00 p. m. de ayer en hora de Colombia, error `absence_window_closed`; al día siguiente tampoco se desmarca ni se registra «Avisado».
  - **Actividad cancelada:** error `activity_not_scheduled`.
  - **`mark_absence_notified`:** pone `notified_at` y lo devuelve; sin ausencia vigente falla.
  - **Otra academia:** un jugador de B no se marca en una actividad de A.
  - **Convocatoria:** marcar a un convocado no cambia `call_up_current_responses` ni `call_up_summaries`.
  - **Aislamiento:**
    - el owner B no ve ausencias de A ni las marca;
    - un miembro que no es owner no marca;
    - `anon` no tiene acceso a la tabla ni a las funciones.
- [X] T003 Crear `supabase/migrations/20261024100000_player_absences.sql` según `data-model.md`:
  - **Tabla `player_absences`:**
    - `id uuid` PK; `academy_id` con FK compuestas a `activities (academy_id, id)` y `players (academy_id, id)`;
    - `marked_by uuid not null default public.current_user_id()`, sin FK a `auth.users`;
    - `marked_at timestamptz not null default clock_timestamp()`; `notified_at timestamptz` nulo; `deleted_at`, `created_at` y `updated_at`;
    - índice único `(activity_id, player_id)`.
  - **Trigger de guarda** (`before insert or update`): la actividad está programada y no eliminada (`activity_not_scheduled`); `now()` entre `starts_at` y `date_trunc('day', starts_at at time zone 'America/Bogota') + interval '1 day'` en hora de Colombia (`absence_window_closed`); ambos con `errcode 23514`.
  - **RLS:** `select` para miembros de la academia (`is_academy_member`); `insert` y `update` solo para el owner (`has_academy_role`); sin `delete`.
  - **Funciones** `security invoker`:
    - `set_absence(p_activity_id uuid, p_player_id uuid, p_absent boolean) returns void`: *upsert* por `(activity_id, player_id)`; la academia sale de la actividad; marcar limpia `deleted_at` y renueva `marked_at` y `marked_by`; desmarcar pone `deleted_at`;
    - `mark_absence_notified(p_activity_id uuid, p_player_id uuid) returns timestamptz`: `notified_at = clock_timestamp()` en la ausencia vigente y devuelve ese valor; sin ella, error.
  - **GRANT** a `authenticated`, sin `anon`. Comentarios en español.
- [X] T004 Aplicar con `npx supabase migration up`, ejecutar `npm run db:test` en verde y luego `npm run db:types`
- [X] T005 [P] Documentar la tabla y las funciones en `docs/architecture/database-schema.md` (sección de la spec 015)
- [X] T006 Crear `frontend/src/app/features/absences/models/absence.models.ts`:
  - `Absence` (`playerId`, `fullName` con apodo (`fullNameWithNickname`), `markedAt`, `notifiedAt: string | null`, `active`);
  - `AbsenceCandidate` (`playerId`, nombre completo con apodo, `section`: `'yes' | 'pending' | 'no' | 'group'`, `responseLabel`);
  - `AbsenceWindow` (`'before' | 'open' | 'closed'`) y la función pura `absenceWindow(startsAt, now)` con el final del día en Colombia (`colombia-time`);
  - `absenceSummary(absences)`: «N no llegaron · M avisados», con singular («1 no llegó · 1 avisado»).
- [X] T007 Crear `frontend/src/app/features/absences/data/absence.repository.ts` (abstracto: `list`, `setAbsent` y `markNotified`, como en `contracts/contracts.md`) y `supabase-absence.repository.ts` con su `.spec.ts`:
  - `list` lee `player_absences` de la actividad (vigentes y desmarcadas con aviso) con el nombre, los apellidos y el apodo del jugador por la relación con `players`, también si está inactivo, eliminado o fuera de la convocatoria; filas tipadas de `database.types`;
  - `markNotified` devuelve el `notified_at` de la función;
  - `setAbsent` llama a `set_absence`;
  - los errores `absence_window_closed` y `activity_not_scheduled` se traducen a errores con mensaje en español.

  Registrar `AbsenceRepository` en `frontend/src/app.config.ts`
- [X] T008 [P] Escribir `frontend/src/app/features/absences/models/absence.models.spec.ts`: el plazo (antes, en el día, después de la medianoche en Colombia) y el resumen

---

## Fase 3: US1 — Marcar a quien no llegó (P1) 🎯 MVP

**Objetivo**: en la cancha, el owner marca solo a quien no llegó y ve el resumen en la actividad.

**Prueba independiente**: pasos 1 y 2 de `quickstart.md`.

- [X] T009 [US1] Crear `frontend/src/app/features/absences/services/absence.service.ts` (proveído por la página) con su `.spec.ts`:
  - `load(activity)`: lee las ausencias y, si hay convocatoria (`CallUpRepository.getByActivity` y `responses`), arma los candidatos de los convocados activos ordenados en «Dijeron Sí», «Provisional o sin respuesta» y «Avisaron que no»; si no hay, carga `PlayerRepository.listGroups` y `listPlayers` (activos);
  - `selectGroups(ids)`: candidatos de los grupos elegidos, sin repetir y ordenados por nombre;
  - `toggle(playerId)`: marca o desmarca de forma optimista; si falla, revierte y muestra el error con `MessageService`;
  - signals `window`, `summary`, `absent` (lista de ausentes con su aviso) y `hasCallUp`.

  Pruebas: el orden de los convocados, los grupos sin repetir, la marca optimista y su reversión, y que `toggle` no llama a `CallUpRepository` (FR-008)
- [X] T010 [US1] Crear `frontend/src/app/features/absences/components/absence-list-drawer/` (`.ts` y `.spec.ts`) según `mockups/Groups.dc.html` y `CallUp.dc.html`:
  - sin convocatoria: chips de grupo de selección múltiple (`p-togglebutton` o botones con `aria-pressed`) y buscador por nombre o apodo cuando hay más de 12 jugadores;
  - con convocatoria: las tres secciones («Dijeron Sí», «Provisional o sin respuesta» y «Avisaron que no»); los de «No» van atenuados con «Dijo No» y su motivo, y se pueden marcar igual;
  - filas de al menos 52 px: el toque marca o desmarca, con «No llegó» y, si ya se avisó, «avisado h:mm»; en modo lectura no se pueden tocar;
  - pie con el resumen y «Listo».

  Pruebas: elegir dos grupos, buscar, marcar y desmarcar, y el modo lectura
- [X] T011 [US1] Crear `frontend/src/app/features/absences/components/absence-section/` (`.ts` y `.spec.ts`) según `mockups/Main.dc.html`:
  - no aparece antes del inicio ni en actividades canceladas;
  - en el plazo: «¿Quién no llegó?», el resumen, los ausentes con su estado (con el nombre de `Absence`, aunque ya no estén en la lista) y «Marcar quién no llegó», que abre el drawer, con el texto del plazo;
  - después del día: el resumen y la lista en modo lectura.

  Pruebas: los tres estados del plazo, el resumen y un ausente que ya no está en la convocatoria
- [X] T012 [US1] Incluir `<app-absence-section [activity]="current" />` después de la convocatoria en `frontend/src/app/features/activities/pages/activity-page/activity-page.ts` y ajustar `activity-page.spec.ts` (proveedores simulados)

---

## Fase 4: US2 — Avisar al acudiente (P1)

**Objetivo**: desde la marca, el owner abre WhatsApp con un mensaje editable y el jugador queda «Avisado».

**Prueba independiente**: paso 3 de `quickstart.md`.

- [X] T013 [P] [US2] Crear `frontend/src/app/features/absences/messages/absence-message.ts` con su `.spec.ts`: `absenceMessage({ recipientFirstName, playerFirstName, activity })` → «Hola, Juan. Mateo no llegó hoy al entrenamiento de las 4:00 p. m. en la Sede principal. ¿Está todo bien?»; sin destinatario conocido o si es el jugador, el saludo cambia («Hola, Mateo. No llegaste hoy…»); usa el tipo de actividad, `timeLabel` y el lugar (sede o cancha externa)
- [X] T014 [US2] En `absence.service.ts`, añadir `recipients(playerId)`: con convocatoria, los acudientes del convocado; sin ella, `GuardianRepository.listByPlayer`; misma regla que «Enviar» de la spec 012 (validados y no «el jugador»; si no hay, el celular del jugador; si tampoco, ninguno). Y `notified(playerId)`, que llama a `markNotified` y actualiza «Avisado» con la hora que devuelve. Pruebas en `absence.service.spec.ts`
- [X] T015 [US2] Crear `frontend/src/app/features/absences/components/absence-notice-drawer/` (`.ts` y `.spec.ts`) según `mockups/Notify.dc.html`:
  - destinatarios en opciones de radio con nombre, parentesco (`relationshipLabel`) y celular; preseleccionado el primero;
  - «Tu mensaje» (`textarea`) con el texto sugerido; al cambiar de destinatario se regenera solo si no se editó;
  - «Abrir WhatsApp» (`whatsappChat` y `openWhatsapp` de `call-ups/messages/whatsapp.ts`) y «Copiar mensaje» (`copyText`); sin celular, solo «Copiar mensaje»;
  - ambos llaman a `notified` y cierran el drawer con un aviso corto.

  Pruebas: el mensaje sugerido, editarlo, elegir destinatario, WhatsApp, copiar y el caso sin celular
- [X] T016 [US2] Conectar «Avisar» de `absence-list-drawer` con `absence-notice-drawer` y ajustar sus pruebas

---

## Fase 5: US3 — Revisión (P2)

- [X] T017 [US3] Revisar las pantallas con `/impeccable critique`, `/impeccable audit` y `/impeccable polish`: 360 px y escritorio, claro y oscuro, 44 px, foco y nombres accesibles; aplicar los hallazgos en los tres sitios de estilos

---

## Fase 6: Cierre

- [X] T018 Ejecutar Prettier en los archivos tocados, `npm run lint`, `npm run check:styles`, `npm run build` y las pruebas de la spec (`npx ng test --watch=false --include src/app/features/absences --include src/app/features/activities/pages/activity-page`); `npm run db:test` completo
- [X] T019 Completar las notas de implementación de este archivo y los resultados de `quickstart.md`; actualizar el estado en `AGENTS.md`, `docs/backlog/README.md`, HU-042 y EP-15
- [X] T020 Validación del responsable en el celular (`quickstart.md`, pasos 1 a 4)
- [X] T021 Tras el merge y con autorización: `npm run db:push -- --dry-run` y luego `npm run db:push`

---

## Dependencias

- Fase 1 → Fase 2 (T002 → T003 → T004; T006 y T007 después de T004) → US1 → US2 → US3 → Cierre.
- US2 necesita las filas marcadas de US1 (T016 depende de T010).
- [P]: T005 y T008 junto a T007; T013 en cualquier momento después de T006.

## Estrategia

MVP = Fases 1 a 3: marcar y ver el resumen ya da valor en la cancha. US2 completa el aviso. La revisión y el cierre van antes de la validación en el celular.
