# Modelo de datos: Gestión de sedes

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

Sin cambios en la base de datos (research R1). La tabla `public.venues` está descrita en `docs/architecture/database-schema.md` y su acceso, en `specs/001-database-foundation/contracts/database-api.md`.

## Modelos del frontend (`features/venues/models/venue.models.ts`)

### Venue (se amplía)

| Campo | Tipo | Columna | Novedad |
|---|---|---|---|
| `id` | `string` | `id` | — |
| `name` | `string` | `name` | — |
| `type` | `'office' \| 'training_ground'` | `type` | — |
| `address` | `string \| null` | `address` | **Nuevo** (para editar sin otra lectura) |
| `city` | `string \| null` | `city` | — |
| `directions` | `string \| null` | `directions` | **Nuevo** |
| `isPrimary` | `boolean` | `is_primary` | — |
| `isActive` | `boolean` | `is_active` | — |

### VenueInput (nuevo)

Datos que el owner escribe al crear o editar.

| Campo | Tipo | Regla |
|---|---|---|
| `name` | `string` | Obligatorio tras recortar espacios; único en la academia sin distinguir mayúsculas entre sedes no eliminadas (índice de la base de datos) |
| `type` | `VenueType` | Por defecto `training_ground` al crear (CA-002 de HU-029) |
| `address` | `string \| null` | Opcional; vacío tras recortar → `null` |
| `city` | `string \| null` | Opcional; vacío tras recortar → `null` |
| `directions` | `string \| null` | Opcional; vacío tras recortar → `null` |

`academy_id` y `created_by` no forman parte del modelo: los aportan el contexto de academia y la base de datos (research R2).

## Estados y transiciones de una sede

```text
            crear (activa, no principal)
                      │
                      ▼
   ┌──────────────► ACTIVA ◄──────────────┐
   │                  │                   │
   │ reactivar        │ desactivar        │ marcar como principal
   │                  ▼                   │ (solo si activa)
INACTIVA ◄────────────┘            PRINCIPAL (activa)
   │                                      │
   │ eliminar (confirmación)              │ no puede desactivarse ni eliminarse;
   ▼                                      │ deja de serlo cuando otra se marca
ELIMINADA (borrado lógico; no se ve)      ▼
   ▲                                    ACTIVA
   └──── eliminar (confirmación) ─── ACTIVA no principal
```

| Acción | Disponible si | Si no, motivo mostrado |
|---|---|---|
| Editar | Siempre | — |
| Marcar como principal | Activa y no principal | «Ya es la principal» o «Reactívala primero» |
| Desactivar | Activa y no principal | «Marca otra como principal primero» |
| Reactivar | Inactiva | — (en lugar de «Desactivar») |
| Eliminar | No principal | «Marca otra como principal primero» |

Invariante (FR-010, SC-003): exactamente una sede principal, activa y no eliminada, por academia; la base de datos la garantiza.
