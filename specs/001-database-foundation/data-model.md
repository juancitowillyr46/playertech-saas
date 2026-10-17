# Modelo de datos: Base de datos de la Fundación SaaS

La definición de las tablas, columnas, tipos y valores por defecto está en `docs/architecture/database-schema.md` (sección **Fase 1**), que es la fuente de verdad. Este documento **no la repite**: añade las decisiones de implementación de esta spec (ver `research.md`).

## Entidades y propiedad

| Entidad | Ámbito | Pertenece a | Creada por |
|---|---|---|---|
| `plans` | Plataforma | — | Migración (datos de referencia) |
| `legal_documents` | Plataforma | — | Migración (datos de referencia) |
| `profiles` | Identidad | Usuario (`user_id`) | Registro (`handle_new_user`) |
| `academies` | Tenant | Sí misma | Registro |
| `subscriptions` | Tenant | `academy_id` | Registro |
| `academy_members` | Membresía | `academy_id` + `user_id` | Registro |
| `venues` | Organización | `academy_id` | Registro (la principal) y owner |
| `files` | Archivos | `academy_id` | Miembros |
| `legal_acceptances` | Auditoría | `user_id` + `academy_id` | Registro |

## Restricciones adicionales a las de `database-schema.md`

| Tabla | Restricción | Requisito |
|---|---|---|
| `academies` | FK compuesta `(id, logo_file_id) → files (academy_id, id)` | FR-006 |
| `files` | `UNIQUE (academy_id, id)`; CHECK `storage_key LIKE academy_id::text \|\| '/%'` | FR-006, FR-029 |
| `files`, `venues` | `created_by` DEFAULT `auth.uid()`; la política de INSERT exige `created_by = auth.uid()` | FR-031 |
| `venues` | `UNIQUE (academy_id, id)` | FR-006 (para la Fase 2) |
| `academy_members` | `user_id` UNIQUE; índice único parcial de un `owner` por academia | FR-024, FR-025 |
| `subscriptions` | Índice único parcial de una suscripción `active` por academia | FR-024 |
| `venues` | Índice único parcial de una principal por academia (no eliminada); CHECK `NOT is_primary OR (is_active AND deleted_at IS NULL)`; índice único parcial `(academy_id, lower(name))` sin eliminadas | FR-022, FR-023 |
| `legal_documents` | `UNIQUE (type, version)`; índice único parcial de una vigente por tipo | FR-027 |
| `legal_acceptances` | Sin privilegios de `UPDATE` ni `DELETE` para ningún rol de cliente | FR-026 |

## Privilegios por columna (`UPDATE` para `authenticated`)

| Tabla | Columnas editables |
|---|---|
| `profiles` | `full_name` |
| `academies` | `name`, `logo_file_id`, `contact_email`, `contact_phone`, `address`, `city` |
| `venues` | `name`, `type`, `address`, `city`, `directions`, `is_active`, `deleted_at` |
| `files` | `deleted_at` |

Las demás tablas no conceden `UPDATE` al cliente.

## Estados y transiciones

### Academia (`academies.status`)

```text
active ──(soporte, manual)──► suspended ──(soporte, manual)──► active
```

En el MVP no hay transición desde la aplicación (DEC-18). Una academia `suspended` hace que `is_academy_member()` devuelva falso para sus miembros.

### Membresía (`academy_members.status`)

```text
active ──(soporte, manual)──► disabled
```

### Sede (`venues`)

```text
           desactivar (no principal)            eliminar (no principal)
activa ◄────────────────────────────► inactiva ───────────────────────► eliminada (deleted_at)
   │            reactivar                  │
   └──── eliminar (no principal) ──────────┴──► eliminada
activa ──(set_primary_venue)──► principal   (la anterior deja de serlo)
```

### Archivo (`files`)

```text
vigente ──(reemplazo o retiro)──► eliminado (deleted_at)
```

## Reglas de validación del registro

Aplicadas por `handle_new_user()` según [contracts/registration-metadata.md](contracts/registration-metadata.md):

| Regla | Si no se cumple |
|---|---|
| `academy_name` presente y no vacío (tras recortar espacios) | Excepción; se revierte el registro |
| `full_name` presente y no vacío | Excepción |
| `legal_acceptances.terms` y `legal_acceptances.privacy_policy` coinciden con las versiones vigentes | Excepción |
| Existe una versión vigente de cada documento legal | Excepción |
| Existe el plan `free` activo | Excepción |

## Datos de referencia (cargados por migración)

| Tabla | Filas |
|---|---|
| `plans` | `free` (Free, sin límites), `pro` (Pro), `advanced` (Advanced); límites en NULL |
| `legal_documents` | `terms` `2026-10-v1` y `privacy_policy` `2026-10-v1`, vigentes y con URL provisional |

## Datos de prueba (seed)

| Academia | Slug | Owner | Correo | Contraseña |
|---|---|---|---|---|
| Academia A | `academia-a` | Owner A | `owner.a@playertech.test` | Solo local, documentada en `supabase/README.md` |
| Academia B | `academia-b` | Owner B | `owner.b@playertech.test` | Solo local |

Los usuarios tienen UUID fijos y el correo confirmado. Sus academias, sedes, suscripciones y aceptaciones las crea el trigger de registro.
