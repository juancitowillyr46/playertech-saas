# Modelo de datos: Avisos en la aplicación

Migración nueva: `supabase/migrations/20261022100000_in_app_notices.sql`. Reglas: `academy_id` con claves compuestas, RLS, hora del servidor y sin usos nuevos de `auth.uid()` (ADR-012, ADR-017).

## Tabla nueva: `call_up_visits`

| Columna | Tipo | Reglas |
|---|---|---|
| `academy_id` | uuid | FK academias |
| `call_up_id` | uuid | FK compuesta a `call_ups` |
| `user_id` | uuid | `default public.current_user_id()`; sin clave hacia `auth.users` (ADR-017) |
| `seen_at` | timestamptz | Hora del servidor de la última vez que el usuario abrió la actividad |

Clave primaria `(call_up_id, user_id)`. Sin borrado lógico (R2, principio XII).

**RLS**: cada usuario lee y escribe solo sus filas (`user_id = current_user_id()`) de academias a las que pertenece (`is_academy_member`). Sin `delete`.

## Función `mark_call_up_seen(p_call_up_id uuid) returns void`

`security invoker`. Inserta o actualiza la visita del usuario actual con `seen_at = now()`; la academia sale de la convocatoria (nunca del cliente). Falla si el usuario no es miembro de esa academia (RLS).

## Vistas (`security_invoker = true`)

Las dos vistas filtran por `academy_id = current_academy_id()`: un owner de varias academias solo ve la actual (FR-001). La RLS sigue protegiendo los datos; el filtro es de presentación y usa la función de autorización existente, nunca un dato del cliente.

### `guardian_pending_reviews`

Un pendiente por fila (misma regla que `pending(playerId)` de la spec 013):

| Columna | Origen |
|---|---|
| `academy_id`, `player_id`, `player_first_names`, `player_last_names`, `player_nickname` | Jugador activo y no eliminado |
| `link_id` | Vínculo pendiente, o nulo si el pendiente es un dispositivo de un vínculo validado |
| `device_id` | Último dispositivo pendiente del acudiente, o nulo |
| `guardian_name`, `declared_name`, `relationship`, `phone` | Acudiente y dispositivo |
| `created_at` | Hora del dispositivo o del vínculo |
| `phone_match` | El acudiente existía antes del dispositivo |

Excluye vínculos eliminados o rechazados, dispositivos revocados y el vínculo «el jugador» validado (no es acudiente; DEC-46). Los pendientes de «Soy el jugador» sí aparecen, porque hay que validarlos.

### `call_up_new_responses`

Por convocatoria de la academia con al menos una respuesta nueva para el usuario actual:

| Columna | Detalle |
|---|---|
| `academy_id`, `call_up_id`, `activity_id` | |
| `activity_type`, `activity_opponent`, `activity_starts_at`, `activity_status` | Para el texto del aviso |
| `new_count` | Respuestas `guardian` que cuentan, de jugadores convocados activos, con `created_at > seen_at` del usuario actual (o todas sin visita) |

Excluye actividades y convocatorias eliminadas. Las respuestas del owner no cuentan (DEC-47).

## Privilegios

| Objeto | `anon` | `authenticated` |
|---|---|---|
| `call_up_visits` | Nada | `select`, `insert` y `update(seen_at)` de sus filas |
| Vistas | Nada | `select` (heredan la RLS) |
| `mark_call_up_seen` | Nada | `execute` |
