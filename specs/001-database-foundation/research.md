# Investigación: Base de datos de la Fundación SaaS

Decisiones técnicas que resuelven las incógnitas del contexto técnico de `plan.md`.

## R1 — Cómo se instala y ejecuta la CLI de Supabase

**Decisión:** `package.json` mínimo en la raíz del repositorio con `supabase@2.119.0` como dependencia de desarrollo fijada, y scripts `db:start`, `db:stop`, `db:reset`, `db:test`, `db:types` y `db:status`.

**Justificación:** fija la versión para todo el equipo sin instalaciones globales, funciona igual en Windows y en CI, y deja `frontend/` sin dependencias de base de datos. La 2.119.0 lleva más de dos semanas publicada.

**Alternativas consideradas:**
- `npx supabase@latest`: la versión cambia sin control.
- Instalación global (Scoop o binario): depende de cada equipo.
- Dependencia dentro de `frontend/`: mezcla la base de datos con la aplicación.

## R2 — Cómo se simulan usuarios en las pruebas pgTAP

**Decisión:** un archivo de ayuda propio, `supabase/tests/database/000-test-helpers.test.sql`, que crea el esquema `tests` con funciones para crear usuarios (`tests.create_user`), autenticarse como uno de ellos (`tests.authenticate_as`, que fija `role authenticated` y `request.jwt.claims`) y volver a anónimo (`tests.clear_authentication`). Cada archivo de prueba se ejecuta en una transacción con `ROLLBACK`, salvo el de helpers, que persiste y por eso es idempotente (`if not exists`, `create or replace`).

**Justificación:** es el mecanismo que usan las políticas RLS (`auth.uid()` lee `request.jwt.claims`), no añade dependencias externas y deja cada prueba aislada.

**Alternativas consideradas:**
- Paquete `supabase_test_helpers` vía dbdev: añade una dependencia y un instalador para algo de pocas líneas.
- Probar el aislamiento a través de la API: más lento y no prueba directamente las políticas.

## R3 — Cómo se implementa el registro atómico

**Decisión:** trigger `AFTER INSERT ON auth.users` que ejecuta `public.handle_new_user()` (`SECURITY DEFINER`, `search_path` vacío). Lee `raw_user_meta_data` según el contrato de [contracts/registration-metadata.md](contracts/registration-metadata.md). Cualquier validación fallida lanza una excepción, y como el trigger corre en la misma transacción que la creación del usuario, Supabase Auth revierte también la cuenta.

**Justificación:** garantiza "todo o nada" (FR-015, FR-016) sin coordinación desde el cliente, y la lógica vive en la base de datos, donde la seguridad no depende del frontend (principio VIII).

**Detalles:**
- Las versiones legales que envía el cliente **deben coincidir** con las versiones vigentes, lo que evita registrar la aceptación de un texto que el usuario no vio.
- Supabase Auth ya normaliza el correo a minúsculas y no inserta un usuario si el correo existe, así que el trigger no se ejecuta para correos duplicados.
- El `slug` se genera con `public.slugify()` (con `unaccent`). Si choca con uno existente, se añade un sufijo numérico y se reintenta ante una violación de unicidad, lo que cubre registros simultáneos. La concurrencia no se prueba con pgTAP; queda cubierta por este diseño.
- Dentro del trigger `auth.uid()` es NULL, así que los `created_by` se asignan explícitamente con el id del nuevo usuario.
- **Limitación conocida:** el trigger se ejecuta en toda alta de `auth.users`. Las altas sin metadatos de registro (invitaciones, usuarios creados desde Studio, futuros roles de la Fase 2) fallarán hasta que se rediseñe para otros roles.

**Alternativas consideradas:**
- Función RPC llamada después del registro: no es atómica; un fallo deja una cuenta sin academia.
- Edge Function de registro: atómica y con acceso a la IP, pero añade un componente desplegable (ver R4).

## R4 — Captura de IP en las aceptaciones legales (DEC-29)

**Decisión:** en el MVP **no se capturan la IP ni el navegador**. Las columnas `ip_address` y `user_agent` existen y quedan vacías. Se registran el documento, la versión y la hora del servidor.

**Justificación:** el trigger del registro no recibe la petición HTTP original, y capturar la IP exige una Edge Function de registro, con más superficie y despliegue. Fecha, hora, versión e identidad verificada por correo constituyen un registro de auditoría suficiente para el piloto. Si la asesoría legal exige la IP, se añadirá una Edge Function sin cambiar el modelo.

**Alternativas consideradas:**
- Edge Function de registro: completa, pero desproporcionada para el MVP.
- Leer `auth.audit_log_entries`: el orden de escritura respecto al trigger no está garantizado.

> ✅ Aprobada por el responsable de producto (2026-10-16). DEC-29 actualizada en ADR-012.

## R5 — Funciones de autorización

**Decisión:** `public.is_academy_member(academy_id uuid)`, `public.current_academy_id()` y `public.has_academy_role(academy_id uuid, roles text[])`, todas `STABLE`, `SECURITY DEFINER` y con `SET search_path = ''`. Comprueban la membresía activa **y** la academia activa. Se concede `EXECUTE` solo a `authenticated`.

**Justificación:** centralizan la lógica (FR-011), evitan la recursión de políticas sobre `academy_members` y aplican la suspensión (DEC-18) en un único lugar. El `search_path` vacío evita la suplantación de objetos.

## R6 — Aislamiento estructural entre academias

**Decisión:** las tablas del tenant declaran `UNIQUE (academy_id, id)`, y las referencias entre ellas usan **claves foráneas compuestas** que incluyen `academy_id`. En la Fase 1: `academies (id, logo_file_id) → files (academy_id, id)`.

**Justificación:** la base de datos impide relaciones entre academias aunque una política tenga un error (FR-006). El patrón es el que reutilizará la Fase 2.

## R7 — Restricción de columnas editables por el owner

**Decisión:** privilegios por columna. Se revoca `UPDATE` de la tabla y se concede `UPDATE (columnas permitidas)` a `authenticated`:
- `academies`: `name`, `logo_file_id`, `contact_email`, `contact_phone`, `address`, `city`.
- `venues`: `name`, `type`, `address`, `city`, `directions`, `is_active`, `deleted_at` (no `is_primary`).
- `files`: `deleted_at`.
- `profiles`: `full_name`.

Además, `created_by` en `venues` y `files` toma `auth.uid()` por defecto y las políticas de INSERT exigen `created_by = auth.uid()`, de modo que el autor no puede falsificarse (FR-031). Se revoca `TRUNCATE` a `anon` y `authenticated`, porque RLS no lo cubre.

**Justificación:** cumple FR-014 en la base de datos con el mecanismo nativo, más simple y fiable que un trigger.

## R8 — Cambio de sede principal

**Decisión:** función RPC `public.set_primary_venue(venue_id uuid)` (`SECURITY DEFINER`). Comprueba que el usuario es owner de la academia de la sede y que la sede está activa y no eliminada; después desmarca la principal actual y marca la nueva en una sola transacción. `is_primary` no es editable directamente (R7).

**Justificación:** un índice único parcial no puede diferirse, así que el cambio requiere dos pasos ordenados dentro de una transacción. Una RPC garantiza que nunca existan cero ni dos sedes principales (FR-022).

## R9 — Borrado lógico y políticas RLS

**Decisión:** las políticas RLS **no** filtran `deleted_at`. El filtro `deleted_at IS NULL` lo aplican las consultas de los repositorios.

**Justificación:** si la política de lectura ocultara las filas eliminadas, la propia actualización que marca `deleted_at` fallaría al devolver la fila (`RETURNING`), un comportamiento conocido de PostgreSQL con RLS. El aislamiento entre academias, que es lo crítico, no depende de este filtro.

## R10 — Storage

**Decisión:** los buckets se crean **en una migración** (inserción en `storage.buckets`) y no solo en `config.toml`, para que se apliquen igual en la nube:
- `public-assets`: público, `file_size_limit` de 1 MB, `allowed_mime_types` `image/jpeg` e `image/png`.
- `private-files`: privado.

Las políticas sobre `storage.objects` validan que el primer segmento de la ruta sea un UUID y que `public.is_academy_member()` sea verdadero para esa academia. En `public.files`, un CHECK exige que `storage_key` empiece por el `academy_id` de la fila; sin él, un miembro de una academia podría ocupar la clave de otra, porque `storage_key` es única en toda la tabla.

Los límites de tipo y tamaño del bucket los aplica la **API de Storage**, no la base de datos: pgTAP verifica la configuración y la subida rechazada se valida manualmente (quickstart, sección 4).

**Justificación:** portabilidad entre entornos y validación del tipo y el tamaño en el servidor (ADR-013).

## R11 — Configuración de Auth local

**Decisión:** en `supabase/config.toml`: `[auth.email] enable_confirmations = true`, `[auth] minimum_password_length = 8`, `jwt_expiry = 3600`, `site_url = "http://localhost:4200"` y `additional_redirect_urls` con `http://localhost:4200/auth/callback`. Los correos locales se capturan en el servicio de correo de prueba incluido en la CLI.

**Justificación:** el entorno local se comporta como producción (ADR-014). Las reglas de Auth no se prueban con pgTAP, sino con el quickstart.

## R12 — Seed

**Decisión:** `supabase/seed.sql` inserta dos usuarios en `auth.users` y `auth.identities` con UUID fijos, correo confirmado, contraseña cifrada con `crypt()` y `raw_user_meta_data` válido. **El propio trigger `handle_new_user` crea sus academias**, así que el seed ejercita el camino real del registro. Para que esos usuarios puedan iniciar sesión, la fila de `auth.users` incluye las columnas que espera Supabase Auth (`instance_id`, `aud`, `role`, `raw_app_meta_data` y los tokens como cadena vacía, no NULL) y una identidad `email` en `auth.identities`. Las academias se identifican por su `slug` (`academia-a` y `academia-b`).

**Justificación:** datos reproducibles (FR-004) sin duplicar la lógica de registro.

## R13 — Organización de las migraciones

**Decisión:** migraciones con marca de tiempo (`supabase migration new`), una por unidad lógica y en orden de dependencias:

| # | Migración | Contenido |
|---|---|---|
| 1 | `foundation_extensions_and_helpers` | Extensión `unaccent`, `set_updated_at()`, `slugify()`. `pgtap` **no** va en migraciones: la habilita el archivo de helpers de prueba (R2), para no instalarla en la nube |
| 2 | `platform_catalogs` | `plans` y `legal_documents`, con sus datos de referencia |
| 3 | `identity_profiles` | `profiles` |
| 4 | `tenancy_core` | `academies`, `subscriptions`, `academy_members` |
| 5 | `files` | `files` y la FK compuesta del logo |
| 6 | `venues` | `venues` y sus restricciones |
| 7 | `legal_acceptances` | `legal_acceptances` |
| 8 | `authorization_functions` | `is_academy_member`, `current_academy_id`, `has_academy_role` |
| 9 | `rls_policies_and_grants` | RLS habilitado, políticas y privilegios por columna |
| 10 | `registration` | `handle_new_user()`, el trigger y `set_primary_venue()` |
| 11 | `storage` | Buckets y políticas de `storage.objects` |

**Justificación:** sigue la guía de migraciones (`docs/architecture/supabase-migrations-guide.md`) y facilita la revisión de cada pieza.

## R14 — Tipos generados para el frontend

**Decisión:** el script `db:types` genera `frontend/src/app/core/supabase/database.types.ts` con `supabase gen types typescript --local`. El archivo se versiona y lo consume la spec 002.

**Justificación:** el contrato de tipos entre la base de datos y el frontend queda explícito y revisable.
