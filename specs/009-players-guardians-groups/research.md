# Investigación: Jugadores, acudientes y grupos

## R1 — `current_user_id()` (ADR-017)

- **Decisión**: la migración crea `public.current_user_id()` (`select auth.uid()`, `stable`, `security invoker`). Las tablas nuevas la usan en `created_by default` y en sus políticas.
- **Motivo**: ADR-017 prohíbe usos nuevos de `auth.uid()` fuera de las funciones de autorización y prevé esta función como mejora. Al migrar a otro backend solo cambia esta función. Las tablas antiguas no se tocan aquí (deuda registrada en ADR-017).

## R2 — Tablas

- `players`, `groups`, `guardians`, `guardian_links`: tablas de negocio con borrado lógico (`deleted_at`), auditoría (`created_by`, `created_at`, `updated_at` con `set_updated_at()`) y `unique (academy_id, id)` para claves compuestas.
- `group_members (academy_id, group_id, player_id)`: relación con **borrado físico** (Complejidad del plan). Claves foráneas compuestas `(academy_id, group_id)` y `(academy_id, player_id)`, para que un jugador nunca quede en un grupo de otra academia.
- `guardian_links`: estado `pending | validated | rejected` (aquí siempre `validated`; los otros llegan en la spec 4) y parentesco `mother | father | grandparent | other | self` (`self` = «Soy el jugador», spec 4).
- Los dispositivos (DEC-40) llegan en la spec 4.

## R3 — Jugador duplicado en la base de datos (DEC-42)

- **Decisión**: función inmutable `public.normalize_name(text)` (`lower`, `unaccent` con el diccionario explícito, espacios colapsados y recortados). Índice único `(academy_id, normalize_name(first_names || ' ' || last_names), birth_date) where deleted_at is null`.
- **Detección para ofrecer actualizar**: `find_player_by_identity(p_first_names, p_last_names, p_birth_date)` devuelve el jugador no eliminado de la academia del usuario que coincide. El frontend la consulta antes de guardar. Si de todos modos la inserción choca con el índice (carrera entre pestañas), el error `duplicate` lleva al mismo aviso.
- **Motivo**: principio VIII. La regla no depende solo de la pantalla.
- **Extensión**: `unaccent` ya está instalada en el esquema `extensions` (migración `20261016100000`, la usa `slugify`). `normalize_name` la llama como `extensions.unaccent('extensions.unaccent', ...)`, con el diccionario explícito para que la función pueda ser `immutable`.

## R4 — Validaciones en la base de datos

- **Celular**: `check (phone ~ '^3[0-9]{9}$')` en `players.phone` (nullable) y `guardians.phone`. El frontend quita espacios y guiones antes de enviar.
- **Fecha de nacimiento**: `check (birth_date >= date '1900-01-01')` más un trigger que rechaza fechas futuras o de hace más de 100 años (`current_date` no es inmutable y no puede ir en un `check`).
- **Nombres**: `check (length(trim(...)) between 1 and 80)`. Nombre de grupo: entre 1 y 60 caracteres, único por academia con `lower(trim(name))` entre los no eliminados.
- **Acudiente**: celular único por academia entre los no eliminados (identifica a la persona, DEC-40 y FR-011).

## R5 — `add_player_guardian` y autorización de datos (DEC-39, DEC-40)

- **Decisión**: función `add_player_guardian(p_player_id, p_full_name, p_phone, p_relationship, p_consent boolean)`, `security invoker`. Exige `p_consent = true`; busca o crea al acudiente por celular en la academia del jugador; crea el vínculo `validated`; y guarda la versión vigente de la Política de Tratamiento de Datos (`legal_documents`, `privacy_policy`, `is_current`) y la hora del servidor en el vínculo.
- **Si el celular ya existe**: la función devuelve `guardian_existed = true` y el nombre registrado. El frontend avisa «Este celular es de [nombre], ya registrado» y vincula a esa persona (CA-003 de HU-034).
- **Motivo**: atomicidad (persona más vínculo), sin duplicar personas, y una autorización registrada en el servidor, no la que diga el cliente.
- **Editar y retirar**: `update` directo con RLS. Retirar pone `deleted_at` en el vínculo; si el acudiente se queda sin vínculos, simplemente deja de mostrarse.

## R6 — Frontend: features y capas

- **`features/players`**:
  - `PlayerRepository` (listar con grupos y conteo de acudientes, obtener, crear, actualizar, activar, eliminar, `findByIdentity`);
  - `GuardianRepository` (por jugador, `addToPlayer` vía RPC, actualizar, retirar);
  - servicios con señales y `busy`;
  - páginas: listado, ficha (con acudientes) y formulario.
- **`features/groups`**: `GroupRepository` (listar con conteo de activos, obtener con integrantes, crear, renombrar, eliminar, agregar y quitar integrantes); servicio; listado y página del grupo.
- Patrón de Sedes (spec 004): `run()`, refresco tras cada operación, `not_found` → recargar, `cleanInput`.
- **Validador de celular** en `shared/forms/phone.validator.ts`, porque lo usan dos features (principio IV).

## R7 — Listado eficiente (SC-002)

Una consulta con embebidos de PostgREST: `players` → `group_members(groups(id,name))` y el conteo de `guardian_links` validados y no eliminados. La búsqueda (nombre, apellido o apodo, sin tildes) y los filtros se aplican en el cliente, con 200 jugadores. La edad se calcula en el cliente con la fecha de Colombia.

## R8 — Pruebas

- **pgTAP `070-players-groups-guardians.test.sql`**:
  - tablas con RLS y sin borrado físico (excepto `group_members`);
  - `current_user_id()`;
  - normalización y duplicado (tildes, mayúsculas, espacios; eliminado no bloquea);
  - formatos de celular y fecha;
  - nombre único de grupo;
  - el grupo de otra academia no acepta jugadores (clave compuesta);
  - `add_player_guardian` (exige autorización, reutiliza la persona, versión registrada);
  - aislamiento A/B de lectura y escritura;
  - solo el owner escribe.
- **Vitest**: repositorios (traducción y errores), servicios (limpieza, duplicado, refresco) y páginas (criterios de las HU).
- **Quickstart** contra Supabase local, restaurando el seed al final (pgTAP 144 + nuevas).

## R9 — Maquetas antes de implementar (FR-016)

- **Decisión**: una página publicada con maquetas de **baja fidelidad** a 360 px (tonos grises, estructura, textos reales) de las 5 pantallas principales. Incluye **dos opciones de navegación**, porque la spec 2 añadirá Actividades:
  - **A**: barra inferior Inicio · Jugadores · Grupos · Academia (Sedes dentro de Academia).
  - **B**: barra inferior Inicio · Jugadores (con pestañas Jugadores y Grupos) · Actividades (spec 2) · Academia.
- El responsable las aprueba o pide cambios. La versión aprobada se guarda en `mockups/` y ajusta `contracts/ui-contracts.md` antes de `/speckit-tasks`.
- **Resultado (2026-10-18)**: aprobadas con la **navegación B** y con todos los formularios en **drawer**, como en Sedes (`mockups/README.md`).
