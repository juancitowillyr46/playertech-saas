---

description: "Lista de tareas para los avisos en la aplicación (Fase 2, spec 4b)"
---

# Tareas: Avisos en la aplicación

**Input**: Documentos de diseño de `/specs/014-in-app-notices/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md, mockups/ (aprobadas el 2026-10-21)

**Tests**: se incluyen porque la spec los exige (FR-012). Son solo los de la spec, según `docs/engineering/testing.md`:
- pgTAP: el archivo nuevo y, antes del cierre, el conjunto completo;
- Vitest: `core/notices`, la navegación, el inicio, el drawer y los cambios en `call-ups` y `players`.

**Organización**: la base de datos y `core/notices` van en la Fase 2. Después siguen las historias:
1. US1: contador.
2. US2: avisos del inicio y visto.
3. US3: drawer de pendientes.
4. US4: revisión.

## Convenciones

- **Antes de empezar:** leer la documentación de referencia de `plan.md` (principio XI). Las pantallas siguen `mockups/` y `contracts/contracts.md`.
- **Patrones de las specs 012 y 013:**
  - `FormDrawer` con reinicio `untracked`;
  - `supabase-client-mock`;
  - el `matchMedia` simulado para `p-select`;
  - `relationshipLabel`;
  - Prettier solo en los archivos tocados.
- **ADR-017:** `current_user_id()`; sin `auth.uid()` nuevos. La migración se aplica con `npx supabase migration up`, nunca con `db:reset`.

---

## Fase 1: Configuración

- [ ] T001 Comprobar `npm run db:test` en verde (297/297)

---

## Fase 2: Fundaciones (bloqueantes)

- [ ] T002 Escribir `supabase/tests/database/120-in-app-notices.test.sql` con todo lo de `contracts/contracts.md` (base de datos), sobre `tests.academy_of('academia-a')` y la B:
  - **`guardian_pending_reviews`:**
    - un vínculo pendiente con su dispositivo en una fila;
    - el dispositivo nuevo de un vínculo validado en otra;
    - un rechazado o revocado no aparece;
    - el «el jugador» validado no aparece; el pendiente sí.
  - **`call_up_new_responses`:**
    - sin visita cuenta todas las respuestas de acudientes;
    - tras `mark_call_up_seen` solo cuenta las posteriores;
    - no cuenta las del owner, las rechazadas ni las de jugadores quitados;
    - una actividad eliminada no aparece;
    - una convocatoria cerrada o una actividad cancelada siguen avisando sus respuestas nuevas.
  - **Academia actual:** un owner de dos academias solo ve los pendientes y avisos de la academia actual (`current_academy_id()`).
  - **`mark_call_up_seen`:** una fila por usuario y convocatoria; la segunda llamada actualiza `seen_at`.
  - **Aislamiento:**
    - el owner B no ve pendientes, respuestas nuevas ni visitas de A;
    - B no marca una convocatoria de A;
    - `anon` no tiene acceso.
- [ ] T003 Crear `supabase/migrations/20261022100000_in_app_notices.sql` según `data-model.md`:
  - **Tabla `call_up_visits`:**
    - PK `(call_up_id, user_id)`;
    - FK compuesta a `call_ups`;
    - `user_id default public.current_user_id()`, sin FK a `auth.users`;
    - `seen_at timestamptz not null default now()`.
  - **RLS** de sus propias filas (`user_id = current_user_id()` y `is_academy_member`), con `select`, `insert` y `update(seen_at)`, sin `delete`.
  - **Función `mark_call_up_seen`** (`security invoker`, *upsert*; la academia sale de la convocatoria).
  - **Vistas** `guardian_pending_reviews` y `call_up_new_responses` con `security_invoker = true`, filtradas por `academy_id = current_academy_id()`.
  - **GRANT**, sin `anon`.
  - **Comentarios** en español.
- [ ] T004 Aplicar con `npx supabase migration up`, ejecutar `npm run db:test` en verde y luego `npm run db:types`
- [ ] T005 [P] Documentar la tabla y las vistas en `docs/architecture/database-schema.md` (sección de la spec 014)
- [ ] T006 Crear `frontend/src/app/core/notices/` con:
  - `notices.models.ts` (`NewResponsesNotice`: `callUpId`, `activityId`, título, fecha y `newCount`);
  - `notices.repository.ts` (abstracto: `pendingCount` y `newResponses`);
  - `supabase-notices.repository.ts` y su `.spec.ts`;
  - `notices.service.ts` y su `.spec.ts`:
    - signals `pendingCount` y `newResponses`;
    - `refresh()`;
    - `refreshOnNavigation()` con un mínimo de 30 segundos;
    - escucha `NavigationEnd` y `visibilitychange` solo con sesión y academia, con limpieza al destruir.

  Registrar `NoticesRepository` en `frontend/src/app.config.ts`

---

## Fase 3: US1 — Contador en la navegación (P1) 🎯 MVP

- [ ] T007 [US1] En `frontend/src/app/layout/component/app.bottomnav.ts` y `app.menuitem.ts`, mostrar un `p-badge` en el destino «Actividades» cuando `NoticesService.pendingCount() > 0`:
  - el valor es el número, o «99+» a partir de 100;
  - el nombre accesible es «Actividades, N acudientes por validar»;
  - el destino se identifica por su ruta `/activities`.

  Ajustar la posición solo con utilidades o tokens; sin CSS sobre `.p-badge`.
- [ ] T008 [US1] Escribir pruebas en `app.bottomnav.spec.ts` y en el menú: con y sin pendientes, y «99+» (CA-001 de HU-041)

---

## Fase 4: US2 — Avisos del inicio y visto (P1)

- [ ] T009 [US2] Añadir `markSeen(callUpId)` a `features/call-ups/data/call-up.repository.ts`, a su implementación (RPC `mark_call_up_seen`) y a su prueba. En `CallUpService.load`, después de leer las respuestas:
  - llamar a `markSeen`, sin bloquear ni fallar la carga si falla;
  - después, llamar a `NoticesService.refresh()`.
- [ ] T010 [US2] En `features/home/pages/home-page/home-page.ts`, añadir la sección **«Avisos»** arriba del resumen, según `mockups/Main.dc.html` y `Desktop.dc.html`:
  - «N acudientes por validar» con un botón que abre el drawer de la Fase 5;
  - hasta 5 avisos de respuestas nuevas, ordenados por fecha de la actividad, con texto «N respuestas nuevas · <título> · <día>» y `routerLink` a `/activities/:id`;
  - «Ver más (N)» muestra el resto;
  - en escritorio, dos columnas;
  - la sección no aparece si no hay avisos;
  - si falla la lectura, se omite la sección sin romper el inicio y el contador conserva su último valor (FR-009);
  - se refresca al entrar al inicio.
- [ ] T011 [US2] Escribir pruebas en `home-page.spec.ts` y `call-up.service.spec.ts` para CA-002 y CA-003 de HU-041: avisos, enlace, «Ver más», sin avisos sin sección, y `load` que marca visto y refresca

---

## Fase 5: US3 — Drawer de pendientes (P1)

- [ ] T012 [US3] En `features/players/data`:
  - añadir `pendingByAcademy()`, que lee `guardian_pending_reviews` con el jugador (`AcademyPendingGuardian` en `player.models.ts`);
  - cambiar `pending(playerId)` para que lea la misma vista filtrada por jugador (una sola regla, R1);
  - llamar a `NoticesService.refresh()` después de validar o rechazar en `PlayerDetailService.review` y en `CallUpService.review` (spec 013), para que el contador no espere al siguiente intervalo (FR-007);
  - actualizar las pruebas del repositorio.
- [ ] T013 [US3] Crear `features/players/components/pending-reviews-drawer/pending-reviews-drawer.ts` (`FormDrawer`, sin guardar, «Cerrar»), según `mockups/Pending.dc.html`:
  - título «Por validar (N)»;
  - grupos por jugador, con su nombre completo;
  - en cada pendiente:
    - nombre declarado y parentesco con `relationshipLabel`;
    - celular y cuándo;
    - «Coincide con…»;
    - «Validar» (directo) y «Rechazar» (con confirmación), con `GuardianRepository.review` y un aviso breve de éxito;
  - al terminar, recarga la lista y llama a `NoticesService.refresh()`;
  - vacío: «No hay acudientes por validar».
- [ ] T014 [US3] Abrir el drawer desde el aviso del inicio (T010) y escribir `pending-reviews-drawer.spec.ts` para CA-004 de HU-041: grupos, validar, rechazar con confirmación y el estado vacío

---

## Fase 6: US4 — Revisión (P2)

- [ ] T015 [US4] Revisar con Impeccable, a 360 px y en escritorio, en claro y oscuro: el contador, la sección «Avisos» y el drawer. Comprobar 44 px, foco, etiquetas, nombres accesibles del contador, y textos de al menos 14 px

---

## Fase 7: Cierre

- [ ] T016 Ejecutar:
  - `npm run db:test`;
  - Vitest de `core/notices`, `layout`, `features/home`, `features/players` y `features/call-ups`.

  Después, una sola vez, `npm run lint`, `npm run check:styles` y `npm run build`.
- [ ] T017 Recorrer `quickstart.md` y anotar los resultados; el responsable valida desde el celular
- [ ] T018 Confirmar que la academia A del seed no tiene visitas y que `npm run db:test` está en verde
- [ ] T019 [P] Marcar HU-041 como «Terminada (entorno local)» en la HU, en EP-07, en `docs/backlog/README.md` y en `AGENTS.md`
- [ ] T020 Tras el merge y con autorización: `npm run db:push`, primero con `--dry-run`

---

## Dependencias

- **Base de datos:** T001 → T002 → T003 → T004.
- **Después de T004:** T005 y T006, en paralelo.
- **Historias:**
  - US1 (T007 y T008) necesita T006;
  - US2 (T009 a T011) necesita T006;
  - US3 (T012 a T014) necesita T004;
  - T014 necesita T010.
- **Al final:** US4 y el cierre.

## Ejemplo de paralelismo

Tras T006: el contador (T007 y T008), el visto (T009) y el repositorio de pendientes (T012) a la vez.

## Estrategia

- **MVP:** Fases 1 a 3 (el contador).
- **Después:** los avisos del inicio, el drawer y la revisión.
- **Antes del commit y del PR:** el responsable valida desde el celular.
