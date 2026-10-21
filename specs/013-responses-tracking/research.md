# Investigación: Respuesta del acudiente y seguimiento

Decisiones técnicas de la spec 013. Las decisiones de producto están en DEC-31, DEC-33, DEC-38 a DEC-40 y DEC-46 (ADR-018); aquí solo se decide cómo construirlas.

## R1 — Vía pública: funciones de base de datos, sin tablas abiertas

- **Decisión**: el acudiente sin cuenta usa **tres funciones `security definer`** con `execute` para `anon` y `authenticated`: `public_call_up` (leer), `public_identify` (identificarse) y `public_respond` (responder). Reciben el enlace (`token`) y, cuando aplica, las llaves del dispositivo. Ninguna tabla concede `select` ni escritura a `anon`.
- **Motivo**: es la vía que ADR-018 anticipó («funciones de base de datos que validan el enlace, el recuerdo del dispositivo y el límite de cambios»). Cada función decide exactamente qué devuelve (FR-001, FR-017) y aplica las reglas en el servidor (FR-007). Son PL/pgSQL estándar: no usan `auth.uid()` ni el esquema `auth`, así que cumplen ADR-017. Las funciones del owner ya siguen este patrón (`add_player_guardian`, `assign_guardians`).
- **Alternativas descartadas**:
  - Políticas RLS para `anon` con el token en una cabecera: exponen tablas completas a un rol público y dependen de una cabecera propia de PostgREST.
  - Edge Functions: código y despliegue exclusivos de Supabase (ADR-017) y más piezas para el MVP.
  - Sesiones anónimas de Supabase Auth: dependen del esquema `auth` y dejan usuarios basura.

## R2 — Llave del dispositivo: secreto del servidor, guardado como huella

- **Decisión**: al identificarse, `public_identify` genera un secreto de 32 bytes aleatorios (`extensions.gen_random_bytes`), lo devuelve **una sola vez** y guarda solo su **huella SHA-256** (`extensions.digest`). El navegador guarda los secretos en `localStorage` (una lista, una por academia en la que se identificó) y los envía en cada llamada. `pgcrypto` se declara en la migración (`create extension if not exists pgcrypto with schema extensions`) para no depender de que la plataforma lo traiga.
- **Motivo**: DEC-31 pide «una llave secreta generada por PlayerTech (no el celular)». Guardar la huella evita que una filtración de la base permita suplantar dispositivos. Si se borra el almacenamiento, el dispositivo cuenta como nuevo (supuesto aprobado).
- **Alternativas descartadas**: cookie (el dominio de la API no es el de la app y complica la portabilidad); huella del navegador (*fingerprinting*: poco fiable y contraria a la privacidad); el celular como identificador (DEC-31 lo prohíbe).

## R3 — Personas creadas desde el enlace: autoría vacía y origen

- **Decisión**: `guardians.created_by` y `guardian_links.created_by` pasan a admitir nulo, con una columna `source` (`owner` o `link`) y una regla: `created_by` es obligatorio cuando `source = 'owner'`. Las filas creadas desde el enlace tienen `source = 'link'` y `created_by` nulo. Los dispositivos guardan el nombre y el parentesco que la persona escribió (`declared_name`, `declared_relationship`), para mostrarlos al owner cuando el celular coincide con un acudiente registrado (DEC-46: se conserva el nombre registrado).
- **Motivo**: no hay un usuario autenticado que figure como autor, y atribuirlo al owner sería falso (principio VIII). La auditoría sigue completa: origen, hora del servidor, dispositivo y autorización de datos.
- **Alternativa descartada**: un usuario técnico «enlace público» en `auth.users`: nueva referencia al esquema `auth` (ADR-017) y un usuario sin persona detrás.

## R4 — Respuestas: registro solo de inserción

- **Decisión**: tabla `call_up_responses` de **solo inserción**: cada respuesta es una fila (respuesta, motivo, texto de *Otro*, origen `guardian` u `owner`, vínculo y dispositivo o usuario owner, hora del servidor). La respuesta vigente de un jugador es la **última fila que cuenta**: la del owner, o la de un acudiente cuyo vínculo no esté rechazado y cuyo dispositivo no esté revocado. Una vista con `security_invoker` (`call_up_current_responses`) la calcula, y otra (`call_up_summaries`) da los totales por convocatoria y lista.
- **Límite de cambios**: en `public_respond`, la respuesta nueva de un acudiente se rechaza si el jugador ya tiene **4 respuestas de acudientes que cuentan** en esa convocatoria (la primera más 3 cambios). Reenviar la respuesta vigente sin cambios no inserta nada. Las respuestas del owner no cuentan (DEC-46).
- **Motivo**: el historial es el propio registro (DEC-33, CA-003 de HU-011) y no hay que mantener dos estados sincronizados. Una respuesta rechazada deja de contar sin borrar nada.
- **Excepción (principio XII)**: sin `deleted_at`, como `legal_acceptances`: el historial no se edita ni se borra.
- **Alternativa descartada**: una fila por jugador con la respuesta actual y una tabla de historial aparte: dos escrituras por respuesta y riesgo de desincronización.

## R5 — Validar y rechazar: funciones del owner

- **Decisión**:
  - `review_guardian(p_link_id, p_device_id, p_decision)`, `security invoker`, comprueba `has_academy_role(…, 'owner')`.
  - **Validar** pone el vínculo en `validated` y el dispositivo en `trusted`.
  - **Rechazar** revoca el dispositivo y, si el vínculo estaba pendiente, lo pone en `rejected` con `deleted_at`. Así una nueva identificación puede crear otro vínculo pendiente sin chocar con el índice único, y el rechazo no se anuncia (FR-009).
  - Si el vínculo ya estaba validado (un dispositivo nuevo de un acudiente conocido), rechazar solo revoca el dispositivo.
  - La ficha del jugador valida o rechaza vínculos pendientes con la misma función, con el dispositivo opcional.
- **Motivo**: DEC-40 («validar lo confirma junto con el dispositivo»). Una sola operación atómica, sin conceder `update(status)` directo.

## R6 — Respuesta del owner: inserción directa con RLS

- **Decisión**: el owner inserta en `call_up_responses` con `source = 'owner'` mediante su política RLS. Un trigger exige que las filas `guardian` solo lleguen desde `public_respond` y que el jugador esté convocado. El owner puede responder con la convocatoria cerrada (DEC-46), pero no si la actividad se eliminó.
- **Motivo**: sigue el patrón del proyecto (escrituras directas del owner por RLS) sin otra función.

## R7 — Frontend público: feature `call-up-response`

- **Decisión**: la página `/c/:token` pasa a una feature nueva, `features/call-up-response`, con estas capas:
  - `PublicCallUpRepository` (abstracto) y su implementación Supabase, que llama a las tres funciones;
  - `DeviceKeyStore`, sobre `localStorage`, con `try/catch` y lista vacía si el navegador no permite guardar;
  - `CallUpResponseService`, con signals;
  - la página, que tiene cuatro estados: elegir, identificarse, responder y solo lectura.

  La ruta sigue fuera del layout autenticado y funciona con o sin sesión. El identificarse va en la propia página, en pasos, no en un drawer: el acudiente solo tiene esa pantalla y no hay una pantalla de fondo.
- **Motivo**: la página del enlace es otro usuario y otro flujo, distinto de la sección del owner (`features/call-ups`). Separarla mantiene cada feature con una responsabilidad (principio III).

## R8 — Seguimiento del owner: dentro de la sección «Convocatoria»

- **Decisión**:
  - **Sección «Convocatoria»**: un resumen (Sí, Provisional, No y Sin respuesta), una etiqueta por jugador con su respuesta y «sin validar» cuando corresponde, y el botón «Actualizar».
  - **Al tocar a un jugador**: se abre el drawer `response-drawer`, con el historial, «Registrar respuesta» y «Validar» o «Rechazar».
  - **Ficha del jugador**: un bloque «Por validar» con los vínculos pendientes.
  - **Lista de actividades**: la etiqueta «12/17» sale de `call_up_summaries`, que se consulta por los ids de las actividades.
  - **Actualización**: al abrir, al volver a la pestaña (`visibilitychange`) y con el botón. No usa Realtime (DEC-46).
- **Motivo**: reutiliza la sección y los drawers de la spec 012. Las rutas y la navegación no cambian.

## R9 — Maquetas

- **Decisión**: maquetas de baja fidelidad a 360 px en `specs/013-responses-tracking/mockups/`, publicadas en un artifact privado para la aprobación del responsable antes de las tareas.
  - **Página del enlace (6 pantallas)**: elegir jugador, identificarse, responder (con motivo), confirmación, dispositivo recordado con hermanos, y solo lectura o no disponible.
  - **Owner (3 pantallas)**: sección con el seguimiento, drawer del jugador (historial, registrar respuesta, validar) y la ficha del jugador con «Por validar».
