# Investigación: Gestión de sedes

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Fecha**: 2026-10-17

Cada decisión sigue el formato: decisión, motivo y alternativas descartadas.

## R1 — Sin migraciones: la base de datos ya impone las reglas

**Decisión**: No se crean migraciones. La spec 001 ya ofrece todo lo necesario, verificado en `supabase/migrations/`:

| Regla | Mecanismo existente |
|---|---|
| Solo el owner escribe, solo en su academia | Políticas `venues_insert_owner` y `venues_update_owner` (`has_academy_role(academy_id, 'owner')`) |
| Columnas que el cliente puede escribir | `grant insert (academy_id, name, type, address, city, directions, is_active, created_by)`; `grant update (name, type, address, city, directions, is_active, deleted_at)`. `is_primary` no es escribible: solo cambia con la función |
| Nombre único por academia sin distinguir mayúsculas, entre sedes no eliminadas | Índice único `venues_unique_name_per_academy` sobre `(academy_id, lower(name)) where deleted_at is null` |
| Como máximo una principal; la principal siempre activa y no eliminada | Índice único `venues_one_primary_per_academy` y `check venues_primary_is_active` |
| Cambiar la principal en una sola operación | Función `set_primary_venue(p_venue_id)`: valida owner, sede activa y no eliminada, y serializa cambios simultáneos |
| Borrado lógico | Columna `deleted_at`; las sedes eliminadas no cuentan para el nombre único |
| Pruebas | pgTAP de la spec 001 (`supabase/tests/database/`) |

**Motivo**: Las reglas críticas viven en la base de datos (principio VIII). La spec solo construye la experiencia sobre ellas.

**Alternativas descartadas**: RPC propias para crear o editar (duplicarían lo que ya hacen las políticas y los índices).

## R2 — Academia y autor al crear una sede

**Decisión**:
- `academy_id`: se toma de `AcademyContextService`, igual que la subida de archivos de la spec 002 (`SupabaseFileStorageRepository.upload`). No lo elige el usuario, y la política de inserción lo valida: solo el owner de esa academia puede insertar.
- `created_by`: no se envía; la columna tiene el valor por defecto `auth.uid()`, que la política exige.

**Motivo**: Cumple `AGENTS.md` y `frontend.md`: la academia no la elige la interfaz y la base de datos no confía en ella sin validarla. Además repite un patrón ya probado y evita una migración.

**Alternativas descartadas**: un valor por defecto `current_academy_id()` en la columna (migración y prueba nuevas sin beneficio de seguridad adicional).

## R3 — Operaciones del repositorio

**Decisión**: `VenueRepository` amplía su contrato (ver [contracts/repositories.md](./contracts/repositories.md)):

| Operación | Implementación Supabase | Resultado |
|---|---|---|
| `listVenues()` | Igual que hoy, más `address` y `directions` (para editar sin otra lectura) | `Venue[]` |
| `createVenue(input)` | `insert(...).select(columnas).single()` | `Venue` creada |
| `updateVenue(id, input)` | `update(...).eq('id', id).select(columnas).single()` | `Venue` actualizada |
| `setActive(id, active)` | `update({ is_active })` con la misma comprobación de fila | `Venue` |
| `deleteVenue(id)` | `update({ deleted_at: ahora })` con la misma comprobación | `void` |
| `setPrimary(id)` | `rpc('set_primary_venue', { p_venue_id: id })` | `void` |

Si la actualización no encuentra la fila (eliminada en otra pestaña o ajena por RLS), PostgREST responde con `PGRST116` y se traduce a `not_found`.

**Motivo**: Una operación por intención de la HU, sin exponer columnas ni nombres de la base al resto de la aplicación (ADR-002).

## R4 — Errores nuevos de la aplicación

**Decisión**: Se añaden tres códigos a `AppErrorCode`, con su mensaje genérico y su traducción en `supabase-error.mapper.ts`:

| Código | Origen | Mensaje genérico |
|---|---|---|
| `duplicate` | PostgreSQL `23505` (violación de índice único) | «Ya existe un registro con ese nombre.» |
| `rule_violation` | PostgreSQL `23514` (`check_violation`, también el que lanza `set_primary_venue`) | «Esta acción no cumple las reglas de la academia.» |
| `not_found` | PostgREST `PGRST116` (ninguna fila) | «El registro ya no existe o cambió. Actualizamos la información.» |

La pantalla de sedes traduce `duplicate` a «Ya existe una sede con ese nombre.» junto al campo y `rule_violation` a un mensaje específico de la acción. Se actualiza `specs/002-frontend-foundation/contracts/app-errors.md` con una nota que remite a esta spec.

**Motivo**: Las HU piden mensajes claros; los códigos son genéricos para reutilizarse en las gestiones de la Fase 2.

## R5 — Validación y normalización

**Decisión**:
- El servicio recorta espacios de todos los campos de texto; los opcionales vacíos se guardan como `null`.
- Validación en el formulario: nombre obligatorio (tras recortar) y no duplicado frente al listado cargado (sin distinguir mayúsculas, excluyendo la sede que se edita).
- Si el servidor responde `duplicate` (por ejemplo, otra pestaña creó el nombre), el mismo mensaje se muestra junto al campo (FR-005).

**Motivo**: El aviso temprano evita viajes al servidor desde el celular, pero la garantía es el índice único.

## R6 — Estado del listado tras cada operación

**Decisión**: Tras una operación exitosa, `VenuesService` vuelve a leer el listado **sin poner la pantalla en carga** (refresco silencioso) y conserva la búsqueda y el filtro. Mientras una operación está en curso, el servicio expone la señal `busy` y bloquea otras acciones.

**Motivo**: Cambiar la principal afecta a dos sedes y la base de datos es la fuente de verdad; con pocas sedes, releer es más simple y seguro que parchear el estado local.

**Alternativas descartadas**: actualización optimista (complica revertir ante errores de reglas).

## R7 — Interacción en la pantalla

**Decisión** (detalle en [contracts/ui-contracts.md](./contracts/ui-contracts.md)):
- **Formulario**: el drawer de la spec 003 se vuelve real: «Guardar» activo con estado de carga, errores junto a los campos y el error general en `p-message`. Al guardar con éxito se cierra y aparece un aviso (`p-toast` ya global).
- **Menú de cada sede**: «Editar», «Marcar como principal», «Desactivar» o «Reactivar» y «Eliminar». Las acciones no disponibles se muestran deshabilitadas con el motivo en su texto (FR-017).
- **Eliminar**: `p-confirmdialog` que nombra la sede, explica que no se puede deshacer desde PlayerTech y usa un botón de peligro.
- **Desactivar, reactivar y marcar como principal**: sin confirmación (reversibles), con aviso del resultado.

**Motivo**: Patrón de página de gestión de `ui.md` y supuestos confirmados por el responsable de producto.

## R8 — Pruebas

**Decisión**:
- **Repositorio** (`supabase-venue.repository.spec.ts`): cada operación usa la tabla o la función correcta, envía solo columnas permitidas, no envía `created_by` ni `is_primary`, y traduce `23505`, `23514` y `PGRST116`.
- **Servicio** (`venues.service.spec.ts`): normalización, duplicado local, refresco silencioso, `busy` y errores.
- **Pantalla** (`venues-page.spec.ts`): validaciones del formulario, creación y edición con aviso, error de servidor junto al campo, menú con motivos, confirmación de eliminar, aislamiento visual del estado de carga.
- **Base de datos**: no se añaden pgTAP; las reglas ya están cubiertas en la spec 001. El `quickstart.md` verifica de punta a punta con las academias A y B.

**Motivo**: Principio IX y `docs/engineering/testing.md`.
