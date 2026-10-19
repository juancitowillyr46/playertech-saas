# Contrato de base de datos

Columnas en `data-model.md`.

## Permisos por columna (`authenticated`)

| Tabla | select | insert | update | delete |
|---|---|---|---|---|
| external_fields | todas | academy_id, name, address, city, directions, created_by | name, address, city, directions, deleted_at | — |
| activities | todas | academy_id, type, starts_at, ends_at, call_at, venue_id, external_field_id, notes, opponent, tournament, series_id, created_by | type, starts_at, ends_at, call_at, venue_id, external_field_id, notes, opponent, tournament, status, deleted_at | — |

## Políticas

- **select**: `is_academy_member(academy_id)`.
- **insert**: `has_academy_role(academy_id, array['owner']) and created_by = current_user_id()`.
- **update**: `has_academy_role(academy_id, array['owner'])`.

## Errores que traduce el frontend

| Código | Caso | `AppErrorCode` |
|---|---|---|
| 23505 | Nombre de cancha repetido | `duplicate` |
| 23514 | Fecha pasada, horas incoherentes, lugar no vigente, actividad pasada inmutable, rival en entrenamiento | `rule_violation` |
| 23503 | Lugar de otra academia o inexistente | `rule_violation` (se añade al mapeador) |
| PGRST116 | La fila ya no existe | `not_found` |
| 42501 | Sin permiso | `forbidden` |
