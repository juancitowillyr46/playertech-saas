# Contrato: VenueRepository (ampliado)

Amplía el contrato de lectura de `specs/003-design-system/contracts/repositories.md`. Sigue ADR-002 y ADR-009: clase abstracta como token de inyección e implementación en `supabase-venue.repository.ts`, el único archivo con el SDK.

```ts
abstract class VenueRepository {
  /** Sedes no eliminadas de la academia actual; la principal primero y después por nombre. */
  abstract listVenues(): Promise<readonly Venue[]>;
  abstract createVenue(input: VenueInput): Promise<Venue>;
  abstract updateVenue(id: string, input: VenueInput): Promise<Venue>;
  abstract setActive(id: string, active: boolean): Promise<Venue>;
  abstract deleteVenue(id: string): Promise<void>;
  abstract setPrimary(id: string): Promise<void>;
}
```

## Implementación Supabase

| Operación | Llamada | Columnas enviadas |
|---|---|---|
| `listVenues` | `from('venues').select(COLUMNS).is('deleted_at', null)` y orden en el cliente | — |
| `createVenue` | `from('venues').insert({...}).select(COLUMNS).single()` | `academy_id` (del contexto, research R2), `name`, `type`, `address`, `city`, `directions`. **Nunca** `created_by`, `is_primary` ni `is_active` |
| `updateVenue` | `from('venues').update({...}).eq('id', id).is('deleted_at', null).select(COLUMNS).single()` | `name`, `type`, `address`, `city`, `directions` |
| `setActive` | Igual que `updateVenue` | `is_active` |
| `deleteVenue` | Igual, sin devolver la fila al llamador | `deleted_at` (fecha actual en ISO) |
| `setPrimary` | `rpc('set_primary_venue', { p_venue_id: id })` | — |

`COLUMNS = 'id, name, type, address, city, directions, is_primary, is_active'`.

Sin academia activa en el contexto, `createVenue` rechaza con `AppError('forbidden')` sin llamar a Supabase (mismo comportamiento que `upload`).

## Errores

Toda operación rechaza con `AppError` (ver [app-errors.md](./app-errors.md)):

| Situación | Código |
|---|---|
| Nombre en uso en la academia (`23505`) | `duplicate` |
| Regla de la principal (`23514`: desactivar o eliminar la principal, marcar una inactiva) | `rule_violation` |
| La sede ya no existe, está eliminada o es de otra academia (`PGRST116`) | `not_found` |
| Usuario sin permiso (`42501`) | `forbidden` |
| Sin conexión | `network` |

## VenuesService (`features/venues/services/venues.service.ts`)

Amplía el servicio de la spec 003:

| Miembro | Comportamiento |
|---|---|
| `create(input)`, `update(id, input)` | Normaliza (recorta; opcionales vacíos → `null`), llama al repositorio y refresca el listado en silencio |
| `setActive(venue, active)`, `remove(venue)`, `setPrimary(venue)` | Llaman al repositorio y refrescan el listado en silencio |
| `isNameTaken(name, exceptId?)` | Comprueba el nombre frente al listado cargado, sin distinguir mayúsculas ni espacios |
| `busy` (señal) | `true` mientras hay una operación en curso; las demás acciones se bloquean |
| Refresco silencioso | Relee el listado sin pasar a `loading`, conservando `query` y `statusFilter` |

Los errores se propagan como `AppError` para que la pantalla elija el mensaje.
