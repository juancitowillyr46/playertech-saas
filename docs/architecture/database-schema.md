# Modelo de Base de Datos - PlayerTech MVP

Esquema de base de datos para PlayerTech MVP v1.

El documento se organiza por fases:

| Sección | Estado |
|---|---|
| **Fase 1 — Fundación SaaS** | ✅ Vigente. Decisiones en ADR-012, ADR-013 y ADR-014 (`decisions.md`) |
| **Fase 2 — Jugadores, grupos y acudientes; actividades y canchas** | ✅ Vigente (specs 009, 010 y 011). Decisiones en ADR-018 |
| **Fase 2 — Pendiente** | Índice de las tablas de las specs siguientes; se documentan al implementarse |

---

# Fase 1 — Fundación SaaS

## Diagrama

```text
                         ┌──────────────────┐      ┌──────────────────┐
  PLATAFORMA (global)    │      plans       │      │ legal_documents  │
                         └────────┬─────────┘      └────────┬─────────┘
                                  │                         │
  IDENTIDAD (global)   ┌──────────┴──┐   1:1   ┌──────────┐ │
                       │ auth.users  │─────────│ profiles │ │
                       └──────┬──────┘         └──────────┘ │
                              │                             │
  TENANT                      │      ┌──────────────┐       │
                              │      │  academies   │──┐    │
                              │      └──┬───┬───┬───┘  │    │
  MEMBRESÍA    ┌──────────────┴──────┐  │   │   │      │    │
               │  academy_members    │◄─┘   │   │      │    │
               └─────────────────────┘      │   │      │    │
               ┌─────────────────────┐      │   │      │    │
               │   subscriptions     │◄─────┘   │      │    │
               └─────────────────────┘          │      │    │
  ORGANIZACIÓN ┌─────────────────────┐          │      │    │
               │       venues        │◄─────────┘      │    │
               └─────────────────────┘                 │    │
  ARCHIVOS     ┌─────────────────────┐                 │    │
               │        files        │◄────────────────┘    │
               └─────────────────────┘                      │
  AUDITORÍA    ┌─────────────────────┐                      │
               │  legal_acceptances  │◄─────────────────────┘
               └─────────────────────┘
```

## Convenciones

- Claves primarias `uuid` con `gen_random_uuid()`.
- Fechas en `timestamptz`; `created_at` y `updated_at` se mantienen automáticamente.
- Los valores enumerados se implementan como `text` con restricción `CHECK`, ampliables mediante migración.
- Las tablas del tenant incluyen `academy_id` y `UNIQUE (academy_id, id)` para permitir claves foráneas compuestas que impidan relaciones entre academias.
- Las tablas de negocio usan borrado lógico con `deleted_at` (DEC-27).

## Plataforma (global, sin `academy_id`)

### plans

Catálogo de planes. Las tres filas se cargan en la propia migración.

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | uuid | PK | |
| `code` | text | NOT NULL, UNIQUE, CHECK (`free`, `pro`, `advanced`) | Código del plan |
| `name` | text | NOT NULL | Nombre visible |
| `max_venues` | int | NULL | Límite de sedes; NULL = ilimitado |
| `max_members` | int | NULL | Límite de usuarios; NULL = ilimitado |
| `max_players` | int | NULL | Límite de jugadores; NULL = ilimitado |
| `is_active` | boolean | NOT NULL DEFAULT true | Disponible para nuevas suscripciones |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |

En el MVP, `free` tiene todos los límites en NULL (DEC-07).

### legal_documents

Versiones de los documentos legales.

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | uuid | PK | |
| `type` | text | NOT NULL, CHECK (`terms`, `privacy_policy`) | Tipo de documento |
| `version` | text | NOT NULL | Ejemplo: `2026-10-v1` |
| `url` | text | NOT NULL | Dónde se publica el documento |
| `published_at` | timestamptz | NOT NULL | |
| `is_current` | boolean | NOT NULL DEFAULT false | Versión vigente |

Restricciones: `UNIQUE (type, version)` y una sola versión vigente por tipo (índice único parcial sobre `type` WHERE `is_current`).

## Identidad (global)

### auth.users

Gestionada por Supabase Auth: correo, contraseña y verificación. No se modifica directamente.

### profiles

Datos de la persona, independientes de la academia.

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `user_id` | uuid | PK, FK → `auth.users` ON DELETE CASCADE | |
| `full_name` | text | NOT NULL | Nombre capturado en el registro |
| `created_at`, `updated_at` | timestamptz | NOT NULL | |

## Tenant

### academies

Raíz del aislamiento.

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | uuid | PK | Identificador del tenant |
| `name` | text | NOT NULL | Puede repetirse entre academias (DEC-14) |
| `slug` | text | NOT NULL, UNIQUE | Generado automáticamente |
| `status` | text | NOT NULL DEFAULT `active`, CHECK (`active`, `suspended`) | DEC-18 |
| `country_code` | char(2) | NOT NULL DEFAULT `CO` | Interno (DEC-15) |
| `timezone` | text | NOT NULL DEFAULT `America/Bogota` | Interno (DEC-15) |
| `logo_file_id` | uuid | NULL, FK → `files` | Logo (DEC-22) |
| `contact_email` | text | NULL | Se inicializa con el correo del registro (DEC-21) |
| `contact_phone` | text | NULL | |
| `address` | text | NULL | |
| `city` | text | NULL | |
| `created_by` | uuid | NOT NULL, FK → `auth.users` | Owner que la registró |
| `created_at`, `updated_at` | timestamptz | NOT NULL | |

### subscriptions

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | uuid | PK | |
| `academy_id` | uuid | NOT NULL, FK → `academies` | |
| `plan_id` | uuid | NOT NULL, FK → `plans` | `free` al registrarse |
| `status` | text | NOT NULL, CHECK (`active`, `cancelled`) | |
| `started_at` | timestamptz | NOT NULL DEFAULT now() | |
| `ends_at` | timestamptz | NULL | Sin uso en el MVP |
| `provider_ref` | text | NULL | Referencia de la pasarela de pago futura |
| `created_at` | timestamptz | NOT NULL | |

Restricción: una sola suscripción `active` por academia (índice único parcial).

## Membresía

### academy_members

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | uuid | PK | |
| `academy_id` | uuid | NOT NULL, FK → `academies` | |
| `user_id` | uuid | NOT NULL, **UNIQUE**, FK → `auth.users` | Una academia por persona (DEC-02) |
| `role` | text | NOT NULL, CHECK (`owner`) | Solo Owner en el MVP (DEC-03) |
| `status` | text | NOT NULL DEFAULT `active`, CHECK (`active`, `disabled`) | |
| `created_at` | timestamptz | NOT NULL | |

Restricción: exactamente un `owner` por academia (índice único parcial sobre `academy_id` WHERE `role = 'owner'`).

## Organización

### venues

Sedes: oficinas o lugares de entrenamiento (DEC-04).

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | uuid | PK | |
| `academy_id` | uuid | NOT NULL, FK → `academies` | |
| `name` | text | NOT NULL | Único en la academia entre sedes no eliminadas |
| `type` | text | NOT NULL DEFAULT `training_ground`, CHECK (`office`, `training_ground`) | |
| `address` | text | NULL | |
| `city` | text | NULL | |
| `directions` | text | NULL | Referencia o indicaciones de llegada |
| `is_primary` | boolean | NOT NULL DEFAULT false | Sede principal |
| `is_active` | boolean | NOT NULL DEFAULT true | Desactivación reversible (DEC-26) |
| `deleted_at` | timestamptz | NULL | Borrado lógico (DEC-27) |
| `created_by` | uuid | NOT NULL DEFAULT `auth.uid()`, FK → `auth.users` | Siempre el usuario autenticado (lo exige RLS) |
| `created_at`, `updated_at` | timestamptz | NOT NULL | |

Restricciones:
- `UNIQUE (academy_id, id)`.
- Exactamente una sede principal por academia (índice único parcial sobre `academy_id` WHERE `is_primary AND deleted_at IS NULL`).
- La sede principal siempre está activa y no eliminada: CHECK (`NOT is_primary OR (is_active AND deleted_at IS NULL)`).
- Nombre único por academia: índice único parcial sobre (`academy_id`, `lower(name)`) WHERE `deleted_at IS NULL`.

## Archivos

### files

Registro de archivos con almacenamiento portable (ADR-013).

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | uuid | PK | También es el nombre físico del archivo |
| `academy_id` | uuid | NOT NULL, FK → `academies` | Tenant propietario |
| `bucket` | text | NOT NULL, CHECK (`public-assets`, `private-files`) | Bucket lógico |
| `storage_key` | text | NOT NULL, UNIQUE | `{academy_id}/{módulo}/{entity_id}/{file_id}.{ext}`, sin dominio ni proveedor |
| `module` | text | NOT NULL | Ejemplo: `academy` |
| `entity_id` | uuid | NOT NULL | Entidad a la que pertenece |
| `original_name` | text | NOT NULL | Solo para mostrar |
| `mime_type` | text | NOT NULL | |
| `size_bytes` | bigint | NOT NULL | |
| `checksum_sha256` | text | NULL | Verificación de integridad y de migraciones |
| `created_by` | uuid | NOT NULL DEFAULT `auth.uid()`, FK → `auth.users` | Siempre el usuario autenticado (lo exige RLS) |
| `created_at` | timestamptz | NOT NULL | |
| `deleted_at` | timestamptz | NULL | Borrado lógico |

Restricciones:
- `UNIQUE (academy_id, id)`.
- La clave pertenece a la academia de la fila: CHECK (`storage_key LIKE academy_id::text || '/%'`). Impide que un miembro de una academia ocupe la clave de otra.

## Auditoría legal

### legal_acceptances

Solo admite inserciones; no se modifica ni se elimina.

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | uuid | PK | |
| `user_id` | uuid | NOT NULL, FK → `auth.users` | Quién acepta |
| `academy_id` | uuid | NOT NULL, FK → `academies` | Academia registrada |
| `legal_document_id` | uuid | NOT NULL, FK → `legal_documents` | Documento y versión aceptados |
| `accepted_at` | timestamptz | NOT NULL DEFAULT now() | Hora del servidor |
| `ip_address` | inet | NULL | Ver DEC-29 |
| `user_agent` | text | NULL | |

## Funciones de base de datos

| Función | Responsabilidad |
|---|---|
| `handle_new_user()` | Trigger posterior a la creación del usuario. En una transacción crea el perfil, la academia (con `slug` y `contact_email`), la membresía `owner`, la suscripción `free`, la sede principal y las dos aceptaciones legales. Si algo falla, el registro completo se revierte (DEC-20) |
| `is_academy_member(academy_id)` | Verdadero si el usuario tiene membresía `active` en una academia `active`. Base de las políticas RLS |
| `current_academy_id()` | Academia del usuario autenticado; el frontend no la envía |
| `has_academy_role(academy_id, roles[])` | Comprueba el rol de la membresía; en el MVP siempre `owner` |
| `set_primary_venue(venue_id)` | Cambia la sede principal en una sola transacción (DEC-25). Solo el owner; la sede debe estar activa y no eliminada |
| `storage_object_academy_id(name)` | Uso interno de las políticas de Storage: academia del primer segmento de la ruta, o NULL si no es un UUID |
| `slugify(text)` | Uso interno del registro: genera el `slug` sin tildes ni caracteres especiales |
| `set_updated_at()` | Trigger que mantiene `updated_at` |

Las funciones de autorización usan `SECURITY DEFINER` con `search_path` fijo, para evitar la recursión de políticas sobre `academy_members`.

## Políticas de acceso (RLS)

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `plans` | Usuarios autenticados | ❌ | ❌ | ❌ |
| `legal_documents` | Cualquiera (`anon` y `authenticated`): son públicos y el registro los necesita antes de iniciar sesión | ❌ | ❌ | ❌ |
| `profiles` | El propio usuario | Solo el registro | El propio usuario | ❌ |
| `academies` | Miembros | Solo el registro | Owner (excepto `status`, `slug`, `country_code`, `timezone`) | ❌ |
| `subscriptions` | Miembros | Solo el registro | ❌ | ❌ |
| `academy_members` | El propio miembro | Solo el registro | ❌ | ❌ |
| `venues` | Miembros | Owner | Owner | ❌ (borrado lógico) |
| `files` | Miembros | Miembros | Miembros (solo `deleted_at`) | ❌ |
| `legal_acceptances` | El propio usuario | Solo el registro | ❌ | ❌ |

## Almacenamiento (Storage)

| Bucket | Lectura | Escritura | Configuración |
|---|---|---|---|
| `public-assets` | Pública por URL; listar o descargar por la API, solo miembros | `is_academy_member(primer segmento de la ruta)` | Logos: `image/jpeg`, `image/png`; máximo 1 MB |
| `private-files` | Miembros, con URL firmada | `is_academy_member(primer segmento de la ruta)` | Sin uso en la Fase 1 |

---

# Fase 2 — Jugadores, grupos y acudientes (spec 009)

Migración `20261018100000_players_groups_guardians.sql`. Columnas, restricciones y estados: [`specs/009-players-guardians-groups/data-model.md`](../../specs/009-players-guardians-groups/data-model.md); permisos y funciones: [`contracts/database.md`](../../specs/009-players-guardians-groups/contracts/database.md). Sustituye a `players`, `groups` y `player_groups` del borrador de abajo.

```text
academies ─┬─< players ─┬─< group_members >─┬─ groups
           │            └─< guardian_links >─┴─ guardians
           └─ (todas llevan academy_id; claves compuestas (academy_id, id) impiden mezclar academias)
```

| Tabla | Qué es | Borrado |
|---|---|---|
| `players` | Jugador: nombres, apellidos, apodo, fecha de nacimiento, celular opcional, activo | Lógico. Único por nombre normalizado y fecha (DEC-42) |
| `groups` | Grupo con nombre único por academia | Lógico. Al eliminarlo, un trigger quita sus integrantes |
| `group_members` | Jugador en un grupo | **Físico** (relación sin historia, excepción del plan) |
| `guardians` | Acudiente: la persona, única por celular en la academia, con **su autorización de datos** (DEC-39 ajustada, spec 010) | Lógico |
| `guardian_links` | Vínculo acudiente-jugador: parentesco y estado (DEC-40) | Lógico |

| Función | Uso |
|---|---|
| `current_user_id()` | Usuario actual para `created_by` y políticas (ADR-017) |
| `normalize_name(text)` | Comparar nombres sin mayúsculas, tildes ni espacios |
| `find_player_by_identity(...)` | Detectar el jugador ya registrado |
| `add_player_guardian(...)` | Registra a un acudiente nuevo (o reutiliza la persona por su celular) y lo vincula; exige la autorización y la guarda en la persona |
| `assign_guardians(...)` | Asigna acudientes ya registrados a un jugador, validados y sin duplicar (spec 010, DEC-43) |

RLS: leen los miembros de la academia y escribe el owner; `guardians` y `guardian_links` solo se insertan con `add_player_guardian` y `assign_guardians`. Cambios de la spec 010: [`specs/010-guardian-assignment/data-model.md`](../../specs/010-guardian-assignment/data-model.md).

---

# Fase 2 — Actividades y canchas externas (spec 011)

Migración `20261018120000_activities_fields.sql`. Detalle: [`specs/011-activities-fields/data-model.md`](../../specs/011-activities-fields/data-model.md) y [`contracts/database.md`](../../specs/011-activities-fields/contracts/database.md).

| Tabla | Qué es | Borrado |
|---|---|---|
| `external_fields` | Canchas donde se juegan torneos; nombre único en la academia (DEC-32) | Lógico |
| `activities` | Entrenamiento o competencia: inicio, fin y citación (`timestamptz`), lugar (sede **o** cancha, claves compuestas), rival y torneo solo en competencia, estado programada o cancelada, `series_id` de la repetición (DEC-44) | Lógico |

Trigger `activities_guard`: no se crean en el pasado; una actividad pasada solo admite `deleted_at`; el lugar elegido debe estar vigente (sede activa o cancha no retirada, de la misma academia). RLS: leen los miembros y escribe el owner.

---

# Fase 2 — Convocatorias y mensajes (spec 012)

Migración `20261019100000_call_ups.sql`. Detalle: [`specs/012-call-ups/data-model.md`](../../specs/012-call-ups/data-model.md) y [`contracts/database.md`](../../specs/012-call-ups/contracts/database.md).

```text
activities ─< call_ups ─< call_up_lists ─< call_up_players >─ players
                                │
                                └──────────────────────────── groups (opcional)
```

| Tabla | Qué es | Borrado |
|---|---|---|
| `call_ups` | Convocatoria única de una actividad; fecha límite opcional y cierre | Lógico; no admite borrado físico |
| `call_up_lists` | Lista por grupo o lista única sin grupo; conserva token secreto y texto propio | Físico cuando queda vacía |
| `call_up_players` | Jugador de una lista; un jugador aparece una sola vez por convocatoria | Físico (relación sin historia) |

`call_up_is_open` calcula si está abierta con `closed_at`, la fecha límite y el inicio de la actividad. `create_call_up` crea la convocatoria, sus listas y convocados atómicamente. Los triggers impiden convocar actividades pasadas o canceladas, modifican solo convocatorias abiertas, cierran al cancelar la actividad y no permiten mover el inicio después de la fecha límite. RLS: los miembros leen y el owner escribe; las claves compuestas evitan cruzar academias.

---

# Fase 2 — Pendiente

Las tablas de las siguientes specs se documentan aquí cuando se implementan (ADR-018, DEC-37):

| Spec | Tablas previstas | Decisiones |
|---|---|---|
| 4 — Respuesta y seguimiento | Respuestas, historial y dispositivos | DEC-33, DEC-38, DEC-40, DEC-41 |

El borrador anterior a la ideación de la Fase 2 está en [`docs/archive/database-schema-phase2-draft.md`](../archive/database-schema-phase2-draft.md) (no es fuente de verdad).
