# Guía de Migraciones en Supabase

Define cómo versionamos, organizamos, ejecutamos y verificamos los cambios de base de datos de PlayerTech.

Las migraciones forman parte del código fuente del proyecto y constituyen la fuente reproducible de evolución del esquema de PostgreSQL, incluyendo tablas, relaciones, restricciones, índices, RLS y políticas de seguridad.

---

## 1. ¿Qué es una migración?

Una migración es un archivo SQL versionado que describe un cambio controlado en la estructura o configuración de la base de datos.

Ejemplos:

- crear una tabla;
- agregar una columna;
- crear una relación entre tablas;
- agregar una restricción;
- crear un índice;
- habilitar Row Level Security;
- crear o modificar una política RLS;
- crear una función o trigger necesario para el modelo.

### ¿Por qué versionar migraciones?

```text
❌ Cambiar manualmente la base de datos
   ↓
Cambios difíciles de rastrear
Cambios difíciles de reproducir
Diferencias entre ambientes

✅ Migración versionada
   ↓
Cambio documentado
Cambio reproducible
Historial en Git
Trazabilidad con el producto
```

La base de datos debe evolucionar mediante migraciones versionadas y no mediante cambios manuales como mecanismo principal de desarrollo.

---

## 2. Estructura de carpetas

La estructura propuesta es:

```text
playertech-saas/
├── supabase/
│   ├── migrations/
│   │   ├── 20261016090000_foundation_extensions_and_helpers.sql
│   │   ├── 20261016090100_platform_catalogs.sql
│   │   └── ...                      # nombres según la sección 3
│   ├── tests/
│   │   └── database/                # pruebas pgTAP (supabase test db)
│   ├── seed.sql
│   ├── config.toml
│   └── README.md
```

La estructura vigente y el orden de las migraciones de la Fase 1 están en `specs/001-database-foundation/plan.md` y `research.md` (R13).

La documentación arquitectónica se mantiene en:

```text
docs/architecture/supabase.md
docs/architecture/supabase-migrations-guide.md
```

---

## 3. Convención de nombres

Se utilizará una convención basada en timestamp para las migraciones generadas por Supabase CLI.

Ejemplo:

```text
YYYYMMDDHHMMSS_descripcion.sql
```

Por ejemplo:

```text
20261003090000_create_academies.sql
20261003091000_create_academy_members.sql
20261003092000_create_players.sql
20261003093000_create_player_rls.sql
```

La descripción debe:

- utilizar `snake_case`;
- describir claramente el cambio;
- evitar nombres genéricos como `update.sql`;
- representar un cambio coherente.

> No se debe renombrar una migración que ya haya sido aplicada en un ambiente compartido.

---

## 4. Principios de las migraciones

Las migraciones deben ser:

- versionadas;
- reproducibles;
- trazables;
- pequeñas y coherentes;
- ordenadas según dependencias;
- revisables mediante Git.

Una migración debe representar una unidad lógica de cambio.

No se deben acumular cambios no relacionados en una única migración únicamente para reducir el número de archivos.

---

## 5. Orden de creación del modelo Multi-Tenant

PlayerTech utiliza multi-tenancy desde el MVP.

Por lo tanto, las dependencias fundamentales deben respetar el siguiente orden conceptual:

```text
Supabase / PostgreSQL
        │
        ▼
Academies
        │
        ▼
Academy Members
        │
        ├───────────────┐
        ▼               ▼
     Players         Groups
        │
        ▼
   Player Groups
        │
        ▼
    Activities
        │
        ▼
     Call-ups
        │
        ▼
     Responses
```

Las relaciones de pertenencia al tenant deben existir antes de crear las entidades que dependen de ellas.

---

## 6. Modelo base de Multi-Tenancy

### Academies

La academia representa el tenant de PlayerTech.

Ejemplo conceptual:

```sql
CREATE TABLE academies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

No se debe utilizar `auth.uid()` como `academy_id`.

`auth.uid()` representa al usuario autenticado.

`academies.id` representa a la academia.

---

### Academy Members

La pertenencia de un usuario a una academia se representa mediante una tabla de relación.

```sql
CREATE TABLE academy_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (academy_id, user_id)
);
```

Conceptualmente:

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

Esto permite que la identidad del usuario y la identidad del tenant permanezcan separadas.

El modelo también permite evolucionar posteriormente hacia usuarios con pertenencia a múltiples academias.

---

## 7. Entidades de negocio

Las entidades que pertenecen a una academia deben mantener una referencia al tenant.

Ejemplo:

```sql
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    birth_date DATE,
    position TEXT,
    jersey_number INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

El mismo principio aplica a:

```text
players
groups
activities
```

Mientras que otras entidades pueden obtener la academia a través de sus relaciones.

Por ejemplo:

```text
call_up
   ↓
activity
   ↓
academy
```

La decisión de si una tabla debe almacenar directamente `academy_id` o resolver el tenant mediante una relación debe definirse según el modelo de datos y las necesidades de seguridad y consulta.

---

## 8. Índices y restricciones

Las columnas utilizadas frecuentemente para aislamiento, relaciones o búsqueda deben contar con los índices correspondientes cuando sea necesario.

Por ejemplo:

```sql
CREATE INDEX idx_players_academy_id
    ON players(academy_id);
```

Las relaciones críticas deben utilizar foreign keys.

Las restricciones de unicidad deben considerar el tenant cuando corresponda.

Por ejemplo, si el nombre de un grupo puede repetirse entre academias:

```sql
UNIQUE (academy_id, name)
```

en lugar de:

```sql
UNIQUE (name)
```

Las restricciones deben reflejar las reglas reales del dominio.

---

## 9. Row Level Security

Las tablas que contienen datos protegidos deben tener RLS habilitado.

Ejemplo:

```sql
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
```

La política no debe asumir:

```sql
academy_id = auth.uid()
```

La autorización debe determinarse mediante la pertenencia del usuario a la academia.

Conceptualmente:

```text
auth.uid()
    │
    ▼
academy_members
    │
    ▼
academy_id
    │
    ▼
registro
```

Ejemplo conceptual de política:

```sql
CREATE POLICY "players_select_by_academy"
ON players
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM academy_members am
        WHERE am.academy_id = players.academy_id
          AND am.user_id = auth.uid()
    )
);
```

Para `INSERT`, la condición debe validar que el registro que se intenta crear pertenece a una academia a la que el usuario tiene acceso:

```sql
CREATE POLICY "players_insert_by_academy"
ON players
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM academy_members am
        WHERE am.academy_id = players.academy_id
          AND am.user_id = auth.uid()
    )
);
```

Las políticas de `UPDATE` deben proteger tanto el registro existente como el nuevo valor de `academy_id`:

```sql
CREATE POLICY "players_update_by_academy"
ON players
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM academy_members am
        WHERE am.academy_id = players.academy_id
          AND am.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM academy_members am
        WHERE am.academy_id = players.academy_id
          AND am.user_id = auth.uid()
    )
);
```

La misma estrategia debe aplicarse a las demás entidades protegidas.

---

## 10. RLS y relaciones entre entidades

No todas las tablas necesitan obtener `academy_id` directamente.

Por ejemplo:

```text
responses
   ↓
call_ups
   ↓
activities
   ↓
academies
```

Una política puede resolver el tenant mediante las relaciones existentes.

Conceptualmente:

```sql
EXISTS (
    SELECT 1
    FROM call_ups cu
    JOIN activities a
      ON a.id = cu.activity_id
    JOIN academy_members am
      ON am.academy_id = a.academy_id
    WHERE cu.id = responses.call_up_id
      AND am.user_id = auth.uid()
)
```

Las políticas deben diseñarse de acuerdo con el modelo de datos real y no mediante una regla genérica aplicada indiscriminadamente a todas las tablas.

---

## 11. Datos públicos mediante Call-ups

Las convocatorias contienen un caso especial del MVP.

El tutor podrá acceder mediante un enlace temporal sin autenticación tradicional.

Por lo tanto, el acceso público a una convocatoria **no debe interpretarse como ausencia de seguridad**.

El modelo deberá proteger:

- el token;
- su expiración;
- la información accesible;
- las operaciones permitidas;
- la posibilidad de modificar una convocatoria;
- el acceso a datos de otras convocatorias.

El diseño concreto del acceso público mediante token debe definirse antes de habilitar políticas anónimas sobre estas tablas.

No se debe simplemente eliminar RLS de `call_ups` para permitir el acceso público.

Cuando sea necesario, se podrá utilizar una función controlada o una capa backend/API futura para exponer únicamente la información autorizada mediante el token.

---

## 12. Seed de desarrollo

Los datos de desarrollo deben ser reproducibles.

El seed debe respetar el modelo multi-tenant:

```text
Academy
   ↓
Academy Member
   ↓
Players
   ↓
Groups
   ↓
Activities
   ↓
Call-ups
   ↓
Responses
```

No se debe depender de:

```sql
auth.uid()
```

en un seed ejecutado fuera de un contexto de autenticación.

Para datos de desarrollo se deben utilizar usuarios y UUIDs controlados por el entorno de desarrollo.

Ejemplo conceptual:

```sql
INSERT INTO academies (id, name)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Academia Test'
);
```

Posteriormente se establece la relación correspondiente en `academy_members`.

El seed debe poder reconstruir un escenario completo de prueba de manera reproducible.

---

## 13. Flujo de trabajo con una nueva migración

### Paso 1 — Identificar la necesidad

Ejemplo:

```text
HU-002 — Registrar jugador

Necesita:

- tabla players;
- relación con academy;
- reglas de aislamiento;
- índices necesarios;
- RLS;
- repositorio;
- pruebas.
```

---

### Paso 2 — Determinar dependencias

Antes de crear la migración se debe comprobar:

```text
players
   ↓
depende de academies
```

y:

```text
RLS players
   ↓
depende de academy_members
```

Por lo tanto, el orden debe respetar esas dependencias.

---

### Paso 3 — Crear la migración

Ejemplo:

```text
supabase/migrations/
└── 20261003092000_create_players.sql
```

---

### Paso 4 — Implementar el cambio

La migración debe contener únicamente los cambios correspondientes a su propósito.

Ejemplo:

```sql
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_players_academy_id
    ON players(academy_id);
```

---

### Paso 5 — Crear o actualizar seguridad

Si la nueva entidad requiere protección mediante RLS:

```sql
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
```

y se crean las políticas correspondientes.

Las políticas deben comprobar la pertenencia del usuario a la academia mediante `academy_members`.

---

### Paso 6 — Ejecutar localmente

Las migraciones deben probarse primero en el entorno local cuando sea posible.

El procedimiento exacto depende de la configuración de Supabase CLI del proyecto.

No se debe utilizar el Dashboard como mecanismo principal de evolución del esquema.

---

### Paso 7 — Verificar

La verificación debe incluir:

- estructura de la tabla;
- foreign keys;
- índices;
- RLS habilitado;
- políticas;
- comportamiento esperado;
- aislamiento entre academias;
- pruebas de acceso autorizado;
- pruebas de acceso no autorizado.

Para una entidad multi-tenant, como mínimo debe probarse:

```text
Usuario de Academy A
       │
       ├── puede acceder a datos de A
       │
       └── NO puede acceder a datos de B
```

---

### Paso 8 — Commit

El cambio debe quedar registrado en Git junto con la implementación relacionada.

Ejemplo:

```bash
git add supabase/migrations/
git commit -m "feat(db): add player persistence with tenant isolation"
```

Cuando corresponda, el cambio debe mantener trazabilidad hacia la Historia de Usuario.

---

## 14. Ejemplo de repositorio

El frontend debe utilizar el repositorio como abstracción de acceso a datos:

```typescript
interface PlayerRepository {
    getAll(): Observable<Player[]>;
    getById(id: string): Observable<Player>;
    create(player: Player): Observable<Player>;
}
```

La implementación concreta puede utilizar Supabase:

```typescript
@Injectable()
export class SupabasePlayerRepository implements PlayerRepository {
    constructor(private supabase: SupabaseClient) {}

    getAll() {
        return from(
            this.supabase
                .from('players')
                .select('*')
        );
    }

    create(player: Player) {
        return from(
            this.supabase
                .from('players')
                .insert(player)
                .select()
        );
    }
}
```

El repositorio no debe implementar por sí mismo la seguridad del tenant como única barrera.

El aislamiento debe estar respaldado por PostgreSQL/RLS.

El cliente puede utilizar el contexto de academia para operaciones de aplicación, filtrado o experiencia de usuario, pero **no debe considerarse confiable para autorización**.

---

## 15. Idempotencia y migraciones

No todas las migraciones deben utilizar indiscriminadamente:

```sql
IF NOT EXISTS
```

Una migración versionada representa una transición específica del esquema.

Agregar `IF NOT EXISTS` puede ocultar errores en los que el estado real de la base de datos no coincide con el estado esperado por la migración.

Por lo tanto:

> Las migraciones deben diseñarse para ejecutarse mediante el mecanismo de migraciones versionadas y respetar el historial de aplicación del proyecto.

La idempotencia puede utilizarse cuando exista una razón técnica concreta, pero no constituye una regla obligatoria para todas las migraciones.

---

## 16. Cambios de esquema existentes

Una vez que una migración haya sido aplicada en un ambiente compartido, no se debe editar su contenido para modificar el comportamiento histórico.

En su lugar:

```text
Migración existente
        ↓
Nueva necesidad
        ↓
Nueva migración
```

Ejemplo:

```text
20261003090000_create_players.sql
20261003100000_add_player_position.sql
```

Esto permite conservar la historia completa de evolución del esquema.

---

## 17. Checklist para una nueva migración

```text
□ La migración tiene un propósito claro
□ El nombre sigue la convención del proyecto
□ Se revisaron las dependencias con otras tablas
□ Las foreign keys son correctas
□ Los índices necesarios fueron evaluados
□ Las restricciones representan reglas reales del dominio
□ RLS está habilitado cuando corresponde
□ Las políticas verifican la pertenencia al tenant
□ No se utiliza academy_id = auth.uid()
□ Se evaluaron SELECT / INSERT / UPDATE / DELETE
□ Se verificó el aislamiento entre academias
□ Los cambios fueron probados localmente
□ El seed fue actualizado cuando corresponde
□ La migración mantiene trazabilidad con el cambio funcional
□ El cambio fue registrado en Git
```

---

## 18. Errores comunes

### ❌ Utilizar `academy_id = auth.uid()`

Incorrecto cuando `academy_id` representa una academia:

```sql
USING (academy_id = auth.uid())
```

`auth.uid()` representa al usuario.

La autorización debe utilizar la relación:

```text
auth.users
    ↓
academy_members
    ↓
academies
```

---

### ❌ Confiar en `academy_id` enviado por el frontend

Incorrecto:

```text
Frontend
   ↓
academy_id = "Academy B"
   ↓
Supabase
```

El valor enviado por el cliente no constituye autorización.

La política RLS debe comprobar que el usuario tiene acceso a esa academia.

---

### ❌ Eliminar RLS para resolver problemas de desarrollo

Desactivar RLS puede ocultar errores de diseño de seguridad.

Los problemas de acceso deben resolverse mediante políticas correctamente diseñadas.

---

### ❌ Modificar manualmente una tabla y no crear una migración

Esto genera diferencias entre ambientes y rompe la trazabilidad.

El cambio debe convertirse en una migración versionada.

---

### ❌ Editar una migración ya aplicada

Si el esquema necesita evolucionar:

```text
Nueva necesidad
      ↓
Nueva migración
```

No se debe modificar silenciosamente la historia.

---

### ❌ Crear políticas públicas demasiado amplias

Especialmente para:

```text
call_ups
responses
```

El acceso mediante token debe limitarse al recurso y operación correspondientes.

---

## 19. Trazabilidad

Los cambios de datos deben poder relacionarse con el producto:

```text
Producto
   ↓
Historia de Usuario
   ↓
Spec
   ↓
Modelo de datos
   ↓
Migración
   ↓
RLS / Policies
   ↓
Repository
   ↓
Tests
```

Ejemplo:

```text
HU-002 — Registrar jugador
        ↓
specs/002-player-registration/
        ↓
players
        ↓
migration
        ↓
RLS
        ↓
PlayerRepository
        ↓
Tests
```

La migración no sustituye a la especificación ni a la documentación arquitectónica.

Cada artefacto debe mantener su responsabilidad.

---

## 20. Documentación de cambios

Los cambios arquitectónicamente relevantes deben documentarse en:

```text
docs/architecture/supabase.md
```

La migración contiene el cambio ejecutable.

La documentación contiene el contexto y la decisión arquitectónica.

No se debe copiar el SQL completo en la documentación arquitectónica salvo que exista una razón específica.

---

## Resumen

| Paso | Resultado |
|---|---|
| Identificar necesidad | Cambio relacionado con producto |
| Revisar modelo | Entidades y dependencias definidas |
| Crear migración | Cambio SQL versionado |
| Crear RLS | Aislamiento y autorización |
| Ejecutar | Esquema actualizado |
| Verificar | Integridad y aislamiento comprobados |
| Probar | Comportamiento validado |
| Commit | Cambio registrado en Git |
| Documentar | Arquitectura y trazabilidad actualizadas |

La regla fundamental es:

> **La base de datos de PlayerTech evoluciona mediante migraciones versionadas, y todo dato perteneciente a una academia debe quedar protegido por el modelo multi-tenant y sus políticas de autorización.**