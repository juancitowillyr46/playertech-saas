# Contrato de base de datos

Cambios sobre `specs/009-players-guardians-groups/contracts/database.md`.

## Permisos

Sin cambios en los GRANT. `guardians` sigue con `update (full_name, phone, deleted_at)`; las columnas de autorización no se conceden.

## `assign_guardians(p_player_id uuid, p_assignments jsonb) returns int`

Es `security definer`, con `set search_path = ''`. Solo `authenticated` puede ejecutarla. `p_assignments` es una lista de objetos `{ "guardian_id": uuid, "relationship": text }`.

| Paso | Regla | Error |
|---|---|---|
| 1 | El jugador no eliminado existe y quien llama es owner de su academia | `42501` |
| 2 | Cada `relationship` es `mother`, `father`, `grandparent` u `other` | `23514` |
| 3 | Cada acudiente existe, no está eliminado y es de la academia del jugador; si falla alguno, no se asigna ninguno | `42501` |
| 4 | Inserta vínculos `validated` (`created_by = current_user_id()`), omitiendo los que ya existen sin eliminar | — |
| 5 | Devuelve cuántos vínculos creó (0 si todos ya existían) | — |

## `add_player_guardian` (ajustada)

Misma firma y respuesta. Si crea la persona, guarda en `guardians` la autorización (`consent_document_id` = Política vigente y `consent_at = now()`). El vínculo ya no la guarda.

## Errores que traduce el frontend

Los de la spec 009. `42501` en `assign_guardians` significa que el jugador o algún acudiente ya no existe: el frontend lo trata como `not_found`, como hace Sedes con `set_primary_venue`.
