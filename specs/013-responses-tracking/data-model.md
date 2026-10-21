# Modelo de datos: Respuesta del acudiente y seguimiento

Migración nueva: `supabase/migrations/20261021100000_call_up_responses.sql`. Reglas comunes: `academy_id` con claves compuestas `(academy_id, id)`, RLS, hora del servidor y sin usos nuevos de `auth.uid()` (ADR-012, ADR-017). Convenciones: `docs/architecture/database-schema.md`.

## Cambios en tablas existentes

### `guardians` (spec 009)

| Cambio | Detalle |
|---|---|
| `created_by` | Admite nulo |
| `source` (nueva) | `text not null default 'owner'`, `check (source in ('owner', 'link'))` |
| Regla | `check (source = 'link' or created_by is not null)` |

Desde el enlace se crea con `source = 'link'`, el nombre escrito, la autorización vigente (`consent_document_id`, `consent_at`) y el celular único por academia (índice existente). Con «Soy el jugador», el nombre sale de la ficha del jugador. Si el celular ya existe, no se crea y su nombre no cambia (FR-003).

### `guardian_links` (spec 009)

| Cambio | Detalle |
|---|---|
| `created_by` | Admite nulo |
| `source` (nueva) | Igual que en `guardians` |
| `status` | Ya existe (`pending`, `validated`, `rejected`); desde el enlace nace `pending` |
| Regla | Un vínculo `rejected` tiene `deleted_at` (libera el índice único del par) |

## Tablas nuevas

### `guardian_devices`

Dispositivo de un acudiente: la marca secreta del navegador (DEC-40).

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | uuid | PK |
| `academy_id` | uuid | FK academias; `(academy_id, id)` único |
| `guardian_id` | uuid | FK compuesta a `guardians` |
| `secret_hash` | bytea | SHA-256 del secreto; único. El secreto nunca se guarda |
| `status` | text | `pending`, `trusted` o `revoked`; nace `pending` |
| `declared_name` | text | Nombre que escribió la persona (1 a 120); nulo con «Soy el jugador» |
| `declared_relationship` | text | Parentesco que escribió (`mother`, `father`, `grandparent`, `other`, `self`) |
| `last_seen_at` | timestamptz | Última vez que se usó |
| `created_at`, `updated_at` | timestamptz | Hora del servidor |

Sin `deleted_at`: revocar es su baja (estado `revoked`). Solo se escribe desde funciones.

### `call_up_responses`

Registro de solo inserción (R4; excepción del principio XII).

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | uuid | PK |
| `academy_id` | uuid | FK academias |
| `call_up_id` | uuid | FK compuesta a `call_ups` |
| `player_id` | uuid | FK compuesta a `players` |
| `answer` | text | `yes`, `maybe` (Sí, provisional) o `no` |
| `reason` | text | Nulo o un código de DEC-38. Para `no`: `illness`, `school`, `family`, `travel`, `transport`, `other`. Para `maybe`: `schedule`, `transport`, `health`, `other`. Nulo si `answer = 'yes'` |
| `reason_text` | text | Obligatorio si `reason = 'other'` (1 a 200); nulo en otro caso |
| `source` | text | `guardian` u `owner` |
| `guardian_link_id` | uuid | Obligatorio si `source = 'guardian'` |
| `device_id` | uuid | Obligatorio si `source = 'guardian'` |
| `created_by` | uuid | Obligatorio si `source = 'owner'` (`current_user_id()`) |
| `created_at` | timestamptz | Hora del servidor |

Índice: `(call_up_id, player_id, created_at desc)`.

**Respuesta que cuenta**: `source = 'owner'`, o bien `source = 'guardian'` con el vínculo no rechazado y el dispositivo no revocado.

## Vistas (`security_invoker = true`)

- **`call_up_current_responses`**: por convocatoria, lista y jugador convocado, la última respuesta que cuenta. Columnas: `call_up_id`, `list_id`, `player_id`, `answer`, `reason`, `reason_text`, `source`, `created_at`; del acudiente, `guardian_id`, `guardian_name` (nombre registrado), `relationship`, `guardian_link_id`, `link_status`; del dispositivo, `device_id`, `device_status`, `declared_name`; `unvalidated` (vínculo o dispositivo `pending`) y `phone_match` (el acudiente ya existía antes de este dispositivo: lo registró el owner o tiene otro vínculo validado). Los jugadores sin respuesta aparecen con `answer` nulo.
- **Historial** (lectura de `call_up_responses` de un jugador): cada fila con las mismas columnas del acudiente y del dispositivo y `counts` (si cuenta), de la más reciente a la más antigua.
- **`call_up_summaries`**: por convocatoria y lista, el total de convocados y cuántos tienen `yes`, `maybe`, `no` o ninguna respuesta. La lista de actividades usa los confirmados (`yes`) sobre el total (FR-014).

## Estados

```text
Vínculo:      pending ──validar──▶ validated
                 └────rechazar──▶ rejected (+ deleted_at)

Dispositivo:  pending ──validar──▶ trusted
                 └────rechazar──▶ revoked
              trusted ──rechazar─▶ revoked   (la persona ya no se reconoce)
```

## Reglas en la base de datos

- Responder (acudiente): convocatoria abierta (`call_up_is_open`), jugador convocado en la lista del enlace, dispositivo no revocado, vínculo del dispositivo con el jugador no rechazado, y menos de 4 respuestas de acudientes que cuentan para ese jugador. La misma respuesta vigente no inserta nada.
- Responder (owner): jugador convocado y convocatoria no eliminada; la convocatoria puede estar cerrada.
- Las filas `guardian` solo llegan desde `public_respond` (un trigger lo comprueba con un ajuste local de la transacción).
- Motivo y texto coherentes con la respuesta (restricciones `check`).
- Sin `update` ni `delete` en `call_up_responses` para ningún rol.

## RLS y privilegios

| Tabla o vista | `anon` | Owner (`authenticated`) |
|---|---|---|
| `guardian_devices` | Nada | `select` de su academia; escribe con `review_guardian` |
| `call_up_responses` | Nada | `select` de su academia; `insert` solo con `source = 'owner'` |
| Vistas | Nada | `select` (heredan la RLS de sus tablas) |
| `guardians`, `guardian_links` | Nada (sin cambios) | Sin cambios; la validación va por `review_guardian` |
