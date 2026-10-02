# Architecture Decision Records (ADRs)

Documentación de decisiones arquitectónicas importantes de PlayerTech.

Cada ADR define una decisión, su justificación, implicaciones y excepciones.

---

## ADR-001: Supabase como backend del MVP

### Decisión
Usar Supabase (PostgreSQL + Authentication + Row Level Security) durante el MVP v1.

### Justificación
- **Acelera desarrollo**: no implementar backend propio desde cero
- **Valida negocio**: obtener feedback real de usuarios sin inversión de infraestructura
- **Costo reducido**: no mantener servidores ni infraestructura cloud compleja
- **Características listas**: autenticación y RLS disponibles sin implementación adicional
- **Escalabilidad controlada**: PostgreSQL es suficiente para MVP

### Implicaciones
- Abstracción de datos OBLIGATORIA (ver ADR-002)
- Frontend NO realiza queries directas a Supabase
- Todas las migraciones de base de datos se versionan en `supabase/migrations/`
- Configuración de Supabase se mantiene en repositorio (`supabase/config.json`)
- Secrets de Supabase nunca se commitean (usar `.env.local`)

### Cambio futuro
Después de validar MVP: reemplazar cliente de Supabase por llamadas HTTP a API Symfony.
La arquitectura debe permitir este cambio sin modificar features.

### Excepción
Ninguna. Violaciones a esta decisión (queries directas en componentes, lógica en cliente) deben justificarse explícitamente.

---

## ADR-002: Repository Pattern para abstracción de datos

### Decisión
Toda comunicación con datos (Supabase hoy, API mañana) pasa por una capa Repository que implementa una interfaz.

### Arquitectura

```
Component
    ↓
Service (lógica de aplicación)
    ↓
Repository Interface (abstracción)
    ↓
SupabasePlayerRepository (implementación actual)
    ↓
Supabase
```

### Implementación

**Interfaz (invariante):**
```typescript
interface IPlayerRepository {
  getAll(): Observable<Player[]>;
  getById(id: string): Observable<Player>;
  create(player: Player): Observable<Player>;
  update(id: string, player: Player): Observable<Player>;
  delete(id: string): Observable<void>;
}
```

**Implementación actual (Supabase):**
```typescript
@Injectable()
export class SupabasePlayerRepository implements IPlayerRepository {
  constructor(private supabase: SupabaseClient) {}
  
  getAll() {
    return from(this.supabase.from('players').select('*'));
  }
}
```

**Futura implementación (API):**
```typescript
@Injectable()
export class HttpPlayerRepository implements IPlayerRepository {
  constructor(private http: HttpClient) {}
  
  getAll() {
    return this.http.get<Player[]>('/api/players');
  }
}
```

### Ventaja
Cuando migremos a API, reemplazamos `SupabasePlayerRepository` por `HttpPlayerRepository`.
**Features no cambian** si respetan esta abstracción.

### Implicaciones
- Cada entidad tiene su Repository
- Services dependen de interfaz, no de implementación
- Facilita testing (mockear repository)
- Requiere inyección de dependencias

### Excepción
En features muy pequeñas sin datos remotos, se permite lógica directa en servicio.
Pero si toca Supabase, SIEMPRE repository.

---

## ADR-003: PrimeNG + Tailwind para UI (no crear componentes custom innecesariamente)

### Decisión
- Usar PrimeNG para componentes complejos (tablas, formularios, diálogos)
- Usar Tailwind CSS para layout, spacing, responsive
- Crear componentes propios SOLO si PrimeNG no tiene solución adecuada

### Justificación
- **Tiempo**: no reinventar componentes que ya existen
- **Consistencia**: UI uniforme basada en PrimeNG
- **Mantenimiento**: actualizaciones automáticas de PrimeNG
- **Futuro**: migramos componentes visuales sin rediseñar lógica

### Componentes PrimeNG recomendados
- Button, Input, Dropdown, DatePicker
- DataTable, Tree (listas y jerarquías)
- Dialog, Sidebar, Menu
- Toast (notificaciones)
- Calendar (fechas)

### Línea roja
Si buscas un componente en PrimeNG y dice "pero yo quería algo custom"...
**Detente**. Probablemente es gold plating que ralentiza MVP.

### Cuándo crear componente propio
1. PrimeNG no tiene la solución
2. Se va a reutilizar en 3+ features
3. Tienes tiempo disponible
4. Simplifica código existente

**Ubicación correcta:**
```
shared/components/
└── my-custom-component/       # Si es reutilizable globalmente
    ├── my-custom-component.component.ts
    ├── my-custom-component.component.html
    └── my-custom-component.component.scss

features/players/components/
└── player-form/               # Si es específica de feature
    ├── player-form.component.ts
    ├── player-form.component.html
    └── player-form.component.scss
```

### Implicaciones
- Menos CSS personalizado
- Dependencia de PrimeNG (actualizar cuando sea necesario)
- Tema visual consistente

### Excepción
Un componente custom se justifica si genera mucho valor y es reusable. Documentar la decisión.

---

## ADR-004: DDD Lite - Bounded Contexts por feature

### Decisión
Cada feature (Players, Activities, CallUps) es un "bounded context" simplificado.
NO es DDD profesional, es "DDD con sentido común para MVP".

### Estructura

```
features/
├── players/                    # Bounded Context: Players
│   ├── pages/
│   ├── components/
│   ├── services/
│   ├── repositories/
│   ├── models/
│   └── players.module.ts
├── activities/                 # Bounded Context: Activities
└── call-ups/                   # Bounded Context: CallUps
```

### Beneficio DDD
- Cambios en Players no impactan CallUps
- Modelos de cada feature en su carpeta
- Fácil para nuevos devs: "voy a features/players/, encuentro todo"
- Escalable sin overhead

### Ventaja pragmática
Cuando llega un nuevo desarrollador, entiende en 5 minutos dónde está cada cosa.

### Qué NO hacer
- No crear jerarquías complejas de bounded contexts
- No usar Value Objects si es overkill
- No obsesionarse con Aggregates

### Qué SÍ hacer
- Organizar por dominio (feature)
- Validaciones de negocio en modelos/services
- Compartir SOLO lo que es realmente común (en shared/)

### Implicaciones
- Reorganizar código por feature (no por tipo técnico)
- Documentar relaciones entre features si es necesario
- Refactor fácil: una feature es una carpeta

### Excepción
Elementos completamente reutilizables van a `shared/`. Si dudas, dejar en feature y refactor después.

---

## ADR-005: Clean Code aplicado (pragmático, no obsesionante)

### Decisión
Seguir principios de Clean Code de forma pragmática.
NO es sobre perfección, es sobre legibilidad y mantenibilidad.

### Reglas simples

1. **Nombres descriptivos**
   ```typescript
   ✅ createPlayer()
   ❌ cp()
   ```

2. **Una responsabilidad por método/clase**
   ```typescript
   ✅ playerService.create() - solo crea
   ❌ playerService.createAndEmailAndNotifyAndCache() - demasiadas cosas
   ```

3. **Métodos pequeños**
   - Si supera 30 líneas, probablemente necesita split
   - Si necesitas 5 comentarios, refactor en lugar de comentar

4. **Sin magia**
   - Si necesitas comentario para entender, refactor
   - Código evidente > código inteligente

5. **Testeable**
   - Si no puedes testear fácil, rediseña
   - Las dependencias deben inyectarse

### No es obligatorio
- Nombres ultra largos: `createAndPersistPlayerWithValidationAndNotificationAndCaching` ❌
- Abstracciones prematuras: 1 componente ≠ crear interface
- Patrones "porque es patrón": solo si tiene sentido

### Ejemplo real pragmático

**❌ Mal:**
```typescript
async onSave() {
  const x = this.f.value;
  const y = await this.s.post(x);
  this.m.push(y);
  this.n.s('OK');
}
```

**✅ Bien:**
```typescript
async savePlayer() {
  const playerData = this.playerForm.value;
  const savedPlayer = await this.playerService.create(playerData);
  this.players.push(savedPlayer);
  this.notificationService.showSuccess('Player created');
}
```

### Excepciones permitidas
- Utilidades obvias: `isValid()`, `isEmpty()`
- Funciones pequeñas: menos exigente con nombres
- Código legacy: refactor cuando toques, no antes

### Implicaciones
- Código más mantenible
- Onboarding más rápido
- Debugging más fácil
- Testing más fácil

---

## ADR-006: Testing pragmático (no 100% coverage)

### Decisión
Escribir tests donde aportan más valor, no obsesionarse con coverage.

### Estándar para MVP

**Siempre:**
- Services (lógica de negocio): tests unitarios
- Validaciones críticas: tests unitarios

**Si tienes tiempo:**
- Componentes críticos (formularios, flujos): tests de componente
- Flujos principales: E2E (login → crear jugador → convocatoria)

**No es necesario:**
- Test cada getter/setter
- 100% code coverage
- Tests de HTML (p-button funciona, confiamos en PrimeNG)
- Tests de métodos triviales

### Principio
**Si algo causó bug antes → escribe test para ello**

### Estructura
```
src/app/features/players/services/
├── player.service.ts
└── player.service.spec.ts      # Test aquí
```

### Implicaciones
- Coverage 60-80% es realista
- Cambios más seguros
- Refactor más confiado

### Excepciones
Código trivial no necesita test. Si dudas, mejor test.

---

## ADR-007: Git workflow pragmático

### Decisión
Workflow Git simple y alineado con SDD.

### Convención

```
main (siempre deployable)
  ↓ feature/HU-XXX-descripcion
  ↓ commit: feat: HU-XXX descripcion corta
  ↓ Pull Request (revisión + merge)
  ↓ main (nuevo deploy)
```

### Formato de rama
```
feature/HU-001-admin-login
feature/HU-007-create-call-up
fix/bug-player-validation
```

### Commits
```
feat: HU-001 - add admin login
feat: HU-002 - add player registration
fix: HU-001 - handle invalid credentials
docs: add architecture decisions
test: add player service tests
```

### Tamaño de feature
- 1-2 historias de usuario = 1 rama
- Si parece mucho, split la rama
- Máximo 50 commits por rama (indicador de que es muy grande)

### Pull Request (si trabajo colaborativo)
El PR debe permitir identificar:
- Qué cambió (descripción clara)
- Por qué cambió (referencia a HU/spec)
- Qué se validó (manual + tests)

### Excepción
Hotfixes: rama `fix/` directamente de main si es urgente.

### Implicaciones
- Historia de commits clara y trazable
- Fácil revertir cambios
- Relación Spec → Commit visible

---

## ADR-008: Supabase - Usar sus características, no reinventarlas

### Decisión
Usar las fortalezas de Supabase, no crear capas innecesarias.

### Qué USAR de Supabase

✅ **Authentication (Supabase Auth)**
- Gestión de sesiones
- Recuperación de contraseña
- Providers (si futuro lo requiere)

✅ **Row Level Security (RLS)**
- Protección de datos por usuario/academia
- Políticas de acceso en base de datos
- NO confiar solo en validaciones frontend

✅ **PostgREST API**
- Queries automáticas sin endpoint personalizado
- Filtros, paginación, orden
- Realtime si es necesario

✅ **Storage** (si subes archivos)
- Documentos de jugadores
- Imágenes
- Con RLS para proteger acceso

### Qué NO reinventar

❌ **Sistema de autenticación propio**
- Usa Supabase Auth, no JWT manual

❌ **Cifrado manual**
- RLS ya protege datos
- SSL/TLS está habilitado

❌ **Caché complejo**
- PostgreSQL + RLS es suficiente para MVP

### Migraciones Supabase

```
supabase/migrations/
├── 001_initial_schema.sql          # Tablas base
├── 002_players_table.sql            # Jugadores
├── 003_call_ups_table.sql           # Convocatorias
├── 004_rls_policies.sql             # Políticas de acceso
└── 005_indexes.sql                  # Índices si necesario
```

**Cada migración = 1 cambio identificable**

### RLS (Row Level Security)

```sql
-- Ejemplo: solo administrador ve sus jugadores
CREATE POLICY "admin_see_own_players"
ON players FOR SELECT
TO authenticated
USING (academy_id = auth.uid());
```

### Implicaciones
- Dependencia de Supabase hasta post-MVP
- RLS es responsabilidad de backend (documentar bien)
- Migraciones versionadas y reproducibles

### Excepciones
Si necesitas lógica no estándar que Supabase no soporta fácil → mejor implementar en API REST posterior.

---

## ADR-009: Arquitectura del frontend (capas y responsabilidades)

### Decisión
Frontend organizado en capas claras pero pragmáticas.

### Capas

```
┌─────────────────────────────────┐
│   Presentación (Components)     │  Renderizar + capturar input
├─────────────────────────────────┤
│   Lógica de Aplicación (Service)│  Orquestar + reglas negocio
├─────────────────────────────────┤
│   Acceso a Datos (Repository)   │  Comunicar con backend
├─────────────────────────────────┤
│   Infraestructura (Supabase)    │  Datos reales
└─────────────────────────────────┘
```

### Detalle por capa

**Presentación (Components)**
- Renderizar UI
- Capturar eventos del usuario
- Llamar servicios
- NUNCA lógica de negocio compleja
- NUNCA queries directas a datos

**Lógica de Aplicación (Services)**
- Orquestar datos
- Aplicar reglas de negocio
- Manejar estado
- Coordinar múltiples repositories
- NUNCA lógica de presentación (ej: formatear UI)

**Acceso a Datos (Repository)**
- Comunicar con backend (Supabase hoy, API mañana)
- Transformar datos si es necesario
- NUNCA lógica de negocio
- NUNCA lógica de presentación

**Infraestructura**
- HTTP Client
- Supabase Client
- Configuración

### No es obligatorio ir estricto
- Feature pequeña sin lógica: componente puede tener lógica simple
- Service crece: extraer lógica a métodos pequeños
- Validaciones de negocio: SIEMPRE en service/model, nunca solo en component

### Implicaciones
- Código fácil de testear
- Responsabilidades claras
- Cambios aislados
- Reutilización facilitada

### Excepciones
- Lógica de presentación trivial en component: permitido
- Transformación de datos para UI: permitido en component si es simple

---

## ADR-010: Evolución post-MVP hacia Symfony + MySQL

### Decisión
Post-MVP: migrar gradualmente de Supabase a API propia (Symfony).

### Timeline (estimado)

**MVP (Actual)**
- Angular + Supabase
- Repository pattern implementado
- Abstracto de datos funcionando

**MVP + 1 (2-4 semanas post-validación)**
- Symfony API: autenticación
- HttpPlayerRepository creado
- Frontend apunta a API para players

**MVP + 2 (siguiente mes)**
- Business logic migrando a Symfony
- Más entidades en API
- Testing en backend

**MVP + 3 (mes posterior)**
- Migración completa
- Supabase descontinuado
- MySQL en producción

### Cambios necesarios

**Mínimos si seguiste ADR-002:**
```
SupabasePlayerRepository → HttpPlayerRepository
(interface IPlayerRepository = igual)
```

**Features: 0 cambios** si respetaste abstracción de datos

### Prepararse ahora
- ADR-002: Repository pattern (✅ ya hecho)
- ADR-008: RLS en Supabase (documentado)
- Testing: services sin dependencia de Supabase

### No hacer ahora
- NO optimizar MVP para cambio futuro si mata MVP
- NO sobre-ingenierizar para migración futura
- NO crear arquitectura "para cuando migres"

Focus en MVP funcional. Arquitectura ya está preparada.

### Implicaciones
- Investment en arquitectura ya hecho
- Migración será método mecánico, no rediseño
- Team familiarizado con patrones

---

## ADR-011: Constitution como norte

### Decisión
La Constitution (`docs/constitution-daft.md`) define principios.
Los ADRs definen decisiones específicas que respetan la Constitution.

### Relación

```
Constitution (principios)
    ↓
ADRs (decisiones específicas)
    ↓
Implementación (código día a día)
```

**Ejemplo:**
- Constitution: "Separación de responsabilidades"
- ADR-002: "Repository Pattern para datos"
- ADR-005: "Clean Code pragmático"
- Implementación: código que respeta todo

### Si hay conflicto
ADR tiene precedencia sobre interpretaciones vagas de Constitution.
Pero ADR no puede violar Constitution.

### Documentar excepciones
Si un ADR necesita ser violado (raro, pero puede pasar):
1. Justificar por escrito
2. Documentar en PR o código
3. Revisar en próxima sesión

### Implicaciones
- Framework coherente
- Decisiones trazables
- Nuevos devs entienden el "por qué"

---

## Referencia rápida

| Decisión | Válida | Reconsiderar |
|----------|--------|--------------|
| Query directo en component | ❌ | Siempre usar Repository |
| PrimeNG + CSS custom moderado | ✅ | Si es muy custom → componente |
| Service con 3+ responsabilidades | ❌ | Split en services |
| Test unitario en repository | ⚠️ | Tests de integración mejor |
| Feature depende de otra feature | ❌ | Extraer a shared/ |
| Migración sin versionado | ❌ | Todos los cambios versionados |
| Comentario en lugar de refactor | ❌ | Refactor el código |

---

## Documentación relacionada

- `docs/architecture/frontend.md` — Estructura Angular
- `docs/architecture/data.md` — Data flow general
- `docs/engineering/frontend-clean-architecture.md` — Implementación práctica
- `docs/constitution-daft.md` — Principios generales
