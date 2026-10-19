---

description: "Lista de tareas para convocatoria y mensaje de WhatsApp (Fase 2, spec 3)"
---

# Tareas: Convocatoria y mensaje de WhatsApp

**Input**: Documentos de diseño de `/specs/012-call-ups/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md, mockups/ (aprobadas)

**Tests**: Se incluyen porque la spec las exige (FR-013, SC-006). **Solo las de la spec**: pgTAP completo y Vitest de `features/call-ups` y de los cambios en `features/activities`. Una prueba que falle se reintenta como máximo una vez; el commit no se encadena a las pruebas.

**Organización**: base de datos, mensajes, repositorio y servicio en la Fase 2. Orden: US1 y US2 (convocar y ajustar), US3 y US4 (mensaje y compartir), US5 (avisos) y US6.

## Convenciones

- Antes de empezar, leer la documentación de referencia de `plan.md` (principio XI). Las pantallas siguen `mockups/` y `contracts/ui-contracts.md`.
- Patrón de las specs 009 a 011: `FormDrawer` con reinicio `untracked`, `run()` con refresco, `supabase-client-mock`, horas con listas desplegables de `activity-form-drawer`.
- `current_user_id()` (ADR-017). La migración se aplica con `npx supabase migration up`.

---

## Fase 1: Configuración

- [ ] T001 Comprobar `npm run db:test` en verde (220/220)

---

## Fase 2: Fundaciones (bloqueantes)

- [ ] T002 Escribir `supabase/tests/database/100-call-ups.test.sql` (research R8). Debe cubrir:
  - RLS en las tres tablas;
  - `create_call_up`: listas con tokens únicos de 32 caracteres, lista sin grupo, convocados;
  - sin convocados, `23514`;
  - jugador repetido en la convocatoria, `23505`;
  - segunda convocatoria de la misma actividad, `23505`;
  - fecha límite pasada o no anterior al inicio, `23514`;
  - actividad cancelada o pasada no se convoca;
  - `call_up_is_open`;
  - cerrar y luego sumar, quitar, mover, cambiar la fecha límite o el texto, `23514`;
  - cancelar la actividad cierra la convocatoria;
  - mover el inicio a una hora no posterior a la fecha límite, `23514`;
  - jugador o grupo de la academia B, `23503`;
  - aislamiento A/B;
  - anon sin acceso.
- [ ] T003 Crear `supabase/migrations/20261019100000_call_ups.sql` según `data-model.md` y `contracts/database.md`:
  - tablas, claves e índices;
  - `call_up_is_open`, `create_call_up` (`security invoker`);
  - triggers `call_ups_guard`, `call_up_members_guard` y `activities_call_up_sync`;
  - RLS, políticas y GRANT;
  - comentarios en español.
- [ ] T004 Aplicar con `npx supabase migration up`, ejecutar `npm run db:test` en verde y regenerar los tipos con `npm run db:types`
- [ ] T005 [P] Documentar las tablas en `docs/architecture/database-schema.md`, sacando la convocatoria de «Pendiente»
- [ ] T006 [P] Crear `frontend/src/app/features/call-ups/messages/call-up-messages.ts` y su `.spec.ts`:
  - `listMessage` (texto propio y bloque: título, fecha, citación, inicio y fin, lugar y dirección, torneo, observaciones, «Responde hasta…», «Convocados (N): …» con `shortName · apodo`, «Responde aquí: enlace»);
  - `personalMessage`;
  - `cancellationNotice`;
  - `changeNotice(antes, después)`, con «(antes …)» solo en lo que cambió;
  - textos vacíos sin líneas sobrantes.
- [ ] T007 [P] Crear `frontend/src/app/features/call-ups/messages/whatsapp.ts` y su `.spec.ts`:
  - `whatsappChat(phone, text)` → `https://wa.me/57…?text=…` codificado;
  - `shareText`: `navigator.share` o `https://wa.me/?text=…`;
  - `copyText`;
  - `callUpLink(token)` con el origen actual y `/c/`.
- [ ] T008 Crear los modelos (`call-up.models.ts`), `data/call-up.repository.ts`, `supabase-call-up.repository.ts` y su `.spec.ts` según `contracts/repositories.md`:
  - `getByActivity` en una consulta, con listas, grupos, convocados y acudientes validados no retirados;
  - `create` (RPC);
  - `addPlayers`, `removePlayer` (y borrar la lista si queda vacía), `movePlayer`;
  - `setDeadline`, `close` y `saveIntro`;
  - errores.
- [ ] T009 Crear `features/call-ups/services/call-up.service.ts` y su `.spec.ts`: `load(activity)`, `isOpen` calculado, `candidates()` (jugadores activos con sus grupos, de `PlayerRepository`), las operaciones con `run()` y refresco, y `not_found`
- [ ] T010 Registrar `CallUpRepository` en `frontend/src/app.config.ts`. Añadir la ruta pública `/c/:token` en `app.routes.ts`, fuera del layout autenticado, con `features/call-ups/pages/public-call-up/public-call-up.ts` (marca y «Pronto podrás responder aquí», sin consultas) y su `.spec.ts`

---

## Fase 3: US1 y US2 — Convocar y ajustar (P1) 🎯 MVP

- [ ] T011 [US1] Crear `features/call-ups/components/call-up-drawer/call-up-drawer.ts` según `mockups/CallUp.dc.html`:
  - grupos con casilla y su número de jugadores;
  - la lista por grupo con «Quitar»;
  - «Sumar jugador» (buscador de activos que no están, con la lista destino si hay varias);
  - fecha límite (fecha y hora con listas, futura y antes del inicio);
  - el botón «Convocar N» o «Guardar»;
  - en modo ajuste, las listas actuales.
- [ ] T012 [US1] Crear `features/call-ups/components/call-up-section/call-up-section.ts` según `mockups/Main.dc.html`:
  - sin convocatoria: «Convocar» (solo si la actividad es próxima y programada);
  - con convocatoria: estado y fecha límite, listas con «N convocados» y «Mensaje», convocados con «Enviar»;
  - abierta: «Ajustar convocados» y «Cerrar convocatoria» (con confirmación).
- [ ] T013 [US1] Integrar `CallUpSection` en `features/activities/pages/activity-page/activity-page.ts`; en el listado de actividades, el sello «Convocada» (embebido `call_ups(id)` en `supabase-activity.repository.ts`)
- [ ] T014 [US1] Escribir `call-up-drawer.spec.ts` y `call-up-section.spec.ts`:
  - CA-001 a CA-007 de HU-007;
  - CA-001 a CA-004 de HU-008;
  - el caso de un jugador de otro grupo en la lista elegida.

---

## Fase 4: US3 y US4 — Mensaje y compartir (P1)

- [ ] T015 [US3] Crear `features/call-ups/components/message-drawer/message-drawer.ts` según `mockups/Message.dc.html` y `Send.dc.html`:
  - **modo lista**: «Tu texto» (500 caracteres, se guarda al compartir o copiar), vista previa del bloque (solo lectura), «Compartir en el grupo» y «Copiar»;
  - **modo personal**: elegir acudiente (radio, si hay varios), texto, bloque, «Abrir WhatsApp» y «Copiar»;
  - sin acudientes y con celular, «Enviar al jugador»; sin ninguno, solo «Copiar».
- [ ] T016 [US4] Escribir `message-drawer.spec.ts`:
  - CA-001 a CA-004 de HU-012;
  - CA-001 a CA-004 de HU-013, con `window.open` y `navigator.clipboard` simulados.

---

## Fase 5: US5 — Avisos (P2)

- [ ] T017 [US5] Crear `features/call-ups/components/notice-drawer/notice-drawer.ts` según `mockups/Notice.dc.html` (un aviso por lista, texto propio no guardado, «Compartir en el grupo», «Copiar» y «Ahora no»)
- [ ] T018 [US5] En `activity-page.ts`: con convocatoria abierta, al guardar un cambio de fecha, hora o lugar abrir el aviso de cambio (comparando antes y después), y al cancelar, el de cancelación. Traducir el `23514` del cambio de hora contra la fecha límite a «La fecha límite de la convocatoria quedaría después del inicio: cámbiala primero». Pruebas en `activity-page.spec.ts` (CA-001 a CA-004 de HU-038)

---

## Fase 6: US6 — Revisión (P2)

- [ ] T019 [US6] Revisar a 360 px y en escritorio, en claro y oscuro, la sección y los tres drawers con Impeccable (detector y revisión manual): 44 px, foco, etiquetas, listas de 30 convocados

---

## Fase 7: Cierre

- [ ] T020 Ejecutar `npm run db:test` y `npx ng test --watch=false --include src/app/features/call-ups --include src/app/features/activities`; después, una sola vez, `npm run lint`, `npm run check:styles` y `npm run build`
- [ ] T021 Recorrer `quickstart.md` y anotar los resultados; el responsable valida desde el celular
- [ ] T022 Confirmar que la academia A del seed no tiene convocatorias y que `npm run db:test` está en verde
- [ ] T023 [P] Marcar HU-007, HU-008, HU-012, HU-013 y HU-038 como «Terminada (entorno local)» en las HU, en EP-05, en EP-08, en `docs/backlog/README.md` y en `AGENTS.md`
- [ ] T024 Tras el merge y con autorización: `npm run db:push`, primero con `--dry-run`

---

## Dependencias

- T001 → T002 → T003 → T004. T005 a T007 en paralelo tras T004; T008 → T009 → T010.
- US1 (T011 a T014) → US3 y US4 (T015 y T016) → US5 (T017 y T018). US6 y el cierre, al final.

## Estrategia

MVP: Fases 1 a 4 (convocar y compartir). Luego los avisos, la revisión y el cierre. El responsable valida desde el celular antes del commit y del PR.
