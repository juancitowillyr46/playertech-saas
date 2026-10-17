# Contrato: códigos de error nuevos

Amplía el catálogo de `specs/002-frontend-foundation/contracts/app-errors.md` (que remitirá aquí). Son genéricos para que los reutilicen las gestiones de la Fase 2.

| Código | Origen (Supabase) | Mensaje genérico (`ERROR_MESSAGES`) |
|---|---|---|
| `duplicate` | PostgreSQL `23505`, violación de un índice único | Ya existe un registro con ese nombre. |
| `rule_violation` | PostgreSQL `23514`, `check_violation` (incluye el error de `set_primary_venue`) | Esta acción no cumple las reglas de la academia. |
| `not_found` | PostgREST `PGRST116`, ninguna fila afectada | El registro ya no existe o cambió. Actualizamos la información. |

## Mensajes específicos en Sedes

La pantalla de sedes muestra estos textos en lugar del genérico:

| Código | Contexto | Mensaje |
|---|---|---|
| `duplicate` | Guardar el formulario | «Ya existe una sede con ese nombre.» (junto al campo Nombre) |
| `rule_violation` | Desactivar o eliminar | «La sede principal no se puede desactivar ni eliminar. Marca otra como principal primero.» |
| `rule_violation` | Marcar como principal | «Solo una sede activa puede ser la principal. Reactívala primero.» |
| `not_found` | Cualquier operación | Mensaje genérico, y el listado se actualiza |
