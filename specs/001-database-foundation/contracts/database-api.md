# Contrato: interfaz de la base de datos

Lo que esta spec expone a las capas superiores (los repositorios de la spec 002 y las HU de la Fase 1). El acceso se hace con el rol `authenticated` (o `anon` donde se indica) y siempre bajo RLS.

## Funciones

| Función | Firma | Roles | Devuelve |
|---|---|---|---|
| `is_academy_member` | `(p_academy_id uuid) → boolean` | `authenticated` | `true` si el usuario tiene membresía `active` en esa academia y la academia está `active` |
| `current_academy_id` | `() → uuid` | `authenticated` | La academia del usuario, o `NULL` si no tiene membresía activa o su academia está suspendida |
| `has_academy_role` | `(p_academy_id uuid, p_roles text[]) → boolean` | `authenticated` | `true` si el usuario es miembro activo con uno de esos roles y la academia está `active` |
| `set_primary_venue` | `(p_venue_id uuid) → void` | `authenticated` | Marca la sede como principal y desmarca la anterior. Falla si el usuario no es owner, o si la sede está inactiva o eliminada |

## Acceso por tabla

Resumen de la matriz RLS de `docs/architecture/database-schema.md`:

| Tabla | Leer | Crear | Modificar | Eliminar |
|---|---|---|---|---|
| `plans` | `authenticated` | — | — | — |
| `legal_documents` | `anon`, `authenticated` | — | — | — |
| `profiles` | Propio | — | Propio (`full_name`) | — |
| `academies` | Miembros | — | Owner (columnas permitidas) | — |
| `subscriptions` | Miembros | — | — | — |
| `academy_members` | Propia membresía | — | — | — |
| `venues` | Miembros | Owner | Owner (columnas permitidas) | — (borrado lógico) |
| `files` | Miembros | Miembros | Miembros (`deleted_at`) | — |
| `legal_acceptances` | Propias | — | — | — |

"—" significa que el cliente no puede hacerlo; solo el registro o una migración.

## Almacenamiento

| Bucket | Clave | Leer | Escribir |
|---|---|---|---|
| `public-assets` | `{academy_id}/{módulo}/{entity_id}/{file_id}.{ext}` | Público | Miembros de `academy_id` |
| `private-files` | Igual | Miembros de `academy_id` (URL firmada) | Miembros de `academy_id` |

Tras subir un objeto, el cliente registra el archivo en `files` con la misma `storage_key` (ADR-013). La clave debe empezar por el `academy_id` de la fila; si no, la base de datos la rechaza. Los límites de tipo y tamaño los aplica la API de Storage.

## Convenciones para los repositorios

- Filtrar `deleted_at IS NULL` en las consultas habituales (`research.md`, R9).
- No enviar `created_by`: la base de datos asigna el usuario autenticado y rechaza cualquier otro valor.
- No enviar `academy_id` como mecanismo de autorización. Al crear registros, usar `current_academy_id()` o el valor obtenido de la membresía; RLS rechaza cualquier otro.
- Los tipos de TypeScript se generan con `npm run db:types` (`research.md`, R14).
