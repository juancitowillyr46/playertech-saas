---

description: "Lista de tareas para implementar la base de datos de la Fundación SaaS"
---

# Tareas: Base de datos de la Fundación SaaS

**Input**: Documentos de diseño de `/specs/001-database-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Se incluyen tareas de prueba porque la spec las exige (FR-036, FR-037) y el aislamiento entre academias solo se demuestra con pruebas de base de datos.

**Organización**: Las tareas se agrupan por historia de la spec. Como el esquema es compartido, las migraciones que todas las historias necesitan están en la Fase 2 (fundaciones); cada historia aporta después sus piezas propias y sus pruebas.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: Puede ejecutarse en paralelo (archivo distinto y sin dependencias pendientes).
- **[Story]**: Historia de la spec (US1 a US6).

## Convenciones

- Raíz del repositorio: `package.json`, `supabase/`.
- Migraciones: `supabase/migrations/<timestamp>_<nombre>.sql`, creadas con `npx supabase migration new <nombre>`. Las marcas de tiempo deben respetar el orden de `research.md` (R13).
- Pruebas: `supabase/tests/database/NNN-<nombre>.test.sql` (pgTAP). Cada archivo empieza con `BEGIN;` y `SELECT plan(n);` y termina con `SELECT * FROM finish();` y `ROLLBACK;`.
- Fuente del modelo: `docs/architecture/database-schema.md` (Fase 1). Decisiones: `specs/001-database-foundation/research.md` (R1–R14) y `data-model.md`.
- Toda función `SECURITY DEFINER` declara `SET search_path = ''` y usa nombres calificados (`public.`, `auth.`, `storage.`).

---

## Fase 1: Configuración

**Propósito**: Preparar la herramienta y el proyecto Supabase local.

- [X] T001 Crear `package.json` en la raíz del repositorio con `"private": true`, `supabase` fijado en `"2.119.0"` en `devDependencies` y los scripts: `db:start` (`supabase start`), `db:stop` (`supabase stop`), `db:status` (`supabase status`), `db:reset` (`supabase db reset`), `db:test` (`supabase test db`) y `db:types` (`supabase gen types typescript --local > frontend/src/app/core/supabase/database.types.ts`) (research R1, R14)
- [X] T002 Ejecutar `npm install` en la raíz y verificar que `.gitignore` de la raíz excluye `node_modules/` del nivel raíz; generar `package-lock.json`
- [X] T003 Ejecutar `npx supabase init` en la raíz para crear `supabase/config.toml` y `supabase/.gitignore`; fijar `project_id = "playertech-saas"` en `supabase/config.toml` y confirmar que `[db] major_version` corresponde a la versión de PostgreSQL de la CLI
- [X] T004 Configurar en `supabase/config.toml` la sección `[db.seed]` con `enabled = true` y `sql_paths = ["./seed.sql"]`
- [X] T005 [P] Crear `supabase/README.md` con: requisitos (Docker Desktop, Node 20.19+), comandos `npm run db:*`, flujo de una nueva migración según `docs/architecture/supabase-migrations-guide.md`, usuarios de prueba (`owner.a@playertech.test`, `owner.b@playertech.test`) y su contraseña **solo de desarrollo local** (`PlayerTech-Local-2026`)
- [X] T006 [P] Crear `supabase/tests/database/000-test-helpers.test.sql` (sin `ROLLBACK`, para que persista durante la ejecución) que habilita `pgtap` y crea el esquema `tests` con: `tests.create_user(p_email text, p_metadata jsonb) returns uuid` (inserta en `auth.users` y `auth.identities` con correo confirmado y las columnas que exige Supabase Auth, igual que el seed de T019), `tests.authenticate_as(p_user_id uuid)` (fija `role authenticated` y `request.jwt.claims` con `sub`), `tests.authenticate_as_anon()` y `tests.clear_authentication()` (research R2); el archivo DEBE ser idempotente para poder ejecutar `db:test` varias veces sin `db:reset`: `create extension if not exists pgtap with schema extensions`, `create schema if not exists tests`, `create or replace function`; incluir una aserción trivial para que el archivo sea un test válido. `pgtap` vive solo aquí, nunca en una migración (research R13)

**Punto de control**: `npm run db:start` levanta el entorno local.

---

## Fase 2: Fundaciones (bloqueantes)

**Propósito**: Esquema, autorización y registro que todas las historias necesitan.

**⚠️ CRÍTICO**: Ninguna historia puede empezar hasta completar esta fase.

- [X] T007 Crear la migración `foundation_extensions_and_helpers` en `supabase/migrations/`: `create extension if not exists unaccent with schema extensions`; función `public.set_updated_at()` (trigger `BEFORE UPDATE` que asigna `now()` a `updated_at`); función `public.slugify(p_text text) returns text` (`unaccent`, minúsculas, caracteres no alfanuméricos → `-`, sin guiones repetidos ni en los extremos) (research R3, R13)
- [X] T008 Crear la migración `platform_catalogs`: tabla `public.plans` (`code` "NOT NULL, UNIQUE, CHECK (`free`, `pro`, `advanced`)", `name` NOT NULL, `max_venues`, `max_members`, `max_players` int NULL "NULL = ilimitado", `is_active` boolean NOT NULL DEFAULT true, `created_at`) y `public.legal_documents` (`type` "CHECK (`terms`, `privacy_policy`)", `version` NOT NULL, `url` NOT NULL, `published_at` NOT NULL, `is_current` boolean NOT NULL DEFAULT false, `UNIQUE (type, version)`, índice único parcial sobre `type` WHERE `is_current`); insertar los planes `free`, `pro`, `advanced` con límites en NULL y los documentos `terms` y `privacy_policy` versión `2026-10-v1`, vigentes, con URL provisional `https://playertech.app/legal/<type>/2026-10-v1` (data-model "Datos de referencia")
- [X] T009 Crear la migración `identity_profiles`: tabla `public.profiles` (`user_id` uuid PK FK → `auth.users` ON DELETE CASCADE, `full_name` text NOT NULL, `created_at`, `updated_at`) con trigger `set_updated_at`
- [X] T010 Crear la migración `tenancy_core`: `public.academies` según `database-schema.md` (`name` NOT NULL, `slug` NOT NULL UNIQUE, `status` "NOT NULL DEFAULT `active`, CHECK (`active`, `suspended`)", `country_code` char(2) NOT NULL DEFAULT `CO`, `timezone` text NOT NULL DEFAULT `America/Bogota`, `logo_file_id` uuid NULL, `contact_email`, `contact_phone`, `address`, `city` NULL, `created_by` FK → `auth.users`, `created_at`, `updated_at`); `public.subscriptions` (`academy_id` FK, `plan_id` FK → `plans`, `status` "CHECK (`active`, `cancelled`)", `started_at` DEFAULT now(), `ends_at`, `provider_ref` NULL, índice único parcial sobre `academy_id` WHERE `status = 'active'`); `public.academy_members` (`academy_id` FK, `user_id` "NOT NULL, **UNIQUE**, FK → `auth.users`", `role` "NOT NULL, CHECK (`owner`)", `status` "NOT NULL DEFAULT `active`, CHECK (`active`, `disabled`)", índice único parcial sobre `academy_id` WHERE `role = 'owner'`); triggers `set_updated_at` donde haya `updated_at`
- [X] T011 Crear la migración `files`: `public.files` según `database-schema.md` (`bucket` "CHECK (`public-assets`, `private-files`)", `storage_key` NOT NULL UNIQUE, `module`, `entity_id`, `original_name`, `mime_type`, `size_bytes`, `checksum_sha256` NULL, `created_by` "NOT NULL DEFAULT `auth.uid()`", `created_at`, `deleted_at`), `UNIQUE (academy_id, id)`, CHECK "`storage_key LIKE academy_id::text || '/%'`" (la clave pertenece a la academia de la fila); añadir a `academies` la FK compuesta `(id, logo_file_id) REFERENCES public.files (academy_id, id)` (research R6)
- [X] T012 Crear la migración `venues`: `public.venues` según `database-schema.md` (`name` NOT NULL, `type` "NOT NULL DEFAULT `training_ground`, CHECK (`office`, `training_ground`)", `address`, `city`, `directions` NULL, `is_primary` boolean NOT NULL DEFAULT false, `is_active` boolean NOT NULL DEFAULT true, `deleted_at`, `created_by` "NOT NULL DEFAULT `auth.uid()`", `created_at`, `updated_at`); `UNIQUE (academy_id, id)`; índice único parcial sobre `academy_id` WHERE `is_primary AND deleted_at IS NULL`; CHECK "`NOT is_primary OR (is_active AND deleted_at IS NULL)`"; índice único parcial sobre (`academy_id`, `lower(name)`) WHERE `deleted_at IS NULL`; trigger `set_updated_at`
- [X] T013 Crear la migración `legal_acceptances`: `public.legal_acceptances` (`user_id` FK → `auth.users`, `academy_id` FK → `academies`, `legal_document_id` FK → `legal_documents`, `accepted_at` timestamptz NOT NULL DEFAULT now(), `ip_address` inet NULL, `user_agent` text NULL) (DEC-29: IP y navegador quedan vacíos en el MVP)
- [X] T014 Crear la migración `authorization_functions`: `public.is_academy_member(p_academy_id uuid) returns boolean`, `public.current_academy_id() returns uuid` y `public.has_academy_role(p_academy_id uuid, p_roles text[]) returns boolean`, todas `STABLE SECURITY DEFINER SET search_path = ''`, comprobando membresía `active` **y** academia `active` con `auth.uid()`; `REVOKE EXECUTE ... FROM public, anon`; `GRANT EXECUTE ... TO authenticated`; índice sobre `academy_members (user_id)` si no lo cubre el UNIQUE (research R5; contracts/database-api.md)
- [X] T015 Crear la migración `rls_policies_and_grants`: `ENABLE ROW LEVEL SECURITY` en las 9 tablas; políticas según la matriz de `docs/architecture/database-schema.md` usando solo las funciones de T014 (`plans`: SELECT a `authenticated`; `legal_documents`: SELECT a `anon` y `authenticated`; `profiles`: SELECT y UPDATE propios; `academies`, `subscriptions`, `venues`, `files`: SELECT con `is_academy_member(academy_id)`; `academies` UPDATE y `venues` INSERT/UPDATE con `has_academy_role(academy_id, '{owner}')`; `files` INSERT/UPDATE con `is_academy_member`; las políticas de INSERT de `venues` y `files` añaden `WITH CHECK (created_by = auth.uid())` para que el autor no pueda falsificarse (FR-031); `academy_members` y `legal_acceptances`: SELECT de las propias filas); sin políticas de DELETE ni de INSERT en tablas del registro; privilegios por columna: `REVOKE UPDATE` de tabla y `GRANT UPDATE` solo sobre `profiles(full_name)`, `academies(name, logo_file_id, contact_email, contact_phone, address, city)`, `venues(name, type, address, city, directions, is_active, deleted_at)`, `files(deleted_at)`; `REVOKE TRUNCATE` sobre las 9 tablas a `anon` y `authenticated` (RLS no cubre `TRUNCATE`) (research R7, R9)
- [X] T016 Crear la migración `registration`: función `public.handle_new_user()` `SECURITY DEFINER SET search_path = ''` y trigger `AFTER INSERT ON auth.users FOR EACH ROW`, que valida `raw_user_meta_data` según `contracts/registration-metadata.md` ("`academy_name` y `full_name` no vacíos tras recortar espacios"; "`legal_acceptances.terms` y `legal_acceptances.privacy_policy` iguales a las versiones vigentes") y crea en orden (los `created_by` se asignan explícitamente con `new.id`, porque dentro del trigger `auth.uid()` es NULL): `profiles`, `academies` (`slug` con `slugify` y sufijo numérico reintentando ante `unique_violation`; `contact_email = lower(trim(new.email))`), `academy_members` (`owner`), `subscriptions` (plan `free`, `active`), `venues` ("Sede principal", `training_ground`, `is_primary = true`) y dos `legal_acceptances`; cualquier validación fallida lanza excepción (research R3); función `public.set_primary_venue(p_venue_id uuid) returns void` `SECURITY DEFINER` que exige `has_academy_role(<academia de la sede>, '{owner}')`, sede activa y no eliminada, y en una transacción desmarca la principal actual y marca la nueva; `GRANT EXECUTE` a `authenticated` (research R8)
- [X] T017 Ejecutar `npm run db:reset` y corregir hasta que todas las migraciones se apliquen sin errores sobre un entorno vacío

**Punto de control**: el esquema completo se aplica desde cero.

---

## Fase 3: Historia 1 — Entorno de datos reproducible (Prioridad: P1) 🎯 MVP

**Objetivo**: Reconstruir desde cero el modelo, los datos de referencia y las academias A y B (CA-001 de T-00).

**Prueba independiente**: `npm run db:reset` dos veces y `010-schema` en verde.

### Pruebas de la Historia 1

- [X] T018 [P] [US1] Crear `supabase/tests/database/010-schema.test.sql`: verificar que existen las 9 tablas de la Fase 1, que **todas** tienen RLS habilitado (`pg_class.relrowsecurity`), que existen `is_academy_member`, `current_academy_id`, `has_academy_role`, `set_primary_venue` y `handle_new_user`, que `anon` no tiene `EXECUTE` sobre las funciones de autorización, que existen 3 planes y que hay exactamente un documento vigente por tipo

### Implementación de la Historia 1

- [X] T019 [US1] Crear `supabase/seed.sql` que inserta en `auth.users` y `auth.identities` dos usuarios con UUID fijos (`aaaaaaaa-0000-4000-8000-00000000000a` y `bbbbbbbb-0000-4000-8000-00000000000b`), correos `owner.a@playertech.test` y `owner.b@playertech.test`, `email_confirmed_at = now()`, contraseña `crypt('PlayerTech-Local-2026', gen_salt('bf'))`, las columnas que Supabase Auth necesita para permitir el inicio de sesión (`instance_id = '00000000-0000-0000-0000-000000000000'`, `aud = 'authenticated'`, `role = 'authenticated'`, `raw_app_meta_data = '{"provider":"email","providers":["email"]}'`, y `confirmation_token`, `recovery_token`, `email_change`, `email_change_token_new` como `''`, no NULL), una fila en `auth.identities` por usuario (`provider = 'email'`, `provider_id` = id del usuario, `identity_data` con `sub` y `email`) y `raw_user_meta_data` válido (`academy_name` "Academia A" / "Academia B", `full_name` "Owner A" / "Owner B", versiones legales `2026-10-v1`), de modo que el trigger cree sus academias con slugs `academia-a` y `academia-b` (research R12)
- [X] T020 [US1] Ejecutar `npm run db:reset` dos veces seguidas y verificar en Studio el mismo resultado: 3 planes, 2 documentos vigentes, academias `academia-a` y `academia-b` con sede principal y suscripción Free; medir el tiempo de reconstrucción (SC-001, SC-002)

**Punto de control**: entorno reproducible con datos de prueba.

---

## Fase 4: Historia 2 — Aislamiento entre academias (Prioridad: P1)

**Objetivo**: La base de datos impide cualquier acceso entre academias (CA-002, CA-003, CA-005 de T-00).

**Prueba independiente**: `030-isolation` y `040-suspension` en verde.

### Pruebas de la Historia 2

- [X] T021 [P] [US2] Crear `supabase/tests/database/030-isolation.test.sql` usando las academias del seed: para `academies`, `subscriptions`, `academy_members`, `venues`, `files`, `legal_acceptances` y `profiles`, verificar como owner A que lee solo lo propio y que **no** lee, crea, modifica ni elimina registros de B; que insertar una sede o un archivo con `academy_id` de B se rechaza; que insertar una sede o un archivo propio con `created_by` de otro usuario se rechaza y que, sin indicarlo, `created_by` queda con el id de A; que registrar en `files` (con `academy_id` de A) una `storage_key` que empieza por el id de B se rechaza; que la creación directa en `academies`, `academy_members`, `subscriptions` y `legal_acceptances` se rechaza; que un usuario sin membresía no lee datos de academia; que `anon` no lee datos de academia, no lee `plans` y sí lee `legal_documents`
- [X] T022 [P] [US2] Crear `supabase/tests/database/040-suspension.test.sql`: poner `academia-a` en `suspended` (como superusuario dentro de la transacción), verificar que su owner no puede leer ni modificar sus sedes ni su academia, que `current_academy_id()` devuelve NULL y que los datos siguen existiendo; verificar lo mismo para una membresía `disabled`

### Implementación de la Historia 2

- [X] T023 [US2] Ejecutar `npm run db:test` y corregir las políticas de `supabase/migrations/*_rls_policies_and_grants.sql` o las funciones de `*_authorization_functions.sql` hasta que T021 y T022 pasen (si las migraciones ya se compartieron, corregir con una migración nueva)

**Punto de control**: aislamiento verificado en todas las tablas protegidas (SC-003).

---

## Fase 5: Historia 3 — Registro atómico de academia (Prioridad: P1)

**Objetivo**: El registro crea todo o nada (CA-004 de T-00; HU-014).

**Prueba independiente**: `020-registration` en verde.

### Pruebas de la Historia 3

- [X] T024 [P] [US3] Crear `supabase/tests/database/020-registration.test.sql`: con `tests.create_user` y metadatos válidos, verificar que existen perfil, academia (`country_code = 'CO'`, `timezone = 'America/Bogota'`, `status = 'active'`, `contact_email` igual al correo normalizado), membresía `owner` activa, suscripción `free` activa, sede "Sede principal" `training_ground` principal y activa, y dos aceptaciones con la versión vigente; verificar que faltar `academy_name`, `full_name` o una versión legal, o enviar una versión no vigente, lanza error y **no deja** fila en `auth.users` ni en ninguna tabla; verificar que dos registros con el mismo `academy_name` producen slugs distintos; verificar que un correo con mayúsculas o espacios se guarda normalizado en `contact_email`; verificar que un segundo `tests.create_user` con un correo ya registrado falla y no crea una segunda academia (escenario 7). Los registros simultáneos no se prueban con pgTAP: los cubre por diseño el reintento ante `unique_violation` (research R3)

### Implementación de la Historia 3

- [X] T025 [US3] Ejecutar `npm run db:test` y corregir `supabase/migrations/*_registration.sql` hasta que T024 pase (SC-004)

**Punto de control**: registro atómico verificado.

---

## Fase 6: Historia 4 — Reglas de integridad del dominio (Prioridad: P2)

**Objetivo**: La base de datos rechaza cualquier violación de las reglas de la Fase 1.

**Prueba independiente**: `050-integrity` en verde.

### Pruebas de la Historia 4

- [X] T026 [P] [US4] Crear `supabase/tests/database/050-integrity.test.sql` como owner A: crear una segunda sede; verificar que no puede desactivar ni eliminar la sede principal; que `set_primary_venue` sobre una sede inactiva falla y sobre una activa cambia la principal dejando exactamente una; que el owner B no puede ejecutar `set_primary_venue` sobre sedes de A; que no puede actualizar `is_primary` directamente; que un nombre de sede duplicado (sin distinguir mayúsculas) se rechaza y que el nombre de una sede eliminada se puede reutilizar; que no puede modificar `status`, `slug`, `country_code` ni `timezone` de su academia y sí `name` y `contact_phone`; que no puede actualizar ni eliminar sus `legal_acceptances`; que al modificar una sede su `updated_at` cambia (FR-008); y, como superusuario, que una segunda membresía para el mismo usuario, un segundo owner, una segunda suscripción activa o un segundo documento vigente del mismo tipo violan sus restricciones

### Implementación de la Historia 4

- [X] T027 [US4] Ejecutar `npm run db:test` y corregir restricciones, privilegios por columna o `set_primary_venue` hasta que T026 pase (SC-005)

**Punto de control**: reglas de integridad verificadas.

---

## Fase 7: Historia 5 — Almacenamiento de archivos aislado (Prioridad: P2)

**Objetivo**: Buckets portables y aislados por academia (CA-006 de T-00; ADR-013).

**Prueba independiente**: `060-storage` en verde.

### Pruebas de la Historia 5

- [X] T028 [P] [US5] Crear `supabase/tests/database/060-storage.test.sql`: verificar que existen los buckets `public-assets` (público, `file_size_limit` de 1048576, `allowed_mime_types` `{image/jpeg,image/png}`) y `private-files` (privado); como owner A, que insertar en `storage.objects` con ruta `<academia A>/academy/<id>/<file_id>.png` se permite y con ruta de la academia B o con un primer segmento que no es UUID se rechaza; que A registra en `public.files` su propio archivo con clave, tipo, tamaño y autor (escenario 1); que A no lee objetos de `private-files` de B; que `anon` puede leer los objetos de `public-assets` (escenario 4); y que registrar en `public.files` una fila de B se rechaza. Los límites de tipo y tamaño los aplica la API de Storage, no la base de datos: aquí solo se verifica la configuración del bucket; la subida rechazada se valida en T032

### Implementación de la Historia 5

- [X] T029 [US5] Crear la migración `storage` en `supabase/migrations/`: insertar en `storage.buckets` `public-assets` (`public = true`, `file_size_limit = 1048576`, `allowed_mime_types = '{image/jpeg,image/png}'`) y `private-files` (`public = false`); políticas en `storage.objects` para INSERT, UPDATE y DELETE en ambos buckets y SELECT en `private-files`, que exigen que `(storage.foldername(name))[1]` cumpla el patrón de UUID y que `public.is_academy_member(((storage.foldername(name))[1])::uuid)` sea verdadero (research R10)
- [X] T030 [US5] Ejecutar `npm run db:reset` y `npm run db:test` y corregir hasta que T028 pase

**Punto de control**: almacenamiento aislado verificado.

---

## Fase 8: Historia 6 — Autenticación local configurada (Prioridad: P3)

**Objetivo**: El entorno local aplica las reglas de Auth de producción (ADR-014).

**Prueba independiente**: pasos de las secciones 3 y 4 de `quickstart.md`.

### Implementación de la Historia 6

- [ ] T031 [US6] Configurar en `supabase/config.toml`: `[auth] site_url = "http://localhost:4200"`, `additional_redirect_urls = ["http://localhost:4200/auth/callback"]`, `jwt_expiry = 3600`, `minimum_password_length = 8`, `enable_signup = true`; `[auth.email] enable_signup = true`, `enable_confirmations = true` (research R11)
- [ ] T032 [US6] Reiniciar el entorno (`npm run db:stop` y `npm run db:start`) y validar manualmente las secciones 3 y 4 de `specs/001-database-foundation/quickstart.md` contra las API locales: registro válido, inicio de sesión rechazado antes de verificar, correo capturado en el visor local, inicio de sesión permitido tras verificar, contraseña de 7 caracteres rechazada, correo de recuperación capturado, claim `exp` del token igual a `iat + 3600`, inicio de sesión con `owner.a@playertech.test` del seed, y subidas a `public-assets` de un archivo no permitido (por ejemplo PDF) y de una imagen mayor de 1 MB rechazadas por la API de Storage (FR-030, FR-034); anotar el resultado en `supabase/README.md`

**Punto de control**: Auth local validado.

---

## Fase 9: Pulido y validación transversal

**Propósito**: Tipos para el frontend, seguridad, documentación y validación final.

- [ ] T033 [P] Crear la carpeta `frontend/src/app/core/supabase/` y ejecutar `npm run db:types` para generar `frontend/src/app/core/supabase/database.types.ts`; verificar que contiene las 9 tablas y las 4 funciones (research R14)
- [ ] T034 [P] Revisar el repositorio en busca de secretos: ninguna `service_role` key, contraseña real ni archivo `.env` versionado; confirmar que la única contraseña presente es la de desarrollo local documentada (SC-006, FR-038)
- [ ] T035 [P] Completar `supabase/README.md` con el resultado de la validación, la estructura de `supabase/`, el enlace a esta spec y la limitación conocida del registro: el trigger `handle_new_user` se ejecuta en **toda** alta de `auth.users`, así que las altas sin metadatos de registro (invitaciones, usuarios creados desde Studio, futuros roles de la Fase 2) fallarán hasta que se rediseñe para otros roles
- [ ] T036 Ejecutar de punta a punta `specs/001-database-foundation/quickstart.md` (secciones 1 a 6) y registrar los resultados
- [ ] T037 Actualizar el estado de T-00 en `docs/backlog/enablers/T-00-saas-foundation.md` (áreas 1 a 6 implementadas, spec `specs/001-database-foundation/`, limitación conocida del trigger de registro) y revisar que `docs/architecture/database-schema.md` refleja cualquier ajuste surgido durante la implementación

---

## Dependencias y orden de ejecución

### Por fase

- **Fase 1 (Configuración)**: sin dependencias.
- **Fase 2 (Fundaciones)**: depende de la Fase 1; **bloquea todas las historias**. Las migraciones T007–T016 son secuenciales (orden de aplicación).
- **Fase 3 (US1)**: depende de la Fase 2 (el seed usa el trigger de registro).
- **Fases 4 y 5 (US2, US3)**: dependen de la Fase 3 (las pruebas usan el seed); pueden hacerse en paralelo entre sí.
- **Fase 6 (US4)**: depende de la Fase 3; independiente de US2 y US3.
- **Fase 7 (US5)**: depende de la Fase 3; independiente del resto.
- **Fase 8 (US6)**: T031 depende solo de la Fase 1. T032 depende además de T019 (inicio de sesión con el seed) y de T029 (subidas rechazadas por Storage).
- **Fase 9 (Pulido)**: depende de todas las historias.

### Dentro de cada historia

Primero la prueba (debe fallar o evidenciar el comportamiento esperado), después la corrección o implementación, y por último la verificación con `npm run db:test`.

## Oportunidades de paralelismo

- T005 y T006 en paralelo.
- Una vez completada la Fase 3: T021, T022, T024, T026 y T028 escriben archivos de prueba distintos y pueden prepararse en paralelo.
- T031 (Auth) puede hacerse en paralelo con cualquier fase posterior a la 1.
- T033, T034 y T035 en paralelo.

### Ejemplo de paralelismo tras la Fase 3

```text
T021 030-isolation.test.sql     (US2)
T022 040-suspension.test.sql    (US2)
T024 020-registration.test.sql  (US3)
T026 050-integrity.test.sql     (US4)
T028 060-storage.test.sql       (US5)
```

## Estrategia de implementación

### MVP primero

1. Fases 1 y 2: entorno y esquema.
2. Fase 3 (US1): entorno reproducible con academias A y B.
3. **Detenerse y validar**: `db:reset` dos veces y `010-schema` en verde.

### Entrega incremental

1. US2 (aislamiento) y US3 (registro): los dos requisitos críticos de seguridad.
2. US4 (integridad) y US5 (almacenamiento).
3. US6 (Auth local).
4. Pulido: tipos para la spec 002, revisión de secretos y validación final.

## Notas

- Las migraciones aplicadas en un entorno compartido no se editan: se corrige con una migración nueva. Mientras todo sea local y sin commitear, pueden ajustarse antes de compartirlas.
- Ante una contradicción entre las tareas, el plan, la Constitución o los ADR, detenerse y resolverla con el flujo de Spec Kit.
