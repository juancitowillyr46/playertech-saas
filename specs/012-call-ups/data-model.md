# Modelo de datos: Convocatoria y mensaje de WhatsApp

Migración `supabase/migrations/20261019100000_call_ups.sql`. Todas las tablas: `academy_id`, RLS, `created_by default current_user_id()` y `created_at`; `call_ups` y `call_up_lists` también `updated_at`.

## call_ups

| Columna | Tipo | Regla |
|---|---|---|
| `activity_id` | uuid | FK `(academy_id, activity_id)` → `activities`; única entre las no eliminadas |
| `deadline` | timestamptz null | Futura y `< activities.starts_at` (trigger) |
| `closed_at` | timestamptz null | Cierre manual o por cancelación |
| `deleted_at` | timestamptz null | Borrado lógico (sin uso desde la interfaz en el MVP) |

`unique (academy_id, id)`.

## call_up_lists

| Columna | Tipo | Regla |
|---|---|---|
| `call_up_id` | uuid | FK `(academy_id, call_up_id)` → `call_ups` |
| `group_id` | uuid null | FK `(academy_id, group_id)` → `groups`; null = lista única sin grupo |
| `token` | text | Único; por defecto `replace(gen_random_uuid()::text, '-', '')` |
| `intro` | text null | Texto propio, hasta 500 caracteres |
| `position` | int | Orden de las listas |

`unique (academy_id, id)`; `unique (call_up_id, group_id)` (una lista por grupo). Se borra físicamente si queda vacía.

## call_up_players

| Columna | Tipo | Regla |
|---|---|---|
| `call_up_id` | uuid | FK compuesta → `call_ups` |
| `list_id` | uuid | FK `(academy_id, list_id)` → `call_up_lists` |
| `player_id` | uuid | FK `(academy_id, player_id)` → `players` |

PK `(call_up_id, player_id)`. Borrado físico.

## Funciones y triggers

| Pieza | Regla |
|---|---|
| `call_up_is_open(call_up_id)` | `closed_at is null and now() < coalesce(deadline, activity.starts_at)` |
| `create_call_up(activity, deadline, lists)` | Crea todo en una operación; sin convocados, `23514` |
| `call_ups_guard` | Al insertar: actividad próxima y programada. Fecha límite válida. Cerrada: inmutable |
| `call_up_members_guard` | Cambios en listas y convocados solo con la convocatoria abierta |
| `activities_call_up_sync` | Cancelar cierra la convocatoria; mover el inicio a una hora no posterior a la fecha límite, `23514` |

## Estados

```text
abierta → cerrada   (manual, al cancelar la actividad, al llegar la fecha límite o el inicio)
cerrada: no se reabre (MVP)
```
