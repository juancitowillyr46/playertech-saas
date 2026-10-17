# Modelo de Base de Datos - PlayerTech MVP

Esquema de base de datos para PlayerTech MVP v1.

El documento se organiza por fases:

| Sección | Estado |
|---|---|
| **Fase 1 — Fundación SaaS** | ✅ Vigente. Decisiones en ADR-012, ADR-013 y ADR-014 (`decisions.md`) |
| **Fase 2 — Negocio** | ⚠️ Borrador previo, pendiente de rediseño (acudientes, modelo de convocatoria, `academy_id` en todas las tablas, sede de la actividad) |

Ante cualquier diferencia entre ambas secciones, prevalece la Fase 1.

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

# Fase 2 — Negocio (borrador previo, pendiente de rediseño)

> ⚠️ Esta sección es anterior a la ideación de la Fase 1 y se rediseñará. Pendiente: acudientes, convocatoria con cabecera y convocados por jugador, `academy_id` y `deleted_at` en todas las tablas, sede de la actividad y sede habitual del jugador. Las definiciones de `academies` y `academy_members` de esta sección quedan reemplazadas por la Fase 1.

## Diagrama ER (Entity Relationship)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     PLAYERTECH DATABASE SCHEMA                          │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │  academies   │
                              ├──────────────┤
                              │ id (PK)      │
                              │ name         │
                              │ created_at   │
                              └──────────────┘
                                     ▲
                                     │ (1:N)
                 ┌───────────────────┼───────────────────┐
                 │                   │                   │
                 ▼                   ▼                   ▼
         ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
         │    players     │  │   activities   │  │     groups     │
         ├────────────────┤  ├────────────────┤  ├────────────────┤
         │ id (PK)        │  │ id (PK)        │  │ id (PK)        │
         │ academy_id (FK)│  │ academy_id (FK)│  │ academy_id (FK)│
         │ name           │  │ name           │  │ name           │
         │ email          │  │ type           │  │ description    │
         │ birth_date     │  │ description    │  │ created_at     │
         │ position       │  │ scheduled_at   │  └────────────────┘
         │ jersey_number  │  │ location       │          ▲
         │ created_at     │  │ created_at     │          │ (N:N)
         │ updated_at     │  │ updated_at     │          │
         └────────────────┘  └────────────────┘    ┌─────────────┐
                 ▲                   ▲             │player_groups│
                 │                   │             ├─────────────┤
                 │ (N:N)             │ (1:N)       │ id (PK)     │
                 │                   │             │ player_id FK│
         ┌──────────────┐     ┌──────────────┐    │ group_id (FK│
         │player_groups │     │   call_ups   │    └─────────────┘
         ├──────────────┤     ├──────────────┤
         │ id (PK)      │     │ id (PK)      │
         │ player_id(FK)│     │ activity_id  │
         │ group_id (FK)│     │ player_id    │
         │ created_at   │     │ token        │
         └──────────────┘     │ token_exp_at │
                              │ created_at   │
                              └──────────────┘
                                     ▲
                                     │ (1:1)
                              ┌──────────────┐
                              │  responses   │
                              ├──────────────┤
                              │ id (PK)      │
                              │ call_up_id   │
                              │ status       │
                              │ reason       │
                              │ responded_at │
                              │ created_at   │
                              └──────────────┘
```

La pertenencia de usuarios al tenant se modela de forma independiente:

```text
auth.users
   │
   │ user_id
   ▼
academy_members
   │
   │ academy_id
   ▼
academies
```

---

## Descripción de Tablas

### 1. academies
**Propósito:** Entidad principal del tenant multi-tenant del MVP.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único |
| `name` | TEXT | NOT NULL | Nombre de la academia |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |

**Relaciones:**
- 1:N con `players`
- 1:N con `groups`
- 1:N con `activities`
- 1:N con `academy_members`

**Índices:**
- PRIMARY KEY: `id`
**RLS:**
```
Las políticas deben comprobar la membresía del usuario autenticado.
```

---

### 2. academy_members
**Propósito:** Representar la pertenencia de un usuario autenticado a una academia.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único |
| `academy_id` | UUID | NOT NULL, FOREIGN KEY (academies) | Tenant al que pertenece el usuario |
| `user_id` | UUID | NOT NULL, FOREIGN KEY (auth.users) | Usuario autenticado |
| `role` | TEXT | NOT NULL, DEFAULT 'admin' | Rol de membresía durante el MVP |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |

**Restricciones:**
- UNIQUE: `(academy_id, user_id)`

La relación permite que identidad de usuario y tenant permanezcan separadas. El MVP puede operar inicialmente con un único contexto de academia, pero el modelo no debe impedir múltiples membresías.

---

### 3. players
**Propósito:** Jugadores registrados en una academia

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único |
| `academy_id` | UUID | NOT NULL, FOREIGN KEY (academies) | Academia a la que pertenece |
| `name` | TEXT | NOT NULL | Nombre del jugador |
| `email` | TEXT | NULL | Email del jugador (opcional) |
| `birth_date` | DATE | NULL | Fecha de nacimiento |
| `position` | TEXT | NULL | Posición deportiva (forward, midfielder, defender...) |
| `jersey_number` | INT | NULL | Número de dorsal |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Última actualización |

**Relaciones:**
- N:1 con `academies`
- N:N con `groups` (a través de `player_groups`)
- 1:N con `call_ups`

**Índices:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `academy_id`
- INDEX: `academy_id` (búsquedas frecuentes)
- INDEX: `name` (búsquedas por nombre)
- UNIQUE: `(academy_id, email)` si se usa como identificador dentro de una academia

**RLS:**
```
SELECT/INSERT/UPDATE/DELETE: la política verifica que el usuario autenticado pertenece a `academy_id` mediante `academy_members`.
```

---

### 4. groups
**Propósito:** Categorías o grupos de jugadores (sub-12, sub-14, primera, etc.)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único |
| `academy_id` | UUID | NOT NULL, FOREIGN KEY (academies) | Academia propietaria |
| `name` | TEXT | NOT NULL | Nombre del grupo (ej: "Sub-12") |
| `description` | TEXT | NULL | Descripción adicional |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |

**Relaciones:**
- N:1 con `academies`
- N:N con `players` (a través de `player_groups`)

**Índices:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `academy_id`
- INDEX: `academy_id` (búsquedas por academy)

**RLS:**
```
SELECT/INSERT/UPDATE/DELETE: la política verifica la membresía del usuario en la academia del grupo.
```

**Nota:** Un jugador puede pertenecer a múltiples grupos (ej: Sub-12 y reservas).

---

### 5. player_groups
**Propósito:** Relación N:N entre jugadores y grupos

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único |
| `player_id` | UUID | NOT NULL, FOREIGN KEY (players) | Jugador |
| `group_id` | UUID | NOT NULL, FOREIGN KEY (groups) | Grupo |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de asociación |

**Relaciones:**
- N:1 con `players`
- N:1 con `groups`

**Índices:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `player_id`
- FOREIGN KEY: `group_id`
- UNIQUE: `(player_id, group_id)` (evitar duplicados)
- INDEX: `player_id` (buscar grupos de un jugador)
- INDEX: `group_id` (buscar jugadores de un grupo)

**RLS:**
```
La política resuelve la academia mediante players y groups y verifica la membresía del usuario.
```

**Cascade:**
- ON DELETE CASCADE: si borra player, se borra relación
- ON DELETE CASCADE: si borra group, se borra relación

**Validación:**
- El jugador y el grupo asociados deben pertenecer a la misma academia.

---

### 6. activities
**Propósito:** Entrenamientos o competencias programadas

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único |
| `academy_id` | UUID | NOT NULL, FOREIGN KEY (academies) | Academia que organiza |
| `name` | TEXT | NOT NULL | Nombre (ej: "Entrenamiento Técnico") |
| `type` | TEXT | NOT NULL | Tipo: 'training' o 'competition' |
| `description` | TEXT | NULL | Descripción detallada |
| `scheduled_at` | TIMESTAMP | NOT NULL | Fecha y hora programada |
| `location` | TEXT | NULL | Ubicación (ej: "Cancha 1") |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Última actualización |

**Relaciones:**
- N:1 con `academies`
- 1:N con `call_ups`

**Índices:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `academy_id`
- INDEX: `academy_id` (búsquedas por academy)
- INDEX: `scheduled_at` (ordenar por fecha)
- INDEX: `type` (filtrar por tipo)

**RLS:**
```
SELECT/INSERT/UPDATE/DELETE: la política verifica la membresía del usuario en la academia de la actividad.
```

**Validación:**
- `type` debe ser 'training' o 'competition'
- `scheduled_at` debe ser futuro o actual

---

### 7. call_ups
**Propósito:** Convocatoria de un jugador específico a una actividad

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único |
| `activity_id` | UUID | NOT NULL, FOREIGN KEY (activities) | Actividad para la que se convoca |
| `player_id` | UUID | NOT NULL, FOREIGN KEY (players) | Jugador convocado |
| `token` | TEXT | NOT NULL, UNIQUE | Token único para enlace público |
| `token_expires_at` | TIMESTAMP | NULL | Cuándo expira el enlace (ej: 7 días) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |

**Relaciones:**
- N:1 con `activities`
- N:1 con `players`
- 1:1 con `responses`

**Índices:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `activity_id`
- FOREIGN KEY: `player_id`
- UNIQUE: `token` (búsquedas por enlace público)
- INDEX: `activity_id` (listar convocatorias de una actividad)
- INDEX: `player_id` (historral de convocatorias de un jugador)

**RLS:**
```
SELECT: el administrador accede mediante la membresía de la academia de la actividad asociada
Público: acceso limitado mediante token válido y mecanismo controlado; no mediante una política anónima amplia
INSERT/UPDATE/DELETE: la política verifica la membresía de la academia de la actividad asociada
```

**Validación:**
- El token debe ser único y suficientemente largo
- `token_expires_at` debe ser mayor a `created_at` si se define
- Un jugador no debe tener dos convocatorias para la misma actividad
- El jugador y la actividad asociados deben pertenecer a la misma academia

**Generación de token:**
```sql
-- Opción 1: UUID
gen_random_uuid()::text

-- Opción 2: Hash largo
gen_random_uuid()::text || md5(random()::text)

-- Opción 3: Random 32 caracteres alfanuméricos
encode(gen_random_bytes(24), 'base64')
```

---

### 8. responses
**Propósito:** Respuesta del tutor a una convocatoria

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único |
| `call_up_id` | UUID | NOT NULL, UNIQUE, FOREIGN KEY (call_ups) | Convocatoria respondida |
| `status` | TEXT | NOT NULL | Estado: 'confirmed' o 'rejected' |
| `reason` | TEXT | NULL | Motivo si fue rechazada |
| `responded_at` | TIMESTAMP | NOT NULL | Cuándo respondió |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |

**Relaciones:**
- 1:1 con `call_ups`

**Índices:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `call_up_id`
- UNIQUE: `call_up_id` (una respuesta por convocatoria)
- INDEX: `status` (filtrar confirmadas/rechazadas)

**RLS:**
```
SELECT: el administrador accede mediante la membresía de la academia de la convocatoria asociada
INSERT: acceso público limitado mediante token válido y mecanismo controlado
UPDATE/DELETE: no permitidas (respuesta es inmutable)
```

**Validación:**
- `status` debe ser 'confirmed' o 'rejected'
- Si `status` = 'rejected', `reason` debe ser NOT NULL
- `responded_at` debe estar entre `call_up.created_at` y ahora
- No se puede modificar respuesta después de crear

**Regla de negocio:**
- Una respuesta es inmutable (no se puede cambiar)
- Si tutor se arrepiente, admin crea nueva convocatoria

---

## Flujo de datos: HU-001 a HU-013

```
┌─────────────────────────────────────────────────────────────────┐
│ HU-001: Admin Login                                             │
│ ↓                                                               │
│ Usa: academy_members (resolver pertenencia a academia)          │
│ Usa: Supabase Auth (login)                                      │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ HU-002, HU-003: Gestión de Jugadores                            │
│ ↓                                                               │
│ Usa: players (CREATE, SELECT, UPDATE, DELETE)                  │
│ Depende: academies (academy_id)                                │
│ RLS: admin solo ve sus jugadores                               │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ HU-004: Gestión de Grupos                                       │
│ ↓                                                               │
│ Usa: groups (CREATE, SELECT, UPDATE, DELETE)                   │
│ Usa: player_groups (asociar jugadores)                         │
│ Depende: players, academies                                    │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ HU-005, HU-006: Gestión de Actividades                          │
│ ↓                                                               │
│ Usa: activities (CREATE, SELECT, UPDATE, DELETE)               │
│ Depende: academies (academy_id)                                │
│ Parámetro: type ('training' o 'competition')                   │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ HU-007, HU-008: Gestión de Convocatorias (Admin)                │
│ ↓                                                               │
│ Usa: call_ups (CREATE, SELECT)                                 │
│ Depende: activities, players                                   │
│ Generar: token único para cada convocatoria                    │
│ Validar: no duplicar convocatoria para mismo jugador           │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ HU-009: Consultar Convocatoria (Tutor - sin autenticación)     │
│ ↓                                                               │
│ Usa: call_ups (SELECT by token)                                │
│ Usa: activities (info de actividad)                            │
│ Usa: players (info del jugador convocado)                      │
│ Seguridad: verificar token válido y no expirado                │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ HU-010: Responder Convocatoria (Tutor)                          │
│ ↓                                                               │
│ Usa: responses (CREATE)                                        │
│ Depende: call_ups, players                                     │
│ Validar: token válido, no expirado, sin respuesta previa       │
│ Status: 'confirmed' o 'rejected'                              │
│ Si rechaza: reason obligatorio                                 │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ HU-011: Consultar Respuestas (Admin)                            │
│ ↓                                                               │
│ Usa: responses (SELECT)                                        │
│ Usa: call_ups (información de convocatoria)                    │
│ Usa: players (nombre del jugador)                              │
│ Filtros: por actividad, por estado (confirmado/rechazado)      │
│ Mostrar: resumen de respuestas recibidas                       │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ HU-012, HU-013: Comunicación (Admin)                            │
│ ↓                                                               │
│ Lee: call_ups (token y enlace)                                 │
│ Lee: activities (info de actividad)                            │
│ Lee: players (nombre del jugador)                              │
│ Genera: mensaje con info y enlace                              │
│ Acción: copiar mensaje → pegar en WhatsApp                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Restricciones y Reglas de Negocio

### Integridad Referencial

```
academies (1) ──── (N) players
academies (1) ──── (N) groups
academies (1) ──── (N) activities

players (N) ──── (N) groups (via player_groups)

activities (1) ──── (N) call_ups
players (1) ──── (N) call_ups

call_ups (1) ──── (1) responses
```

### Validaciones de Negocio

| Tabla | Validación | Quién verifica |
|-------|------------|----------------|
| `players` | Email único por academy cuando se use como identificador | Database UNIQUE (`academy_id`, `email`) + RLS |
| `players` | Nombre no vacío | Database NOT NULL |
| `activities` | Type es 'training' o 'competition' | Database CHECK constraint |
| `activities` | scheduled_at es válido | Frontend + Backend |
| `call_ups` | Token único | Database UNIQUE |
| `call_ups` | No duplicar convocatoria | Database unique(activity_id, player_id) |
| `responses` | Status es 'confirmed' o 'rejected' | Database CHECK constraint |
| `responses` | Razón obligatoria si rejected | Frontend + Database |
| `responses` | No modificar respuesta | Database (sin UPDATE policy) |

### Cascadas de Eliminación

```
DELETE academy
  → DELETE players (cascade)
  → DELETE player_groups (cascade)
  → DELETE groups (cascade)
  → DELETE activities (cascade)
  → DELETE call_ups (cascade)
  → DELETE responses (cascade)

DELETE player
  → DELETE player_groups (cascade)
  → DELETE call_ups (cascade)
  → DELETE responses (cascade)

DELETE activity
  → DELETE call_ups (cascade)
  → DELETE responses (cascade)

DELETE call_up
  → DELETE responses (cascade)
```

---

## Índices Recomendados

```sql
-- players
CREATE INDEX idx_players_academy_id ON players(academy_id);
CREATE INDEX idx_players_email ON players(email);
CREATE INDEX idx_players_name ON players(name);

-- groups
CREATE INDEX idx_groups_academy_id ON groups(academy_id);

-- player_groups
CREATE INDEX idx_player_groups_player_id ON player_groups(player_id);
CREATE INDEX idx_player_groups_group_id ON player_groups(group_id);

-- activities
CREATE INDEX idx_activities_academy_id ON activities(academy_id);
CREATE INDEX idx_activities_scheduled_at ON activities(scheduled_at);
CREATE INDEX idx_activities_type ON activities(type);

-- call_ups
CREATE INDEX idx_call_ups_activity_id ON call_ups(activity_id);
CREATE INDEX idx_call_ups_player_id ON call_ups(player_id);
CREATE INDEX idx_call_ups_token ON call_ups(token);

-- responses
CREATE INDEX idx_responses_status ON responses(status);
```

---

## Ejemplo de datos

```sql
-- Academy
INSERT INTO academies (id, name)
VALUES ('11111111-1111-1111-1111-111111111111', 'Academia FC');

-- Academy membership
INSERT INTO academy_members (academy_id, user_id, role)
VALUES ('11111111-1111-1111-1111-111111111111', 'admin-user-id', 'admin');

-- Players
INSERT INTO players (academy_id, name, email, birth_date, position, jersey_number)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Juan Pérez', 'juan@test.com', '2010-05-15', 'forward', 9),
  ('11111111-1111-1111-1111-111111111111', 'Carlos López', 'carlos@test.com', '2011-03-22', 'midfielder', 5);

-- Groups
INSERT INTO groups (academy_id, name, description)
VALUES ('11111111-1111-1111-1111-111111111111', 'Sub-12', 'Categoría sub-12 años');

-- Player-Groups
INSERT INTO player_groups (player_id, group_id)
VALUES (
  (SELECT id FROM players WHERE name = 'Juan Pérez' LIMIT 1),
  (SELECT id FROM groups WHERE name = 'Sub-12' LIMIT 1)
);

-- Activity
INSERT INTO activities (academy_id, name, type, description, scheduled_at, location)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Entrenamiento Martes',
  'training',
  'Entrenamiento técnico de posicionamiento',
  NOW() + INTERVAL '2 days',
  'Cancha 1'
);

-- Call-up
INSERT INTO call_ups (activity_id, player_id, token, token_expires_at)
VALUES (
  (SELECT id FROM activities WHERE name = 'Entrenamiento Martes' LIMIT 1),
  (SELECT id FROM players WHERE name = 'Juan Pérez' LIMIT 1),
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  NOW() + INTERVAL '7 days'
);

-- Response
INSERT INTO responses (call_up_id, status, reason, responded_at)
VALUES (
  (SELECT id FROM call_ups LIMIT 1),
  'confirmed',
  NULL,
  NOW()
);
```

---

## Notas de Implementación

### Multi-tenancy

El modelo es multi-tenant desde el MVP:

- `academies` representa el tenant;
- `academy_members` relaciona usuarios autenticados con academias;
- las entidades de negocio mantienen `academy_id` cuando pertenecen directamente a una academia, o resuelven el tenant mediante sus relaciones;
- RLS valida la membresía del usuario autenticado; no compara `academy_id` con `auth.uid()`.

El escenario inicial puede usar un único contexto de academia por usuario, sin impedir que el modelo soporte múltiples membresías posteriormente.

### Seguridad

- Todas las tablas sensibles tienen RLS habilitado
- El usuario solo ve datos de academias a las que pertenece mediante `academy_members`
- Tutor accede sin autenticación (solo con token válido)
- Respuesta es inmutable (solo INSERT, no UPDATE/DELETE)

### Performance

Índices están colocados en:
- Foreign keys (para joins frecuentes)
- Campos de búsqueda (nombre, email)
- Campos de filtro (type, status)
- Campos de ordenamiento (scheduled_at)

### Escalabilidad

Estructura permite:
- Agregar más campos sin romper existentes
- Crear nuevas tablas para nuevas features
- Cambiar Supabase por API sin modificar modelo
