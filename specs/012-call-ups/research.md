# Investigación: Convocatoria y mensaje de WhatsApp

## R1 — Tablas

- **`call_ups`**: `activity_id` (clave compuesta hacia `activities`), `deadline` (null), `closed_at` (null), `deleted_at`. Único `(activity_id) where deleted_at is null`.
- **`call_up_lists`**:
  - `call_up_id`, `group_id` (null si es la lista única sin grupo; clave compuesta hacia `groups`);
  - `token` único (`replace(gen_random_uuid()::text, '-', '')`, 122 bits aleatorios, nativo de PostgreSQL, ADR-017);
  - `intro` (texto propio, hasta 500 caracteres) y `position`.
- **`call_up_players`**: `call_up_id`, `list_id` y `player_id` (claves compuestas), con clave primaria `(call_up_id, player_id)`: un jugador, una vez por convocatoria. Borrado físico (Complejidad del plan).

## R2 — Estado «abierta» calculado

- **Abierta** = `closed_at is null` y `now() < coalesce(deadline, activities.starts_at)`. No hay tareas programadas: el cierre automático (CA-005 de HU-008) es una comparación.
- **Función `call_up_is_open(call_up_id)`** (`stable`): la usan los triggers y el frontend la replica con los mismos datos para pintar el estado.

## R3 — Reglas en la base de datos

| Regla | Dónde |
|---|---|
| Fecha límite futura y anterior al inicio | Trigger en `call_ups` (`before insert or update of deadline`) |
| Convocatoria cerrada inmutable: no se suman, quitan ni mueven convocados, ni cambia la fecha límite o el texto | Triggers en `call_up_players`, `call_up_lists` y `call_ups` |
| Solo actividades próximas y programadas | Trigger al insertar `call_ups` |
| Cancelar la actividad cierra la convocatoria | Trigger `after update of status` en `activities` (`closed_at = now()`) |
| Un cambio de hora no deja la fecha límite después del inicio | Trigger `before update of starts_at` en `activities`: si una convocatoria abierta tiene `deadline >= new.starts_at`, responde `23514` |
| Un jugador, una vez por convocatoria | Clave primaria `(call_up_id, player_id)` |

## R4 — `create_call_up`

- **Firma**: `create_call_up(p_activity_id uuid, p_deadline timestamptz, p_lists jsonb) returns uuid`, `security invoker`, con `set search_path = ''`.
- **`p_lists`**: `[{ "group_id": uuid|null, "player_ids": [uuid] }]`.
- **Qué hace**: inserta la convocatoria, las listas y los convocados en una transacción. Las reglas (RLS, claves compuestas, triggers) aplican igual.
- **Sin convocados**: si no llega ninguno, `23514` (CA-006 de HU-007).
- **Ajustes posteriores**: sumar, quitar y mover se hacen con inserciones y borrados directos en `call_up_players` (RLS y triggers). Una lista que queda vacía se borra (borrado físico de la lista y su enlace; el frontend lo pide al quitar al último convocado).

## R5 — Mensajes y WhatsApp

- **`call-up-messages.ts`** (funciones puras, en hora de Colombia con `colombia-time`):
  - `listMessage(intro, activity, list, link)`: el texto propio y el bloque generado (tipo y título, fecha, citación, inicio y fin, lugar y dirección, rival y torneo, observaciones, «Responde hasta…», «Convocados (N):» con `shortName · apodo`, y «Responde aquí: [enlace]»);
  - `personalMessage(intro, activity, player, link)`;
  - `cancellationNotice(activity, link)` y `changeNotice(before, after, link)`, que indica qué cambió: fecha, hora o lugar.
- **`whatsapp.ts`**:
  - `whatsappChat(phone, text)` → `https://wa.me/57{celular}?text={texto codificado}`;
  - `shareText(text)` → `navigator.share({ text })` si existe (en el celular abre el menú, con WhatsApp entre las opciones); si no, `https://wa.me/?text=…` (WhatsApp Web, para elegir el chat);
  - `copyText` → `navigator.clipboard.writeText`.
- **Enlace de la lista**: `{origen}/c/{token}`.

## R6 — Frontend

- **`CallUpRepository`**:
  - `getByActivity(activityId)`: una consulta con las listas, los convocados (jugador) y los acudientes validados con su celular;
  - `create`;
  - `addPlayers`, `removePlayer`, `movePlayer`;
  - `setDeadline`, `close` y `saveIntro`.
- **`CallUpService`**: estado de la convocatoria de la actividad, `isOpen` calculado y las operaciones con `run()` y refresco.
- **Componentes**:
  - `CallUpSection`, en el detalle de la actividad: estado, fecha límite, listas con su número de convocados y «Mensaje», convocados con «Enviar», «Ajustar convocados» y «Cerrar»;
  - `CallUpDrawer`: grupos (casillas), lista resultante con «Quitar», «Sumar jugador» (buscador de todos los activos) y la lista destino, y la fecha límite;
  - `MessageDrawer`: el texto propio (textarea), la vista previa del bloque (solo lectura) y los botones;
  - `NoticeDrawer`: el aviso de cancelación o cambio, por lista.
- **Detalle de la actividad**: al cancelar o al guardar un cambio de fecha, hora o lugar con convocatoria abierta, ofrece el `NoticeDrawer`.
- **Página pública**: `/c/:token`, fuera del layout autenticado y sin consultas: «Pronto podrás responder aquí».

## R7 — Navegación

Sin destinos nuevos: la convocatoria vive en el detalle de la actividad. El listado de actividades muestra el sello «Convocada» en las que tienen convocatoria (un `exists` embebido).

## R8 — Pruebas y maquetas

- **pgTAP `100-call-ups.test.sql`**:
  - RLS en las tres tablas;
  - `create_call_up` crea listas, tokens únicos de 32 caracteres y convocados;
  - sin convocados, `23514`;
  - jugador repetido, `23505`;
  - fecha límite pasada o después del inicio, `23514`;
  - actividad cancelada o pasada no se convoca;
  - cerrar y luego sumar, quitar o editar, `23514`;
  - cancelar la actividad cierra la convocatoria;
  - cambiar la hora de la actividad antes de la fecha límite, `23514`;
  - un jugador o grupo de otra academia, `23503`;
  - aislamiento A/B;
  - anon sin acceso.
- **Vitest**: los mensajes (bloque completo, apodos, competencia, fecha límite, avisos con lo que cambió), los enlaces de WhatsApp (formato +57 y codificación), el repositorio, el servicio y los componentes.
- **Maquetas**: 5, a 360 px:
  1. detalle de la actividad con la convocatoria;
  2. drawer «Convocar»;
  3. drawer «Mensaje»;
  4. «Enviar al acudiente» (elegir acudiente);
  5. aviso de cambio.
