# Contrato de base de datos

Funciones de `supabase/migrations/20261021100000_call_up_responses.sql`. Todas usan `set search_path = ''` y no llaman a `auth.uid()` (ADR-017). Los errores de negocio usan `errcode` `22023` (dato inválido) o `23514` (regla) con un mensaje en clave que el repositorio traduce.

## Vía pública (`security definer`, `execute` para `anon` y `authenticated`)

### `public_call_up(p_token text, p_device_keys text[]) returns jsonb`

Lee lo que el enlace permite ver (FR-001, FR-008, FR-017). Nunca lanza error por un enlace inválido: devuelve `not_found`.

```jsonc
{
  "status": "open" | "closed" | "cancelled" | "not_found",
  // Todo lo siguiente falta cuando status = "not_found"
  "academy": "Academia C",
  "activity": { "type": "competition", "startsAt": "…", "endsAt": "…", "callAt": "…",
                "place": { "name": "…", "address": "…", "city": "…", "directions": "…" },
                "opponent": "…", "tournament": "…", "notes": "…" },
  "deadline": "…" | null,
  // Solo con status = "open": convocados de ESTA lista para elegir (nombre, inicial, apodo)
  "roster": [{ "playerId": "…", "name": "Samuel V.", "nickname": "Samu" }],
  // Jugadores del dispositivo reconocido en esta lista (vínculo no rechazado, dispositivo no revocado)
  "mine": [{ "playerId": "…", "name": "Samuel V.", "nickname": "Samu",
             "removed": false,
             "answer": "yes" | "maybe" | "no" | null, "reason": "…" | null, "reasonText": "…" | null,
             "changesLeft": 3 }]
}
```

- `p_device_keys`: los secretos guardados en el navegador (hasta 10); se comparan por su huella. Si alguno coincide, actualiza `last_seen_at`.
- `removed`: el jugador tenía vínculo y respuesta en la convocatoria pero ya no está convocado (CA-006 de HU-009).
- No incluye celulares, apellidos completos, respuestas de otros, otras listas ni ids de la academia.

### `public_identify(p_token text, p_player_id uuid, p_full_name text, p_phone text, p_relationship text, p_consent boolean, p_device_key text) returns text`

Identificarse o sumar un jugador (FR-002 a FR-004). Devuelve el **secreto del dispositivo**: el mismo `p_device_key` si ya era válido para esa academia, o uno nuevo.

1. El enlace existe, la convocatoria está abierta y el jugador está en la lista del enlace. Si no: `call_up_closed` o `player_not_in_list`.
2. **Dispositivo reconocido** (`p_device_key` válido y no revocado en la academia): usa su acudiente; nombre, celular y autorización no se piden (pueden llegar nulos).
3. **Dispositivo nuevo**: valida el nombre (1 a 120; no se exige con `self`, que toma el de la ficha del jugador), el celular (`^3[0-9]{9}$`), el parentesco y `p_consent = true` (`consent_required`). Busca el acudiente por celular en la academia; si no existe, lo crea con `source = 'link'`, ese nombre y la autorización vigente; si existe, no cambia su nombre. Crea un dispositivo `pending` con `declared_name` y `declared_relationship`. La respuesta es la misma en ambos casos: nada revela si el celular ya estaba registrado.
4. **Vínculo**: si el acudiente no tiene un vínculo no eliminado con el jugador, crea uno `pending` con `source = 'link'`.

### `public_respond(p_token text, p_device_key text, p_player_id uuid, p_answer text, p_reason text, p_reason_text text) returns jsonb`

Responder (FR-005 a FR-007). Devuelve `{ "answer": …, "changesLeft": n }`.

- Convocatoria abierta (`call_up_closed`); jugador en la lista del enlace (`player_not_in_list`); dispositivo válido y vínculo con el jugador no rechazado (`device_not_recognized`).
- Respuesta y motivo válidos según DEC-38 (`invalid_answer`, `reason_text_required`).
- Igual a la vigente: no inserta y devuelve el estado actual.
- Límite: con 4 respuestas de acudientes que cuentan, `change_limit_reached`.

## Owner (`security invoker`, `execute` solo para `authenticated`)

### `review_guardian(p_link_id uuid, p_device_id uuid, p_decision text) returns void`

`p_decision`: `validate` o `reject` (R5). Comprueba `has_academy_role(academy_id, array['owner'])`. Al menos uno de los dos ids es obligatorio y ambos deben ser de la misma academia y del mismo acudiente.

- `validate`: vínculo `validated` y dispositivo `trusted`.
- `reject`: dispositivo `revoked`; si el vínculo estaba `pending`, pasa a `rejected` con `deleted_at`.

### Respuesta del owner

`insert into call_up_responses (academy_id, call_up_id, player_id, answer, reason, reason_text, source) values (…, 'owner')` con RLS (R6). El trigger exige que el jugador esté convocado.

## Lecturas del owner

`select` con RLS sobre `call_up_current_responses`, `call_up_summaries`, `call_up_responses` (historial de un jugador, con el acudiente y el dispositivo) y `guardian_links` y `guardian_devices` pendientes (ficha del jugador).

## Pruebas pgTAP (`110-call-up-responses.test.sql`)

- `anon` no lee ninguna tabla nueva ni las existentes; solo ejecuta las tres funciones públicas.
- `public_call_up`: enlace inventado → `not_found` sin datos; abierto sin llave → `roster` solo de esa lista y sin celulares; con llave → `mine`; cerrado y cancelado → sin `roster`; jugador quitado → `removed`.
- `public_identify`: crea acudiente, vínculo y dispositivo pendientes; celular existente → reutiliza el acudiente; sin autorización → error; jugador de otra lista → error; dispositivo reconocido suma un hermano sin datos.
- `public_respond`: registra; misma respuesta no inserta; quinto envío distinto → `change_limit_reached`; cerrada → `call_up_closed`; vínculo rechazado → `device_not_recognized`; *Otro* sin texto → error.
- Owner: responde con la convocatoria cerrada sin consumir el límite; `review_guardian` valida y rechaza; rechazar saca la respuesta del conteo de las vistas.
- Aislamiento: el owner de la academia B no ve respuestas, dispositivos ni resúmenes de la A, ni puede revisar sus pendientes.
