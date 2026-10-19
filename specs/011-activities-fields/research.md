# Investigación: Actividades y canchas externas

## R1 — Horas como instantes

- **Decisión**: `starts_at`, `ends_at` y `call_at` son `timestamptz`.
- **En el frontend**: el owner escribe una fecha y horas de Colombia; `shared/text/colombia-time.ts` las convierte con el desfase fijo `-05:00` (Colombia no tiene horario de verano) y agrupa los días con `America/Bogota`.
- **Motivo**: «pasada» es una comparación directa con `now()` en la base de datos, y las horas son coherentes por comparación de instantes. La fecha sola no sirve para la regla de inmutabilidad.
- **Alternativa descartada**: guardar `date` y `time` por separado. Complica las comparaciones y la regla de «pasada».

## R2 — Lugar: sede o cancha

- `venue_id` y `external_field_id`, nulos, con `check (num_nonnulls(venue_id, external_field_id) = 1)`.
- Claves foráneas compuestas `(academy_id, venue_id)` → `venues (academy_id, id)` y `(academy_id, external_field_id)` → `external_fields (academy_id, id)`.
- **Lugar vigente**: un trigger exige, al insertar o al cambiar el lugar, una sede activa y no eliminada o una cancha no retirada (`23514`). Si la sede o la cancha se retira después, la actividad conserva su lugar (FR-010).

## R3 — Reglas de tiempo en la base de datos (FR-002, FR-007)

Trigger `activities_guard` (`before insert or update`):

- **Al insertar**: `starts_at > now()`; si no, `23514`.
- **Al actualizar**: si `old.starts_at <= now()`, solo se permite cambiar `deleted_at` (eliminar). Cualquier otro cambio responde `23514`.
- **Al actualizar una próxima**: el nuevo `starts_at` también debe ser futuro.
- **Checks de tabla**:
  - `ends_at > starts_at`;
  - `call_at <= starts_at`;
  - rival y torneo solo en competencia: `type = 'competition' or (opponent is null and tournament is null)`.
- **Motivo**: principio VIII; la pantalla anticipa las mismas reglas con mensajes claros.

## R4 — Tablas y permisos

- **`external_fields`**: nombre de 1 a 80 caracteres, único `(academy_id, lower(trim(name)))` entre los no retirados; dirección, ciudad e indicaciones opcionales.
- **`activities`**:
  - `type` (`training` o `competition`) y `status` (`scheduled` o `cancelled`);
  - observaciones (hasta 500 caracteres), rival y torneo (hasta 80);
  - `series_id` (uuid común de una repetición; solo informativo).
- **RLS**: leen los miembros; inserta el owner con `created_by = current_user_id()`; actualiza el owner. Sin `delete` (borrado lógico).

## R5 — Repetición semanal (FR-004)

- **Decisión**: el servicio genera las fechas entre la fecha de inicio y la final (como máximo 6 meses), en los días elegidos, con las mismas horas. Las inserta con **un solo `insert` de varias filas** y un `series_id` común. Es una sentencia, así que es atómica: si una fila falla, no se guarda ninguna.
- **Límite de 6 meses**: es una regla de interfaz. La base de datos protege cada actividad (fecha futura, lugar vigente, horas coherentes).
- **Sin días que caigan en el rango**: el formulario lo indica y no envía nada.
- **Alternativa descartada**: una función SQL que genere la serie. Duplica la lógica de zona horaria en dos lenguajes sin ganar seguridad.

## R6 — Frontend

- **`ActivityRepository`**:
  - `list({ when: 'upcoming' | 'past' })`: una consulta con el lugar embebido; las próximas en orden ascendente y las pasadas en descendente;
  - `get`, `create(inputs[])`, `update`, `setStatus`, `delete`.
- **`ExternalFieldRepository`**: `list`, `create` (devuelve la cancha creada, para dejarla elegida), `update`, `retire`.
- **`PlaceOptions`**: sedes activas (de `VenueRepository`, reutilizado sin tocar la feature de sedes) y canchas no retiradas.
- **`ActivitiesService`**: filtro (próximas o pasadas), tipo, agrupación por día con `colombia-time`, `run()` y refresco, como en la spec 009.
- **Drawers**:
  - `ActivityFormDrawer`: tipo, fecha, horas, lugar (`p-select` agrupado Sedes y Canchas, con «Nueva cancha»), rival y torneo (solo en competencia), observaciones, y «Repetir» (al crear) con días y fecha final;
  - `ExternalFieldDrawer`: nombre, dirección, ciudad e indicaciones.

## R7 — Navegación

Barra inferior: Inicio · Jugadores · **Actividades** · Academia · Sedes (5 destinos, el máximo de `ui.md`). Para el catálogo de canchas, las maquetas muestran dos opciones:

- **A**: pestañas **Actividades | Canchas** dentro de Actividades, como Jugadores | Grupos (spec 009). Recomendada, porque las canchas solo existen para las actividades.
- **B**: Configuración › Canchas, junto a Sedes. Sumaría un sexto destino y obligaría a «Más».

## R8 — Pruebas y maquetas

- **pgTAP `090-activities-fields.test.sql`**:
  - RLS y ausencia de `delete`;
  - lugar único (exactamente uno) y vigente;
  - claves compuestas: una sede de otra academia no sirve;
  - no crear en el pasado;
  - horas coherentes;
  - rival solo en competencia;
  - una actividad pasada: no se edita ni se cancela, sí se elimina (se prepara como superusuario con `starts_at` pasado, desactivando el trigger en la transacción);
  - nombre de cancha único;
  - retirar una cancha conserva la actividad;
  - aislamiento A/B.
- **Vitest**: `colombia-time`, generación de la serie, repositorios, servicio, drawers (a través de las páginas) y páginas.
- **Maquetas**: 5, a 360 px:
  1. listado con pestañas;
  2. detalle;
  3. formulario;
  4. formulario con lugar y repetición;
  5. pestaña Canchas.
