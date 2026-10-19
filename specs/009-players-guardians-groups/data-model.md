# Modelo de datos: Jugadores, acudientes y grupos

Migración `supabase/migrations/20261018100000_players_groups_guardians.sql`. Todas las tablas tienen `academy_id`, RLS y `unique (academy_id, id)`. Auditoría: `created_by uuid not null default public.current_user_id() references auth.users (id)`, `created_at` y `updated_at` (trigger `set_updated_at`).

## Funciones auxiliares

| Función | Tipo | Uso |
|---|---|---|
| `current_user_id()` | `stable`, `security invoker` | Usuario actual (ADR-017, R1) |
| `normalize_name(text)` | `immutable` | `lower(unaccent(...))` con espacios colapsados (R3) |

## players

| Columna | Tipo | Regla |
|---|---|---|
| `id` | uuid PK | |
| `academy_id` | uuid FK academies | |
| `first_names` | text | 1 a 80 caracteres tras recortar |
| `last_names` | text | 1 a 80 caracteres tras recortar |
| `nickname` | text null | Hasta 40 caracteres |
| `birth_date` | date | ≥ 1900-01-01; trigger: no futura ni de más de 100 años |
| `phone` | text null | `^3[0-9]{9}$` |
| `is_active` | boolean | Por defecto `true` |
| `deleted_at` | timestamptz null | Borrado lógico |

Índice único: `(academy_id, normalize_name(first_names || ' ' || last_names), birth_date) where deleted_at is null` (DEC-42).

## groups

| Columna | Tipo | Regla |
|---|---|---|
| `id`, `academy_id` | | |
| `name` | text | 1 a 60 caracteres; único por academia: `lower(trim(name))` entre los no eliminados |
| `deleted_at` | timestamptz null | |

Trigger `groups_remove_members`: al pasar `deleted_at` de nulo a una fecha, borra sus filas de `group_members` (una sola operación en la base de datos).

Jugadores activos de un grupo, y jugadores en «También de…»: `is_active and deleted_at is null`.

## group_members (relación, borrado físico)

| Columna | Tipo | Regla |
|---|---|---|
| `academy_id` | uuid | |
| `group_id` | uuid | FK `(academy_id, group_id)` → `groups (academy_id, id)` |
| `player_id` | uuid | FK `(academy_id, player_id)` → `players (academy_id, id)` |
| `created_by`, `created_at` | | |

PK `(group_id, player_id)`.

## guardians (la persona)

| Columna | Tipo | Regla |
|---|---|---|
| `id`, `academy_id` | | |
| `full_name` | text | 1 a 120 caracteres |
| `phone` | text | `^3[0-9]{9}$`; único por academia entre los no eliminados |
| `deleted_at` | timestamptz null | |

## guardian_links (vínculo acudiente-jugador)

| Columna | Tipo | Regla |
|---|---|---|
| `id`, `academy_id` | | |
| `guardian_id` | uuid | FK `(academy_id, guardian_id)` → `guardians` |
| `player_id` | uuid | FK `(academy_id, player_id)` → `players` |
| `relationship` | text | `mother`, `father`, `grandparent`, `other` o `self` (`self` solo desde el enlace, spec 4) |
| `status` | text | `pending`, `validated` o `rejected`; por defecto `validated` (creado por el owner) |
| `consent_document_id` | uuid FK legal_documents | Política vigente al autorizar (DEC-39) |
| `consent_at` | timestamptz | Hora del servidor |
| `deleted_at` | timestamptz null | |

Único: `(guardian_id, player_id) where deleted_at is null`.

## RLS y permisos (resumen; detalle en `contracts/database.md`)

| Tabla | Leer | Insertar / actualizar | Borrar |
|---|---|---|---|
| players, groups, guardians, guardian_links | Miembros de la academia | Owner (`created_by = current_user_id()` al insertar) | No (borrado lógico) |
| group_members | Miembros | Owner | **Owner (físico)** |

## Estados

```text
Jugador:  activo ⇄ inactivo ; cualquiera → eliminado (lógico, sin retorno desde la interfaz)
Vínculo:  validated (owner) ; pending → validated | rejected (spec 4) ; cualquiera → retirado (deleted_at)
```
