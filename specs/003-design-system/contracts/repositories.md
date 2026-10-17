# Contrato: repositorios de solo lectura

Siguen el patrón de ADR-002 y ADR-009 y el de `specs/002-frontend-foundation/contracts/repositories.md`:
- clase abstracta usada como token de inyección;
- implementación Supabase en un archivo `supabase-*.ts`, el único sitio donde la regla de ESLint permite el SDK;
- registro en `app.config.ts`.

Los errores se traducen con `mapSupabaseError` a `AppError` (`specs/002-frontend-foundation/contracts/app-errors.md`).

## VenueRepository (`features/venues/data/venue.repository.ts`)

```ts
abstract class VenueRepository {
  /** Sedes no eliminadas de la academia actual; principal primero, luego por nombre. */
  abstract listVenues(): Promise<readonly Venue[]>;
}
```

| Caso | Resultado |
|---|---|
| Miembro activo con sedes | Lista de `Venue` (ver [data-model.md](../data-model.md)) |
| Miembro activo sin sedes visibles | Lista vacía |
| Error de red o de la base de datos | Lanza `AppError` (`network` u `unknown`) |

Implementación (`supabase-venue.repository.ts`):
- `from('venues').select('id, name, type, city, is_primary, is_active').is('deleted_at', null)`, más el orden.
- Sin filtro por `academy_id`: RLS lo aplica (principio VI).

## HomeSummaryRepository (`features/home/data/home-summary.repository.ts`)

```ts
abstract class HomeSummaryRepository {
  /** Plan vigente y sede principal de la academia actual. */
  abstract loadSummary(): Promise<{ planName: string | null; primaryVenue: { name: string; city: string | null } | null }>;
}
```

Implementación (`supabase-home-summary.repository.ts`), con dos lecturas en paralelo:
- `from('subscriptions').select('plans(name)').eq('status', 'active').maybeSingle()`;
- `from('venues').select('name, city').eq('is_primary', true).is('deleted_at', null).maybeSingle()`.

El nombre de la academia y el logo salen del `AcademyContextService` existente. El logo se convierte en URL con `FileStorageRepository`. Ambos los combina `HomeSummaryService` (`features/home/home-summary.service.ts`).

## Servicios

| Servicio | Expone | Notas |
|---|---|---|
| `VenuesService` | Señales `venues`, `status`, `query` y `statusFilter`, más una señal derivada `visibleVenues` | Búsqueda sin distinguir mayúsculas ni tildes; filtro `all`, `active` o `inactive` |
| `HomeSummaryService` | Señales `summary` y `status` | Combina el contexto de academia, el repositorio y el almacenamiento |
