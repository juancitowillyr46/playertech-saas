# Guía de Migraciones en Supabase

Cómo versionamos, organizamos y ejecutamos cambios en la base de datos de PlayerTech.

---

## 1. ¿Qué es una migración?

Una migración es un archivo SQL que describe un cambio en la estructura o configuración de la base de datos.

**Ejemplos:**
- Crear tabla `players`
- Agregar columna `email` a `players`
- Crear políticas de Row Level Security
- Agregar índices para performance

### ¿Por qué versionar migraciones?

```
❌ Malo: editar tablas manualmente en Supabase dashboard
   → Cambios no quedan documentados
   → Otros devs no saben qué pasó
   → Imposible reproducir en otro ambiente

✅ Bien: cada cambio es un archivo SQL versionado
   → Historial completo
   → Reproducible en cualquier ambiente
   → Trazable en Git
```

---

## 2. Estructura de carpetas

```
playertech-saas/
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   ���   ├── 002_players_table.sql
│   │   ├── 003_groups_table.sql
│   │   ├── 004_activities_table.sql
│   │   ├── 005_call_ups_table.sql
│   │   ├── 006_responses_table.sql
│   │   ├── 007_rls_policies.sql
│   │   └── 008_indexes_and_constraints.sql
│   ├── seed/
│   │   └── development.sql
│   ├── config.json
│   └── README.md
```

---

## 3. Convención de nombres

```
NNN_descripcion_corto.sql
```

- `NNN`: número secuencial (001, 002, 003...)
- `_`: separador
- `descripcion_corto`: qué hace la migración en snake_case

**Ejemplos:**
```
001_initial_schema.sql           ← Estructura base
002_players_table.sql            ← Crear tabla players
003_add_email_to_players.sql     ← Modificar tabla existente
004_create_rls_policies.sql      ← Políticas de seguridad
005_add_indexes.sql              ← Performance
```

---

## 4. Estructura de una migración

### Migración simple: crear tabla

**Archivo: `002_players_table.sql`**

```sql
-- Crear tabla players
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  birth_date DATE,
  position TEXT,
  jersey_number INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_academy FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_players_academy_id ON players(academy_id);
CREATE INDEX idx_players_name ON players(name);

-- Habilitar RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Política: admin puede ver jugadores de su academia
CREATE POLICY "admin_view_players"
ON players FOR SELECT
TO authenticated
USING (academy_id = auth.uid());
```

### Migración con cambio estructural

**Archivo: `003_add_email_to_players.sql`**

```sql
-- Agregar columna si no existe
ALTER TABLE players
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Comentario para documentación
COMMENT ON COLUMN players.email IS 'Email del jugador, requerido para contacto';
```

### Migración de RLS (seguridad)

**Archivo: `007_rls_policies.sql`**

```sql
-- Tabla: activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Política 1: Admin puede ver actividades de su academia
CREATE POLICY "admin_view_activities"
ON activities FOR SELECT
TO authenticated
USING (academy_id = auth.uid());

-- Política 2: Admin puede crear actividades
CREATE POLICY "admin_create_activities"
ON activities FOR INSERT
TO authenticated
WITH CHECK (academy_id = auth.uid());

-- Política 3: Admin puede actualizar sus actividades
CREATE POLICY "admin_update_activities"
ON activities FOR UPDATE
TO authenticated
USING (academy_id = auth.uid())
WITH CHECK (academy_id = auth.uid());

-- Tabla: call_ups
ALTER TABLE call_ups ENABLE ROW LEVEL SECURITY;

-- El enlace de convocatoria es público (sin RLS)
-- Tutor accede sin autenticación mediante token temporal
```

---

## 5. Flujo de trabajo con migraciones

### Paso 1: Identificar cambio necesario

```
HU-002: Registrar jugador

Necesita:
- Tabla players con campos: name, email, birth_date, position, jersey_number
- Relación con academy
- RLS para que admin vea solo sus jugadores
```

### Paso 2: Crear archivo de migración

```bash
# En tu editor favorito, crear:
supabase/migrations/002_players_table.sql

# Copiar template de arriba y adaptar
```

### Paso 3: Escribir SQL

```sql
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  birth_date DATE,
  position TEXT,
  jersey_number INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "players_academy_isolation"
ON players FOR SELECT
TO authenticated
USING (academy_id = auth.uid());
```

### Paso 4: Ejecutar en ambiente local (si usas Supabase CLI)

```bash
# Opción A: Con Supabase CLI (recomendado para desarrollo)
supabase migration up

# Opción B: Manual en Supabase Dashboard
# 1. Ir a SQL Editor
# 2. Copiar y pegar contenido del archivo
# 3. Ejecutar
```

### Paso 5: Verificar en Supabase Dashboard

1. Ir a **Database** → **Tables**
2. Confirmar que tabla `players` existe
3. Ir a **Authentication** → **Row Level Security**
4. Confirmar que política está activa

### Paso 6: Commitear en Git

```bash
git add supabase/migrations/002_players_table.sql
git commit -m "database: create players table with RLS policies"
git push
```

### Paso 7: Documentar en archivo de seguimiento

```
# En supabase/migrations/README.md o docs/architecture/supabase.md

## Migraciones aplicadas

| # | Nombre | Descripción | Estado |
|---|--------|-------------|--------|
| 001 | initial_schema | Tablas base (academies, users) | ✅ Aplicada |
| 002 | players_table | Tabla de jugadores con RLS | ✅ Aplicada |
```

---

## 6. Estructura de tablas recomendada para MVP

```sql
-- TABLA 1: academies (multi-tenant futuro)
CREATE TABLE academies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA 2: players
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id),
  name TEXT NOT NULL,
  email TEXT,
  birth_date DATE,
  position TEXT,
  jersey_number INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA 3: groups (categorías/grupos)
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA 4: player_groups (relación N:N)
CREATE TABLE player_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player_id, group_id)
);

-- TABLA 5: activities
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'training' o 'competition'
  description TEXT,
  scheduled_at TIMESTAMP NOT NULL,
  location TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA 6: call_ups
CREATE TABLE call_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id),
  player_id UUID NOT NULL REFERENCES players(id),
  token TEXT UNIQUE NOT NULL, -- enlace público único
  token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA 7: responses
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_up_id UUID NOT NULL REFERENCES call_ups(id) UNIQUE,
  status TEXT NOT NULL, -- 'confirmed' o 'rejected'
  reason TEXT, -- motivo si fue rechazado
  responded_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 7. RLS (Row Level Security) - Ejemplo completo

```sql
-- ========================
-- TABLA: players
-- ========================

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Admin solo ve jugadores de su academia
CREATE POLICY "players_admin_isolation"
ON players FOR SELECT
TO authenticated
USING (academy_id = auth.uid());

-- Admin solo crea jugadores en su academia
CREATE POLICY "players_admin_insert"
ON players FOR INSERT
TO authenticated
WITH CHECK (academy_id = auth.uid());

-- Admin solo actualiza sus jugadores
CREATE POLICY "players_admin_update"
ON players FOR UPDATE
TO authenticated
USING (academy_id = auth.uid())
WITH CHECK (academy_id = auth.uid());

-- Admin solo borra sus jugadores
CREATE POLICY "players_admin_delete"
ON players FOR DELETE
TO authenticated
USING (academy_id = auth.uid());

-- ========================
-- TABLA: activities
-- ========================

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Similar a players
CREATE POLICY "activities_admin_isolation"
ON activities FOR SELECT
TO authenticated
USING (academy_id = auth.uid());

CREATE POLICY "activities_admin_insert"
ON activities FOR INSERT
TO authenticated
WITH CHECK (academy_id = auth.uid());

-- ========================
-- TABLA: call_ups (acceso público por token)
-- ========================

ALTER TABLE call_ups ENABLE ROW LEVEL SECURITY;

-- Admin ve sus convocatorias
CREATE POLICY "call_ups_admin_view"
ON call_ups FOR SELECT
TO authenticated
USING (
  activity_id IN (
    SELECT id FROM activities 
    WHERE academy_id = auth.uid()
  )
);

-- Público: acceso por token válido
-- Nota: Esto requiere función en Supabase o control en API
-- Por ahora: backend valida token antes de retornar datos

-- ========================
-- TABLA: responses
-- ========================

ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Admin ve respuestas de sus convocatorias
CREATE POLICY "responses_admin_view"
ON responses FOR SELECT
TO authenticated
USING (
  call_up_id IN (
    SELECT id FROM call_ups
    WHERE activity_id IN (
      SELECT id FROM activities
      WHERE academy_id = auth.uid()
    )
  )
);

-- Tutor crea respuesta con token válido
-- Validación: backend verifica token antes de INSERT
```

---

## 8. Seed (datos de prueba)

Para desarrollo y testing, crear datos iniciales:

**Archivo: `supabase/seed/development.sql`**

```sql
-- Limpiar datos existentes (solo en desarrollo)
TRUNCATE TABLE responses CASCADE;
TRUNCATE TABLE call_ups CASCADE;
TRUNCATE TABLE player_groups CASCADE;
TRUNCATE TABLE activities CASCADE;
TRUNCATE TABLE groups CASCADE;
TRUNCATE TABLE players CASCADE;
TRUNCATE TABLE academies CASCADE;

-- Insertar academia de prueba
INSERT INTO academies (id, name, owner_id)
VALUES ('11111111-1111-1111-1111-111111111111', 'Academia Test', auth.uid())
RETURNING id;

-- Insertar jugadores
INSERT INTO players (academy_id, name, email, birth_date, position, jersey_number)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Juan Pérez', 'juan@test.com', '2010-05-15', 'forward', 9),
  ('11111111-1111-1111-1111-111111111111', 'Carlos López', 'carlos@test.com', '2011-03-22', 'midfielder', 5),
  ('11111111-1111-1111-1111-111111111111', 'Diego Martínez', 'diego@test.com', '2009-08-10', 'defender', 3);

-- Insertar grupos
INSERT INTO groups (academy_id, name, description)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Sub-12', 'Categoría sub-12'),
  ('11111111-1111-1111-1111-111111111111', 'Sub-14', 'Categoría sub-14');

-- Insertar actividades
INSERT INTO activities (academy_id, name, type, description, scheduled_at, location)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Entrenamiento Martes', 'training', 'Entrenamiento técnico', NOW() + INTERVAL '2 days', 'Cancha 1'),
  ('11111111-1111-1111-1111-111111111111', 'Torneo Regional', 'competition', 'Torneo amistoso regional', NOW() + INTERVAL '7 days', 'Estadio Municipal');
```

### Ejecutar seed

```bash
# Opción A: Con Supabase CLI
supabase db seed

# Opción B: Manual
# 1. SQL Editor en Dashboard
# 2. Copiar contenido de development.sql
# 3. Ejecutar
```

---

## 9. Flujo real de trabajo: HU-002 (Registrar jugador)

### Paso 1: Crear migración

```
supabase/migrations/002_players_table.sql

-- Tabla players con RLS
-- Índices
-- Políticas
```

### Paso 2: Ejecutar migración

```bash
supabase migration up
```

### Paso 3: Verificar en dashboard

```
Dashboard → Tables → players ✅
Dashboard → RLS → Políticas activadas ✅
```

### Paso 4: Crear spec de feature

```
specs/players/spec.md

Referencia: HU-002
Requiere: tabla players, RLS configurado
Casos de uso: crear, listar, actualizar
```

### Paso 5: Implementar en Angular

```typescript
// features/players/repositories/player.repository.ts

interface IPlayerRepository {
  getAll(): Observable<Player[]>;      // SELECT * FROM players
  create(player: Player): Observable<Player>; // INSERT INTO players
}

@Injectable()
export class SupabasePlayerRepository implements IPlayerRepository {
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
        .insert([player])
        .select()
    );
  }
}
```

### Paso 6: Commit

```bash
git add supabase/migrations/002_players_table.sql
git commit -m "database: create players table with RLS

- Tabla players con campos: name, email, birth_date, position
- Relaciones: academy_id (foreign key)
- RLS: admin solo ve sus propios jugadores
- Índices: academy_id, name para búsquedas frecuentes"
```

---

## 10. Checklist para nueva migración

```
□ Archivo creado: supabase/migrations/NNN_descripcion.sql
□ SQL sintácticamente válido (probado en editor)
□ Usa IF NOT EXISTS para idempotencia
□ Comentarios explicando qué hace
□ Índices creados donde sea necesario
□ RLS habilitado en tablas sensibles
□ Políticas documentadas
□ Ejecutado localmente ✓
□ Verificado en dashboard ✓
□ Commitado en Git
□ Referencia en docs o spec si es necesario
□ Seed.sql actualizado si afecta tests

```

---

## 11. Errores comunes y soluciones

### ❌ "Syntax error"

**Causa:** SQL mal escrito

**Solución:**
```sql
-- ❌ Mal
CREATE TABLE players
  id UUID,
  name TEXT

-- ✅ Bien
CREATE TABLE players (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL
);
```

### ❌ "Violación de constraint"

**Causa:** Foreign key referencia tabla que no existe

**Solución:**
- Migración 001: crear `academies`
- Migración 002: crear `players` (referencia academies)

### ❌ "RLS policy not applied"

**Causa:** `ALTER TABLE ENABLE ROW LEVEL SECURITY` sin política

**Solución:**
```sql
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_policy"
ON players FOR SELECT
TO authenticated
USING (academy_id = auth.uid());
```

### ❌ "Token expires but I need persistent link"

**Causa:** Enlace temporal para tutor expira

**Solución:**
```sql
-- Generar token único y largo
INSERT INTO call_ups (activity_id, player_id, token, token_expires_at)
VALUES (
  '...',
  '...',
  gen_random_uuid()::text || md5(random()::text),
  NOW() + INTERVAL '7 days'  -- expira en 7 días, no inmediato
);
```

---

## 12. Documentación de cambios

Para cada migración importante, documentar en `docs/architecture/supabase.md`:

```markdown
### Migración 002: Tabla players

**Requisito:** HU-002 Registrar jugador

**Cambios:**
- Tabla `players` con campos: name, email, birth_date, position, jersey_number
- Foreign key: academy_id → academies
- RLS: admin solo ve jugadores de su academia
- Índices: academy_id (búsqueda frecuente)

**Fecha:** 2024-10-15
**Estado:** ✅ Aplicada en producción
```

---

## Resumen

| Paso | Cómo | Resultado |
|------|------|-----------|
| 1. Crear archivo | `supabase/migrations/NNN_descripcion.sql` | Archivo SQL versionado |
| 2. Escribir SQL | Tablas, índices, RLS | Schema definido |
| 3. Ejecutar | `supabase migration up` o dashboard | Cambios en BD |
| 4. Verificar | Dashboard → Tables, RLS | Confirmar ✓ |
| 5. Commit | `git add` + `git commit` | Histórico en Git |
| 6. Implementar | Repository en Angular | Features funcionales |
| 7. Documentar | Actualizar docs | Otros entienden |

