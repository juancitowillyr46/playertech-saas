# Contrato de base de datos

Columnas en `data-model.md`. Aquí: permisos, políticas y funciones.

## Permisos por columna (`authenticated`)

| Tabla | select | insert | update | delete |
|---|---|---|---|---|
| players | todas | academy_id, first_names, last_names, nickname, birth_date, phone, is_active, created_by | first_names, last_names, nickname, birth_date, phone, is_active, deleted_at | — |
| groups | todas | academy_id, name, created_by | name, deleted_at | — |
| group_members | todas | academy_id, group_id, player_id, created_by | — | sí |
| guardians | todas | — (solo por `add_player_guardian`) | full_name, phone, deleted_at | — |
| guardian_links | todas | — (solo por `add_player_guardian`) | relationship, deleted_at | — |

## Políticas

- **select**: `is_academy_member(academy_id)`.
- **insert**: `has_academy_role(academy_id, array['owner']) and created_by = current_user_id()`.
- **update** y **delete** de `group_members`: `has_academy_role(academy_id, array['owner'])`.

## Trigger

`groups_remove_members` (`after update of deleted_at on groups`): al eliminar un grupo, borra sus integrantes.

## Funciones

### `find_player_by_identity(p_first_names text, p_last_names text, p_birth_date date) returns setof players`

`security invoker`. Devuelve el jugador no eliminado de la academia del usuario (`current_academy_id()`) cuyo `normalize_name(...)` y `birth_date` coinciden. Lo respeta RLS.

### `add_player_guardian(p_player_id uuid, p_full_name text, p_phone text, p_relationship text, p_consent boolean) returns table (guardian_id uuid, link_id uuid, guardian_existed boolean, guardian_name text)`

`security definer`: es la única vía para insertar en `guardians` y `guardian_links` (sin permiso de inserción para `authenticated`) y comprueba explícitamente `has_academy_role(academia del jugador, 'owner')`; si no, `42501`.

1. Rechaza con `22023` si `p_consent` no es `true`, y con `23514` si el parentesco no es válido (`self` no se admite por esta vía).
2. Toma `academy_id` del jugador (la política de lectura exige que sea de la academia del usuario).
3. Busca un acudiente no eliminado con ese celular en la academia. Si no existe, lo crea con `p_full_name`.
4. Crea el vínculo `validated` con `consent_document_id` = Política vigente y `consent_at = now()`. Si ya existe un vínculo no eliminado entre ambos, rechaza con `23505`.
5. Devuelve los identificadores, si el acudiente ya existía y su nombre registrado.

## Errores que traduce el frontend

| Código | Caso | `AppErrorCode` |
|---|---|---|
| 23505 | Jugador duplicado, grupo con nombre repetido, celular de acudiente repetido, vínculo repetido | `duplicate` |
| 23514 | Formato o regla violada (celular, fecha, parentesco) | `rule_violation` |
| 22023 | Falta la autorización de datos | `rule_violation` |
| PGRST116 | La fila ya no existe | `not_found` |
| 42501 | Sin permiso | `forbidden` |
