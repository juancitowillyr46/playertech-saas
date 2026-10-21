---

description: "Lista de tareas para la respuesta del acudiente y el seguimiento (Fase 2, spec 4a)"
---

# Tareas: Respuesta del acudiente y seguimiento

**Input**: Documentos de diseño de `/specs/013-responses-tracking/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md, mockups/ (aprobadas el 2026-10-21)

**Tests**: Se incluyen porque la spec los exige (FR-021, SC-008). **Solo los de la spec**:
- pgTAP: el archivo nuevo y el conjunto completo antes del cierre;
- Vitest: `features/call-up-response` y los cambios en `call-ups`, `activities` y `players`.

El proceso está en `docs/engineering/testing.md`, sección «Proceso de pruebas en cada spec». La cobertura por criterio está en `contracts/acceptance-coverage.md`.

**Organización**: la Fase 2 reúne la base de datos, las opciones de respuesta, el almacén de llaves y los repositorios. Luego vienen las historias, en este orden:
1. US1 y US2: identificarse y responder.
2. US3 y US4: dispositivo recordado y situaciones especiales.
3. US5: seguimiento.
4. US6: validar.
5. US7: revisión.

## Convenciones

- **Antes de empezar:** leer la documentación de referencia de `plan.md` (principio XI). Las pantallas siguen `mockups/` y `contracts/ui-contracts.md`.
- **Patrones de las specs 009 a 012:**
  - `FormDrawer` con reinicio `untracked`;
  - `run()` con refresco;
  - `supabase-client-mock`;
  - `copyText` y `callUpLink`;
  - `shortName` y `fullNameWithNickname`;
  - Prettier solo en las carpetas nuevas o en los archivos tocados, conservando los finales de línea CRLF.
- **ADR-017:** `current_user_id()` en lo que hace el owner; las funciones públicas no usan ninguna función de autenticación. La migración se aplica con `npx supabase migration up`, nunca con `db:reset`, que borra los datos locales del responsable.

## Notas de implementación

- **Migración aplicada en local** con `npx supabase migration up`. Se revirtió y se volvió a aplicar dos veces dentro de una transacción, sin `db:reset`, para no tocar los datos locales de la Academia C:
  - el nombre de una restricción chocaba con el que Postgres genera para la columna `source`;
  - `created_at` de las respuestas pasó a `clock_timestamp()`: con `now()`, varias respuestas dentro de una misma transacción tenían la misma hora y «la última» quedaba al azar.
- **`public_call_up` devuelve `deviceKey`**: cuál de las llaves del navegador coincidió. El navegador ya la tiene, así que no revela nada, y evita una llamada extra por llave para saber con cuál responder.
- **`review_guardian` es `security definer`** con una comprobación explícita del owner, como `assign_guardians`, y no `security invoker` como decía el contrato. Así no hace falta conceder `update(status)` sobre vínculos y dispositivos.
- **Funciones auxiliares** (`public_device`, `public_open_list`, `guardian_responses_count`, `player_short_name`): revocan `execute` a todos los roles. Solo las usan las funciones públicas.
- **Errores de la vía pública**: llegan como mensaje en clave y se traducen a `PublicCallUpError`, con su texto para el acudiente.
- **Tarjeta de respuesta** (`response-card`): la misma para un jugador o para varios. «Sí» se registra al tocarlo; «Sí, provisional» y «No» abren el motivo. La confirmación «¡Listo!» va dentro de la tarjeta, en lugar de una pantalla aparte.
- **Pruebas del drawer del jugador**: están en `call-up-section.spec.ts`, que lo abre como lo hace el owner, igual que los drawers de la spec 012. No hay `response-drawer.spec.ts`.
- **Selector de acudientes** (spec 010): un acudiente con vínculo pendiente cuenta como «Ya son sus acudientes». Así no se le asigna dos veces mientras espera validación.
- **Dispositivo reconocido sin jugadores en esa lista** (el papá abre el enlace de otra actividad de otro hijo): la página se basa en `deviceKey` y no en si tiene jugadores en la lista, así que solo pide el parentesco. Se corrigió tras la pregunta del responsable del 2026-10-21; antes mostraba el formulario completo, cuyos datos el servidor ignoraba.
- **El jugador que responde por sí mismo no es su acudiente** (observación del responsable del 2026-10-21; DEC-46 ajustada): en la ficha va aparte como «Responde él mismo», con «Quitar» y sin editar; no cuenta en «N acudientes», no aparece en el selector ni en «Copiar de un hermano», y «Enviar» usa su celular de la ficha o el del vínculo. Una sola función, `relationshipLabel`, da «El jugador» en las pantallas que muestran el parentesco.
- **«Sin validar»** va en la segunda línea de la fila del seguimiento y no como otra etiqueta, para que el nombre quepa a 360 px.
- **Revisión con Impeccable (T028)**:
  - el detector, sobre la página del enlace renderizada (360 px, escritorio y enlace inexistente), terminó sin hallazgos;
  - se corrigió la jerarquía de títulos para usar la escala de DESIGN.md;
  - las pantallas del owner requieren sesión: se revisaron en el código (44 px, etiquetas, textos de al menos 14 px) y quedan para la validación en el celular.
- **Resultados**:
  - pgTAP 297/297 (51 nuevas);
  - Vitest de `call-up-response`, `call-ups`, `activities` y `players`: 151/151;
  - lint, `check:styles`, `check:bundle` y la compilación de producción en verde.

---

## Fase 1: Configuración

- [X] T001 Comprobar `npm run db:test` en verde (246/246)

---

## Fase 2: Fundaciones (bloqueantes)

- [X] T002 Escribir `supabase/tests/database/110-call-up-responses.test.sql` con todo lo de `contracts/database.md` («Pruebas pgTAP»), sobre `tests.academy_of('academia-a')` y la B:
  - `anon` sin `select` en ninguna tabla y con `execute` solo en las tres funciones públicas;
  - `public_call_up`:
    - `not_found` sin datos;
    - abierto: `roster` solo de esa lista, sin celulares ni apellidos completos;
    - con llave: `mine` con `changesLeft`;
    - `closed` y `cancelled` sin `roster`;
    - `removed`;
  - `public_identify`:
    - crea acudiente, vínculo y dispositivo pendientes con `source = 'link'`;
    - un celular existente reutiliza al acudiente y no cambia su nombre;
    - devuelve lo mismo exista o no el celular;
    - con `self`, sin nombre, toma el de la ficha;
    - sin autorización, `consent_required`;
    - un jugador de otra lista, `player_not_in_list`;
    - un dispositivo reconocido suma un hermano sin datos;
  - `public_respond`:
    - registra;
    - la misma respuesta no inserta;
    - la quinta distinta da `change_limit_reached`, con dos acudientes sumando al límite;
    - cerrada, `call_up_closed`;
    - vínculo rechazado, `device_not_recognized`;
    - *Otro* sin texto, `reason_text_required`;
    - motivo de otra respuesta, `invalid_answer`;
  - el owner responde con la convocatoria cerrada sin consumir el límite;
  - `review_guardian`: validar, rechazar (vínculo `rejected` con `deleted_at`, dispositivo `revoked`) y rechazar el dispositivo nuevo de un vínculo ya validado;
  - las vistas excluyen las respuestas rechazadas y marcan las de vínculos o dispositivos pendientes;
  - sin `update` ni `delete` en `call_up_responses`;
  - un jugador quitado y vuelto a sumar recupera su respuesta vigente y su historial;
  - aislamiento: el owner B no ve ni revisa nada de A.
- [X] T003 Crear `supabase/migrations/20261021100000_call_up_responses.sql` según `data-model.md` y `contracts/database.md`:
  - `create extension if not exists pgcrypto with schema extensions`;
  - en `guardians` y `guardian_links`: `created_by` con nulos, `source text not null default 'owner' check (source in ('owner','link'))` y `check (source = 'link' or created_by is not null)`;
  - tabla `guardian_devices`:
    - `secret_hash bytea` único;
    - `status` en (`pending`, `trusted`, `revoked`);
    - `declared_name` de 1 a 120 o nulo con `self`;
    - `declared_relationship`;
    - `last_seen_at`;
  - tabla `call_up_responses`:
    - `answer` en (`yes`, `maybe`, `no`);
    - `reason` según la respuesta (DEC-38) y nulo con `yes`;
    - `reason_text` de 1 a 200 solo con `reason = 'other'`;
    - `source` en (`guardian`, `owner`), con vínculo y dispositivo obligatorios en `guardian` y `created_by` obligatorio en `owner`;
    - índice `(call_up_id, player_id, created_at desc)`;
  - trigger que solo admite filas `guardian` desde `public_respond` (un ajuste local de la transacción) y exige que el jugador esté convocado;
  - vistas `call_up_current_responses` y `call_up_summaries` con `security_invoker = true`;
  - funciones `public_call_up`, `public_identify` y `public_respond` (`security definer`, `search_path = ''`, `execute` para `anon` y `authenticated`);
  - función `review_guardian` (`security invoker`, comprueba el owner);
  - RLS, políticas y GRANT: `insert` del owner solo con `source = 'owner'`, sin `update` ni `delete`;
  - comentarios en español.
- [X] T004 Aplicar con `npx supabase migration up`, ejecutar `npm run db:test` en verde y regenerar los tipos con `npm run db:types`
- [X] T005 [P] Documentar las tablas, las columnas nuevas y la vía pública en `docs/architecture/database-schema.md` y en `docs/architecture/supabase.md` (funciones `security definer` para `anon`)
- [X] T006 [P] Crear `frontend/src/app/features/call-up-response/options/response-options.ts` y su `.spec.ts`:
  - respuestas y sus etiquetas («Sí», «Sí, provisional», «No»);
  - motivos por respuesta (DEC-38) con sus etiquetas;
  - `changesLeftLabel(n)`: «Te quedan 3 cambios», «Te queda 1 cambio», «Escríbele a la academia para cambiarla»;
  - etiquetas cortas para el seguimiento.
- [X] T007 [P] Crear `features/call-up-response/data/device-key-store.ts` y su `.spec.ts`: `keys()` y `remember(key)` sobre `localStorage`, con hasta 10 llaves, sin duplicados y `try/catch`; si el almacenamiento falla, lista vacía
- [X] T008 Crear los modelos (`public-call-up.models.ts`) y `features/call-up-response/data/public-call-up.repository.ts`, `supabase-public-call-up.repository.ts` y su `.spec.ts` según `contracts/repositories.md`:
  - `load`, `identify` y `respond` por RPC;
  - filas tipadas;
  - errores en clave traducidos a `AppError` en español (`call_up_closed`, `player_not_in_list`, `device_not_recognized`, `change_limit_reached`, `consent_required`, `reason_text_required`, `invalid_answer`).
- [X] T009 Crear `features/call-up-response/services/call-up-response.service.ts` y su `.spec.ts`:
  - el estado `loading`, `choose`, `identify`, `respond`, `readonly`, `not_found` o `error` según la respuesta y las llaves;
  - `choose`;
  - `identify`, que guarda la llave y recarga;
  - `respond`, que actualiza `mine` sin recargar la página;
  - `addSomeone`.
- [X] T010 Registrar `PublicCallUpRepository` en `frontend/src/app.config.ts` y apuntar la ruta pública `/c/:token` de `app.routes.ts` a la página nueva. Retirar `features/call-ups/pages/public-call-up` y su prueba

---

## Fase 3: US1 y US2 — Identificarse y responder (P1) 🎯 MVP

- [X] T011 [US1] Crear `features/call-up-response/pages/call-up-response/call-up-response.ts` con la cabecera (academia y ficha de la actividad, con `dateLabel` y `timeLabel` de `colombia-time`) y el estado **Elegir** según `mockups/Main.dc.html`:
  - convocados de la lista en filas de 44 px;
  - buscador si hay más de 12;
  - las ayudas «Soy el jugador» y «¿No ves a tu jugador?».
- [X] T012 [US1] Añadir el estado **Identificarte** según `mockups/Identify.dc.html`:
  - el jugador elegido con «Cambiar»;
  - «¿Cómo te llamas?» (`autocomplete="name"`, de 1 a 120, oculto con «Soy el jugador»);
  - «Tu celular» (`autocomplete="tel"`, `inputmode="tel"`, colombiano de 10 dígitos que empieza por 3, con el validador existente);
  - parentesco con botones de radio grandes;
  - autorización obligatoria con enlace a la política vigente;
  - «Continuar»;
  - errores sin perder lo escrito.
- [X] T013 [US2] Añadir los estados **Responder** y **Listo** según `mockups/Respond.dc.html` y `Done.dc.html`:
  - tres botones grandes (`aria-pressed`);
  - motivo opcional en «Sí, provisional» y «No», con «Cuéntanos» (200, con contador) si es *Otro*;
  - «Enviar respuesta»;
  - «¡Listo!» con la respuesta, el motivo y los cambios restantes;
  - «Cambiar respuesta» y «¿Respondes por alguien más?»;
  - `change_limit_reached`, con «Escríbele a la academia».
- [X] T014 [US1] Escribir `call-up-response.spec.ts` para:
  - CA-001, CA-002 y CA-004 de HU-009: lista sin celulares, formulario y validaciones, «Soy el jugador» sin nombre, llave guardada;
  - CA-001 a CA-003 y CA-006 de HU-010: respuesta, motivo, *Otro*, cambios y límite.

---

## Fase 4: US3 y US4 — Dispositivo recordado y situaciones especiales (P1/P2)

- [X] T015 [US3] En la página, el estado de **dispositivo recordado** según `mockups/Remembered.dc.html`:
  - una tarjeta por jugador;
  - «Sí» se registra al tocarlo y la tarjeta confirma «Registrado: Sí · te quedan N cambios» (CA-001 de HU-010);
  - «Sí, provisional» y «No» abren el motivo y «Enviar»;
  - la respuesta actual con los cambios restantes;
  - «Ya no está convocado»;
  - «¿Respondes por alguien más?», que vuelve a **Elegir** con la llave actual y sin pedir datos.
- [X] T016 [US4] Añadir los estados **Solo lectura** y **No disponible** según `mockups/Closed.dc.html` y `NotFound.dc.html`:
  - «La convocatoria está cerrada» o «Se canceló la actividad», con la ficha y «Tus respuestas»;
  - «Esta convocatoria ya no está disponible» sin ningún dato.
- [X] T017 [US3] Ampliar `call-up-response.spec.ts` para:
  - CA-003, CA-005 y CA-006 de HU-009;
  - un rechazo que se trata como un dispositivo desconocido;
  - «Sí» directo con varias tarjetas.

---

## Fase 5: US5 — Seguimiento del owner (P1)

- [X] T018 [US5] Ampliar `features/call-ups` (modelos, `call-up.repository.ts`, `supabase-call-up.repository.ts` y su prueba) con `responses`, `summaries`, `history` y `respondAsOwner`, según `contracts/repositories.md`
- [X] T019 [US5] Ampliar `CallUpService` y su prueba:
  - signal `responses`;
  - `totals` computado, general y por lista;
  - lectura de las respuestas en `load` y `refresh`;
  - `respondAsOwner` e `history`.
- [X] T020 [US5] Ampliar `call-up-section.ts` según `mockups/Tracking.dc.html`:
  - resumen con Sí, Provisional, No y «Sin respuesta» (sin abreviar);
  - «Actualizar» (44 px), más una recarga al volver a la pestaña (`visibilitychange`, con limpieza al destruir);
  - «Sub-12 · 12/17» por lista;
  - etiqueta de respuesta, motivo, quién y hora por jugador, con «sin validar»;
  - el nombre abre el drawer.
- [X] T021 [US5] Crear `features/call-ups/components/response-drawer/response-drawer.ts` (`FormDrawer`) según `mockups/PlayerDrawer.dc.html`:
  - título con `fullNameWithNickname`;
  - respuesta actual;
  - historial con lo que no cuenta tachado;
  - «Registrar respuesta» (las tres opciones y el motivo, con el aviso «No cuenta para los cambios del acudiente»);
  - «Guardar respuesta», con el aviso breve de éxito (`notify`, FR-018).
- [X] T022 [US5] Mostrar «12/17» en `features/activities/pages/activities-page/activities-page.ts` en lugar de «Convocada»: `summaries` por los ids visibles, desde el repositorio o el servicio de la lista
- [X] T023 [US5] Escribir y ampliar pruebas en `call-up-section.spec.ts`, `response-drawer.spec.ts` y `activities-page.spec.ts` para CA-001 a CA-003 y CA-005 a CA-007 de HU-011

---

## Fase 6: US6 — Validar o rechazar (P1)

- [X] T024 [US6] En `features/players`, añadir a `GuardianRepository` y su implementación los métodos `pending(playerId)` (vínculos y dispositivos pendientes, con el nombre declarado y si el celular coincide con un acudiente registrado) y `review(linkId, deviceId, decision)` por RPC. Es la **única** vía de revisión (principio IV)
- [X] T025 [US6] En `response-drawer.ts`, añadir el recuadro **sin validar**:
  - quién respondió y desde qué;
  - la coincidencia («Coincide con Claudia Restrepo, mamá de Santiago D.»);
  - «Validar» y «Rechazar» (con confirmación), con el aviso breve de éxito (`notify`, FR-018) y recarga del seguimiento;
  - los datos salen de las columnas de `call_up_current_responses` y del historial definidas en `data-model.md`.
- [X] T026 [US6] En `features/players/pages/player-page/player-page.ts`, añadir el bloque **«Por validar»** según `mockups/PlayerPending.dc.html`, sobre «Acudientes», con «Validar» y «Rechazar» (con confirmación, FR-012) y el aviso breve de éxito (`notify`, FR-018). Si hay cambios, recarga los acudientes
- [X] T027 [US6] Escribir pruebas en `response-drawer.spec.ts` y `player-page.spec.ts` para CA-001 a CA-004 de HU-040 y CA-004 de HU-011

---

## Fase 7: US7 — Revisión (P2)

- [X] T028 [US7] Revisar con Impeccable, a 360 px y en escritorio, en claro y oscuro:
  - la página del enlace en todos sus estados;
  - la sección con el seguimiento;
  - el drawer del jugador;
  - el bloque «Por validar».

  Comprobar los 44 px, el foco, las etiquetas, las listas de 30 y que la página del enlace funcione dentro del navegador de WhatsApp.

---

## Fase 8: Cierre

- [X] T029 Ejecutar `npm run db:test` y Vitest de `features/call-up-response`, `call-ups`, `activities/pages/activities-page` y `players/pages/player-page`. Después, una sola vez, `npm run lint`, `npm run check:styles` y `npm run build`
- [X] T030 Recorrer `quickstart.md` y anotar los resultados; el responsable valida desde el celular, con dos navegadores para simular a dos acudientes
- [X] T031 Confirmar que la academia A del seed no tiene respuestas ni dispositivos y que `npm run db:test` está en verde
- [X] T032 [P] Marcar HU-009, HU-010, HU-011 y HU-040 como «Terminada (entorno local)» en las HU, en EP-06, EP-07, EP-10, en `docs/backlog/README.md` y en `AGENTS.md`. Actualizar las mitigaciones de SEC-03 en `docs/engineering/security.md`
- [ ] T033 Tras el merge y con autorización: `npm run db:push`, primero con `--dry-run`

---

## Dependencias

- **Base de datos:** T001 → T002 → T003 → T004. T005 a T007 van en paralelo tras T004. Luego T008 → T009 → T010.
- **Historias:**
  - US1 y US2 (T011 a T014) → US3 y US4 (T015 a T017);
  - US5 (T018 a T023) puede empezar tras T004, en paralelo con US1 a US4;
  - US6 (T024 a T027) necesita T021.
- **Al final:** US7 y el cierre.

## Ejemplo de paralelismo

Tras T004: T005, T006 y T007 a la vez. Tras la Fase 2: una persona hace la página del enlace (T011 a T017) y otra el seguimiento (T018 a T023).

## Estrategia

- **MVP:** las Fases 1 a 3, en las que el acudiente se identifica y responde, y que ya se pueden probar con las vistas en la base de datos.
- **Después:** el dispositivo recordado y los estados especiales, luego el seguimiento y la validación, y al final la revisión y el cierre.
- **Antes del commit y del PR:** el responsable valida desde el celular.
