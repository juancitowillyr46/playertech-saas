# Modelo de datos: Aviso de inasistencia

Migración nueva: `supabase/migrations/20261024100000_player_absences.sql`. Reglas: `academy_id` con claves compuestas, RLS, borrado lógico y sin usos nuevos de `auth.uid()` (ADR-012, ADR-017).

## Tabla `player_absences`

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | uuid | PK |
| `academy_id` | uuid | FK academias |
| `activity_id` | uuid | FK compuesta a `activities` |
| `player_id` | uuid | FK compuesta a `players` |
| `marked_by` | uuid | `default current_user_id()`, sin FK a `auth.users` (ADR-017) |
| `marked_at` | timestamptz | Hora del servidor de la última marca |
| `notified_at` | timestamptz | Nulo, u hora del servidor del último aviso |
| `deleted_at` | timestamptz | Desmarcado |
| `created_at`, `updated_at` | timestamptz | |

Índice único `(activity_id, player_id)`. Desmarcar pone `deleted_at`; volver a marcar lo limpia y conserva `notified_at`.

## Reglas (trigger y funciones)

- Solo en actividades **programadas** (no canceladas ni eliminadas).
- Solo desde `starts_at` hasta el final de ese día en Colombia: `now() < date_trunc('day', starts_at at time zone 'America/Bogota') + interval '1 day'`, en hora de Colombia.
- El jugador es de la misma academia (clave compuesta).
- `set_absence(p_activity_id uuid, p_player_id uuid, p_absent boolean) returns void` (`security invoker`): marca o desmarca, con el *upsert* por `(activity_id, player_id)`.
- `mark_absence_notified(p_activity_id uuid, p_player_id uuid) returns timestamptz` (`security invoker`): pone `notified_at = clock_timestamp()` en la ausencia vigente y devuelve ese valor; falla si no está marcada.
- El trigger actúa en `insert` y en `update`: desde el día siguiente tampoco se puede desmarcar ni registrar «Avisado» (todo queda en lectura).
- Fuera de plazo o en una actividad cancelada, error `23514` (`absence_window_closed` o `activity_not_scheduled`).

## Lectura

La lista de ausencias trae el nombre, los apellidos y el apodo del jugador desde `players` (la relación por la FK), también si el jugador está inactivo, eliminado o ya no está en la convocatoria: la política `players_select_member` permite leerlos. Así el resumen de la actividad conserva esas marcas.

## RLS y privilegios

| | `anon` | Owner (`authenticated`) |
|---|---|---|
| `player_absences` | Nada | `select` de su academia (miembros); escribe solo con las dos funciones, que exigen owner |
| Funciones | Nada | `execute` |
