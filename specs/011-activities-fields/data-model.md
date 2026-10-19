# Modelo de datos: Actividades y canchas externas

Migración `supabase/migrations/20261018120000_activities_fields.sql`. Ambas tablas: `academy_id`, RLS, `unique (academy_id, id)`, `created_by default current_user_id()`, `created_at`, `updated_at` (`set_updated_at`) y `deleted_at`.

## external_fields

| Columna | Tipo | Regla |
|---|---|---|
| `name` | text | 1 a 80 caracteres; único `(academy_id, lower(trim(name)))` entre los no retirados |
| `address` | text null | Hasta 160 caracteres |
| `city` | text null | Hasta 80 caracteres |
| `directions` | text null | Hasta 500 caracteres |

## activities

| Columna | Tipo | Regla |
|---|---|---|
| `type` | text | `training` o `competition` |
| `starts_at` | timestamptz | Futura al crear; inmutable cuando ya pasó |
| `ends_at` | timestamptz null | `> starts_at` |
| `call_at` | timestamptz null | `<= starts_at` (hora de citación) |
| `venue_id` | uuid null | FK `(academy_id, venue_id)` → `venues` |
| `external_field_id` | uuid null | FK `(academy_id, external_field_id)` → `external_fields` |
| `notes` | text null | Hasta 500 caracteres |
| `opponent` | text null | Hasta 80 caracteres; solo en competencia |
| `tournament` | text null | Hasta 80 caracteres; solo en competencia |
| `status` | text | `scheduled` (por defecto) o `cancelled` |
| `series_id` | uuid null | Común a las actividades de una repetición (informativo) |

Exactamente un lugar: `num_nonnulls(venue_id, external_field_id) = 1`. Índice `(academy_id, starts_at) where deleted_at is null`.

## Triggers

| Trigger | Regla |
|---|---|
| `activities_guard` | Al insertar, `starts_at > now()`. Al actualizar una pasada, solo cambia `deleted_at`. Al actualizar una próxima, el nuevo `starts_at` es futuro. Al insertar o cambiar el lugar: sede activa y no eliminada, o cancha no retirada |

## Estados

```text
programada ⇄ cancelada   (solo mientras es próxima)
cualquiera → eliminada   (lógico; también si es pasada)
próxima → pasada         (al llegar starts_at; desde ahí, inmutable salvo eliminar)
```
