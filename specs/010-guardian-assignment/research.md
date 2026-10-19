# Investigación: Asignar acudientes ya registrados

## R1 — Autorización en la persona (DEC-39 ajustada)

- **Decisión**: `guardians` gana `consent_document_id` y `consent_at`, ambos obligatorios; `guardian_links` los pierde.
- **Traslado**: antes de exigirlos, se llenan con los del **primer vínculo** de cada acudiente: `distinct on (guardian_id) order by created_at`, incluidos los vínculos retirados, porque la autorización se dio igualmente. Luego `set not null` y `drop column` en `guardian_links`.
- **Motivo**: lo que se autoriza es el tratamiento de los datos de la persona. Mantener la columna también en el vínculo duplicaría la información (principio X).
- **Nube**: la nube de pruebas ya tiene datos de la spec 009. El traslado va en la misma migración y transacción, sin pasos a mano. La prueba pgTAP reproduce el escenario: crea un vínculo con el esquema anterior y verifica el traslado (R5).

## R2 — `assign_guardians` (A y B con una sola función)

- **Firma**: `assign_guardians(p_player_id uuid, p_assignments jsonb) returns int`.
  - `p_assignments = [{"guardian_id": "...", "relationship": "father"}, ...]`.
  - Devuelve el número de vínculos creados.
- **`security definer`**, con `set search_path = ''`, como `add_player_guardian`:
  1. El jugador no eliminado debe ser de una academia donde quien llama es owner. Si no, `42501`.
  2. Cada parentesco debe ser `mother`, `father`, `grandparent` u `other`. Si no, `23514`.
  3. Cada acudiente debe estar no eliminado y ser de **la misma academia** del jugador. Si alguno no lo es, `42501` y no se asigna ninguno.
  4. Inserta los vínculos `validated`, **omitiendo** los acudientes que ya tienen un vínculo no eliminado con el jugador (CA-004 y CA-005 de HU-035).
- **Motivo**: «Copiar de un hermano» asigna varios en una sola operación y no deja la mitad hecha si algo falla. La versión de un solo acudiente es el mismo caso con un elemento.
- **Alternativa descartada**: insertar los vínculos desde el cliente. Exigiría permiso de inserción en `guardian_links`, que hoy solo se crea por función (spec 009).

## R3 — `add_player_guardian` ajustada

- Si crea la persona, guarda en ella la autorización (`consent_document_id` = la Política vigente, `consent_at = now()`).
- Si la persona ya existía (por su celular), solo crea el vínculo y no toca la autorización.
- Sigue exigiendo `p_consent = true`, porque es la vía de **registrar** a alguien nuevo. Mantener la exigencia en ambos casos es más simple y no cambia la pantalla de registro.

## R4 — Frontend

- **`GuardianRepository`**:
  - `listGuardians()`: una consulta con los vínculos no eliminados y sus jugadores;
  - `assign(playerId, assignments)`: llama a la función por RPC.
- **`PlayerDetailService`**:
  - `guardianOptions()` (acudientes con la marca «ya es de este jugador»);
  - `siblings()`: los jugadores con acudientes excepto el actual, sacados de `PlayerRepository.listPlayers`, que ya trae el conteo;
  - `siblingGuardians(id)`: `listByPlayer` existente;
  - `assignGuardians(...)`, que refresca la ficha.
- **`GuardianPickerDrawer`**:
  - buscador (`searchKey` sobre nombre y celular) y lista;
  - al elegir uno, el parentesco (radio, como en `GuardianDrawer`) y «Asignar a [jugador]»;
  - «Registrar un acudiente nuevo» cierra el selector y abre `GuardianDrawer`.
- **`CopyGuardiansDrawer`**:
  - buscador de jugadores con acudientes;
  - al elegir uno, sus acudientes con casilla (marcados por defecto, salvo los que ya son de este jugador, que se muestran deshabilitados) y un `p-select` de parentesco por fila;
  - el botón «Asignar N acudientes».
- **Ficha**:
  - «Agregar acudiente» abre el selector si hay acudientes en la academia; si no, el formulario;
  - «Copiar de un hermano» como acción secundaria de la sección Acudientes.

## R5 — Pruebas

- **pgTAP `080-guardian-assignment.test.sql`**:
  - columnas nuevas obligatorias en `guardians` y ausentes en `guardian_links`;
  - `add_player_guardian` guarda la autorización en la persona;
  - `assign_guardians`:
    - asigna uno;
    - asigna varios;
    - omite los repetidos (devuelve el número creado);
    - rechaza un parentesco inválido;
    - rechaza un acudiente de otra academia sin asignar ninguno;
    - el owner B no puede usarla con un jugador de A.
- **Traslado de datos**: pgTAP corre después de todas las migraciones, así que no puede preparar datos con el esquema anterior.
  - **Decisión**: el traslado se verifica en el quickstart, con datos reales. Se crean acudientes con la spec 009 antes de aplicar la migración y después se comprueban por SQL (paso 1).
  - pgTAP verifica que ningún acudiente queda sin autorización (`not null`).
- **`070`**: se ajustan las aserciones de `consent_document_id` (ahora en `guardians`).
- **Vitest**: repositorio (`listGuardians`, `assign`), servicio (opciones, hermanos, asignar), los dos drawers y la ficha.

## R6 — Maquetas antes de implementar

Página publicada con 4 maquetas a 360 px, en tonos grises:

1. la ficha con «Agregar acudiente» y «Copiar de un hermano»;
2. el selector con buscador y la lista;
3. el selector con un acudiente elegido y el parentesco;
4. «Copiar acudientes de un hermano».

Se guardan en `mockups/` cuando el responsable las aprueba.
