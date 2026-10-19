# Contrato de base de datos

Columnas en `data-model.md`.

## Permisos por columna (`authenticated`)

| Tabla | select | insert | update | delete |
|---|---|---|---|---|
| call_ups | todas | — (solo por `create_call_up`, `security invoker` con su GRANT) | deadline, closed_at | — |
| call_up_lists | todas | academy_id, call_up_id, group_id, position, created_by | intro | sí (lista vacía) |
| call_up_players | todas | academy_id, call_up_id, list_id, player_id, created_by | list_id (mover) | sí |

`create_call_up` es `security invoker`: `authenticated` tiene `insert` en `call_ups (academy_id, activity_id, deadline, created_by)` y la política exige owner.

## Políticas

- **select**: `is_academy_member(academy_id)`.
- **insert, update y delete**: `has_academy_role(academy_id, array['owner'])` (e inserciones con `created_by = current_user_id()`).

## Errores que traduce el frontend

| Código | Caso | `AppErrorCode` |
|---|---|---|
| 23505 | Jugador ya convocado, o ya hay convocatoria | `duplicate` |
| 23514 | Fecha límite inválida, convocatoria cerrada, sin convocados, actividad no convocable, cambio de hora contra la fecha límite | `rule_violation` |
| 23503 | Jugador, grupo o lista de otra academia | `rule_violation` |
| PGRST116 | Ya no existe | `not_found` |
