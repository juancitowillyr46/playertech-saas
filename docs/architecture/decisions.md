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

**Nota de T-01 (2026-10-17, spec 003):** la decisión se mantiene para los componentes. La **calidad visual y de experiencia es un requisito de producto** (principio XIII), no *gold plating*: se logra con el preset de tokens, las utilidades de Tailwind y el layout adoptado, y con componentes propios de composición mínima (`PageHeader`, `BrandMark`) que no sustituyen a ninguno de PrimeNG.

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
USING (
  EXISTS (
    SELECT 1
    FROM academy_members am
    WHERE am.academy_id = players.academy_id
      AND am.user_id = auth.uid()
  )
);
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
La Constitution (`.specify/memory/constitution.md`, fuente única; `docs/constitution.md` es su puerta de entrada) define principios.
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

## ADR-012: Fundación multi-tenant del SaaS

**Estado:** Aceptada · **Fecha:** 2026-10-15 · **Fase:** 1 — Fundación SaaS

### Decisión
PlayerTech se construye primero como plataforma SaaS multi-tenant (Fase 1) y después incorpora las funcionalidades de negocio (Fase 2). El modelo de tenant se organiza en cinco capas:

```text
PLATAFORMA (global)   plans, legal_documents
IDENTIDAD (global)    auth.users, profiles
TENANT                academies, subscriptions
MEMBRESÍA             academy_members
ORGANIZACIÓN          venues
NEGOCIO (Fase 2)      todas las tablas con academy_id
```

El aislamiento físico es **pool**: esquema compartido + `academy_id` + RLS. El modelo detallado está en `docs/architecture/database-schema.md`.

### Justificación
- Si el tenant queda bien resuelto desde el inicio, cada módulo de negocio solo tiene que colgarse de `academy_id` y de las funciones de autorización existentes.
- El modelo pool es el adecuado para el volumen de un MVP: una sola migración por cambio, bajo costo y escalable a miles de tenants.
- Los campos de estado, rol y plan cuestan poco ahora y evitan migraciones sobre datos productivos más adelante.

### Registro de decisiones de la ideación

| ID | Decisión |
|---|---|
| DEC-01 | Alta de academia **autoservicio**. Una operación atómica crea academia, owner, suscripción free, sede principal y aceptaciones legales |
| DEC-02 | Una persona pertenece a **una sola academia** (`academy_members.user_id` UNIQUE). Se puede relajar sin rediseño |
| DEC-03 | El MVP funciona **solo con el rol Owner**. El modelo admite más roles a futuro (admin, entrenador…) |
| DEC-04 | **Sede = lugar** (oficina o lugar de entrenamiento). No separa datos ni permisos |
| DEC-05 | Cada academia tiene **exactamente una sede principal**, creada en el registro |
| DEC-06 | El jugador tiene una sede habitual (por defecto la principal), pero asiste a actividades en cualquier sede *(Fase 2)* |
| DEC-07 | Planes **Free, Pro y Advanced**. El MVP usa solo Free, **sin límites**; el mecanismo de límites queda preparado |
| DEC-08 | El registro solicita nombre de la academia, nombre del owner, correo, contraseña y aceptaciones legales. El país no se solicita |
| DEC-09 | Las aceptaciones legales se registran con datos de auditoría: documento, versión y fecha y hora del servidor |
| DEC-10 | Verificación de correo obligatoria, con el mecanismo nativo de Supabase, encapsulada para poder cambiar de estrategia (ver ADR-014) |
| DEC-11 | Contraseña de mínimo 8 caracteres, con campo de confirmación |
| DEC-12 | Mensajes genéricos que no revelan si un correo está registrado. **Excepción** (2026-10-18, spec 006): el registro indica que ya existe una cuenta con ese correo (HU-014 CA-005), por claridad para el owner. Riesgo aceptado: permite averiguar si un correo tiene cuenta. El inicio de sesión, la recuperación y el reenvío siguen sin revelarlo. Mitigaciones previstas en `docs/engineering/security.md` (SEC-01) |
| DEC-13 | Sin captcha en el MVP; se reevalúa si aparece abuso |
| DEC-14 | Se permiten nombres de academia duplicados; el `slug` se genera único automáticamente |
| DEC-15 | País **Colombia (CO)** y zona horaria **America/Bogota**, internos y no visibles en la UI por ahora |
| DEC-16 | Recuperación de contraseña nativa de Supabase (ver ADR-014) |
| DEC-17 | Tras iniciar sesión se muestra un inicio propio de PlayerTech, no el dashboard de demostración de SakaiNG |
| DEC-18 | Estado de academia `active` \| `suspended` en el modelo, sin UI. Una academia suspendida no puede operar y conserva sus datos |
| DEC-19 | Dos aceptaciones obligatorias: Términos y Condiciones y Política de Tratamiento de Datos Personales (Ley 1581 de 2012), versionadas |
| DEC-20 | La academia se crea en el mismo momento del registro, de forma atómica. La limpieza de registros no confirmados queda para el MVP+ |
| DEC-21 | Campos editables de la academia: nombre, logo, teléfono, correo de contacto, dirección y ciudad. Solo el nombre es obligatorio. El correo de contacto se inicializa con el correo del registro y es editable sin afectar al correo de inicio de sesión |
| DEC-22 | El logo es JPG o PNG, almacenado de forma portable (ver ADR-013). Actualizado el 2026-10-18: el owner elige una imagen de hasta 5 MB; la aplicación la redimensiona (lado mayor de 512 px como máximo) y la comprime antes de guardarla, y lo guardado nunca supera 1 MB. Al reemplazar o retirar el logo se borra la imagen anterior del almacenamiento y se conserva su registro con `deleted_at` |
| DEC-23 | Campos de sede: nombre, tipo, dirección, ciudad y referencia o indicaciones. Sin enlace de mapas |
| DEC-24 | La sede principal se crea como "Sede principal", de tipo lugar de entrenamiento |
| DEC-25 | Se puede cambiar la sede principal; la anterior deja de serlo |
| DEC-26 | **Desactivar** una sede es reversible y conserva su historial. La sede principal no puede desactivarse |
| DEC-27 | **Borrado lógico** (`deleted_at`) como convención para las tablas de negocio. Lo eliminado desaparece de la UI y no se borra físicamente |
| DEC-28 | Cierre de sesión tras 60 minutos sin interacción (ver ADR-014). El tiempo cuenta desde la última interacción aunque la aplicación se haya cerrado: al reabrirla después de 60 minutos se piden de nuevo las credenciales. Sin aviso previo al cierre |
| DEC-29 | En el MVP **no se capturan la IP ni el navegador** en las aceptaciones legales; se registran documento, versión y hora del servidor (spec 001, R4). Si la asesoría legal lo exige, se añadirá una Edge Function de registro. El proveedor de SMTP se decide al configurar el entorno en la nube |

### Implicaciones
- Toda tabla de negocio incorpora `academy_id`, auditoría (`created_by`, `created_at`, `updated_at`) y `deleted_at`.
- La autorización se centraliza en funciones de base de datos (`is_academy_member`, `has_academy_role`, `current_academy_id`). Las políticas RLS no repiten la lógica de membresía.
- `is_academy_member` exige una membresía activa **y** una academia `active`, de modo que DEC-18 se aplica sin código adicional.
- El frontend nunca envía `academy_id` como autorización; el contexto de academia se resuelve desde la membresía.
- Las tablas creadas por el registro (`academies`, `academy_members`, `subscriptions`, `legal_acceptances`) no aceptan inserciones directas del cliente; solo las crea la función de registro.

### Fuera de esta decisión (MVP+)
Invitaciones y roles adicionales, cambio de plan y cobro, límites de plan, sedes como división con permisos, pertenencia a varias academias y limpieza de registros no confirmados.

---

## ADR-013: Almacenamiento de archivos portable entre proveedores

**Estado:** Aceptada · **Fecha:** 2026-10-15 · **Fase:** 1 — Fundación SaaS

### Decisión
Los archivos se almacenan en Supabase Storage durante el MVP, con una estructura que permite migrar a otro proveedor (S3, Azure Blob, GCS o una API propia) sin modificar la base de datos ni las funcionalidades.

1. **La base de datos no guarda URLs**, solo una clave relativa (`storage_key`). La URL se genera al momento de mostrar el archivo.
2. **Cada archivo tiene un registro en la tabla `files`.** Las tablas de negocio referencian `file_id` (por ejemplo, `academies.logo_file_id`).
3. **La clave empieza por la academia**, lo que permite aplicar aislamiento, exportación y baja de un tenant por prefijo.
4. **El nombre físico es el UUID del archivo**, nunca el nombre original.
5. **El acceso pasa por la abstracción `FileStorageRepository`** (`upload`, `getUrl`, `remove`), igual que el acceso a datos (ADR-002).

### Convención de la clave

```text
{bucket lógico}/{academy_id}/{módulo}/{entity_id}/{file_id}.{ext}

public-assets/7f3a…c21/academy/7f3a…c21/9b1e…44d.png
```

| Bucket lógico | Lectura | Escritura | Uso |
|---|---|---|---|
| `public-assets` | Pública | Miembros de la academia del prefijo | Logos (se mostrarán en páginas públicas en la Fase 2) |
| `private-files` | Miembros, mediante URL firmada con caducidad | Miembros de la academia del prefijo | Archivos sensibles futuros |

### Justificación
- La portabilidad entre proveedores es un requisito explícito.
- La clave relativa con el tenant al inicio está soportada por todos los proveedores de almacenamiento de objetos.
- Usar el UUID como nombre evita colisiones, no expone datos personales e invalida la caché al reemplazar un archivo.

### Implicaciones
- El tipo y el tamaño se validan también en el servidor: el bucket define tipos MIME permitidos y un tamaño máximo.
- Al reemplazar un archivo se crea un registro nuevo y el anterior recibe `deleted_at`. La eliminación física queda para una tarea de limpieza en el MVP+. **Excepción, el logo** (DEC-22, 2026-10-18): su imagen anterior se borra del almacenamiento en el momento, por la capacidad limitada; el registro se conserva con `deleted_at`.
- Migrar de proveedor consiste en copiar los objetos conservando sus claves, verificar con `checksum_sha256` y cambiar la implementación del repositorio.
- Las políticas de Storage autorizan la escritura con `is_academy_member()` aplicado al segmento `academy_id` de la ruta.

### Excepción
Ninguna. Ningún componente debe construir URLs de almacenamiento ni llamar directamente al SDK de Storage.

---

## ADR-014: Autenticación, verificación y sesión

**Estado:** Aceptada · **Fecha:** 2026-10-15 · **Fase:** 1 — Fundación SaaS

### Decisión
- **Verificación de correo obligatoria** antes del primer acceso, con el mecanismo nativo de Supabase Auth.
- **Recuperación de contraseña** nativa de Supabase: enlace por correo hacia una página propia de PlayerTech, que debe estar en la lista de redirecciones permitidas de cada entorno.
- **JWT de 1 hora** (valor por defecto recomendado por Supabase).
- **Cierre por inactividad de 60 minutos** en el frontend, medido por la interacción del usuario (DEC-28):
  - Se compara la hora actual con la de la última interacción, no se confía en un temporizador: el navegador del celular congela los temporizadores con la pantalla bloqueada o la aplicación en segundo plano.
  - La hora de la última interacción se conserva en el navegador y la comparten las pestañas. Al reabrir la aplicación después de 60 minutos, la sesión se cierra antes de mostrar datos.
  - Sin aviso previo con cuenta regresiva: escribir o tocar cuenta como interacción, y en el celular el aviso casi nunca se vería.
  - Los 60 minutos son fijos en producción y configurables por entorno, para poder verificarlo en desarrollo sin esperar una hora.
- **SMTP propio obligatorio** en todos los entornos donde se registren usuarios reales.

### Justificación
- El servicio de correo incluido en Supabase solo envía a miembros del equipo del proyecto y está limitado a 2 correos por hora; no sirve para registrar academias reales. Con SMTP propio, el límite por defecto es de 30 correos por hora y es configurable.
- El *inactivity timeout* y el *time-box* de sesión de Supabase solo existen en el plan Pro. Además, Supabase mide la inactividad por renovación del token, y el cliente lo renueva automáticamente mientras la pestaña está abierta. Por eso una pestaña abierta sin uso nunca se consideraría inactiva, y la detección de inactividad del usuario debe hacerse en el frontend.
- La recuperación nativa no revela si una cuenta existe, lo que cumple DEC-12.

### Implicaciones
- La verificación, la recuperación y la sesión quedan encapsuladas en el repositorio de autenticación, para poder cambiar de estrategia sin afectar a las funcionalidades.
- En desarrollo local la confirmación de correo viene desactivada por defecto; debe activarse en `supabase/config.toml` para que los entornos se comporten igual.
- La longitud mínima de contraseña (8) se configura también en Supabase Auth, no solo en el formulario.
- Al pasar a Supabase Pro se evaluará activar como refuerzo en el servidor un *inactivity timeout* de 1 hora, un *time-box* de sesión y la protección contra contraseñas filtradas.

### Pendiente para el plan técnico
- Proveedor de SMTP (por ejemplo Resend o Brevo): ver ADR-016.
- ~~Captura de IP en las aceptaciones legales~~: resuelta en DEC-29 (no se captura en el MVP).

---

## ADR-015: Arquitectura y experiencia base del frontend

**Estado:** Aceptada · **Fecha:** 2026-10-16 · **Fase:** 1 — Fundación SaaS

### Decisión

| ID | Decisión |
|---|---|
| FE-01 | El layout de SakaiNG (`layout/`) se **adopta como código propio** con cambios mínimos: el menú se define en `core/navigation` y la marca es configurable |
| FE-02 | Las demos de SakaiNG solo se registran en desarrollo, bajo `/dev` |
| FE-03 | Configuración por entorno con archivos `environment.ts`, solo con valores públicos |
| FE-04 | URLs y código en inglés; interfaz en español (`es-CO`) |
| FE-05 | El configurador de temas no se muestra; solo existe un botón de modo claro/oscuro. **Enmienda (2026-10-17, T-01):** el cambio de modo está en el menú de usuario y, sin elección guardada, se sigue la preferencia del dispositivo |
| FE-06 | Tema Aura, color primario `rgb(59, 130, 246)` (`blue.500`) como base de la paleta, surface por defecto y menú estático. **Ajuste por accesibilidad (2026-10-17):** en modo claro, el color de acción y de texto es `blue.600` (`#2563eb`, contraste 5,17:1 sobre blanco), porque `blue.500` da 3,68:1 y no cumple WCAG AA (principio XIII). Se configura en el preset (`core/theme/playertech-preset.ts`). **Sustituida por T-01 (2026-10-17, spec 003):** el preset de PlayerTech sobre Aura implementa la dirección visual «Planilla», elegida por el responsable de producto: tinta `#1c2b4a`, papel y pizarra como superficies, radios de 2 px, Public Sans y JetBrains Mono alojadas en el proyecto, estilos de PrimeNG en la capa CSS `primeng` y chasis de app con navegación inferior en el celular. El detalle está en `DESIGN.md` |
| FE-07 | ESLint se rehace con `angular-eslint` (formato de ESLint 9) |
| FE-08 | Estado con signals; Reactive Forms tipados; repositorios como clases abstractas inyectables |
| FE-09 | Supabase Auth con flujo PKCE y ruta `/auth/callback` |
| FE-10 | Pruebas con Vitest (frontend) y pgTAP (base de datos); Playwright cuando exista el flujo de negocio |
| FE-11 | Pantallas de autenticación propias con un layout compartido; no se reutilizan las demos de SakaiNG y no existe la opción "Recordarme" |
| FE-12 | Patrón de página de gestión basado en `pages/crud`, con drawer lateral para crear y editar |
| FE-13 | La configuración de la academia (perfil y sedes) se ubica en el menú lateral, bajo **Configuración**; la cuenta personal, en el menú de usuario del topbar |
| FE-14 | Tras el registro, el inicio muestra una tarjeta "Completa tu academia" en lugar de un asistente |

El detalle está en `docs/architecture/frontend.md`, `docs/architecture/ui.md` y `docs/engineering/testing.md`.

### Justificación
- Signals y componentes standalone son el modelo actual de Angular y encajan con la detección de cambios sin zone.js ya configurada.
- Las clases abstractas permiten sustituir Supabase por una API propia registrando otra implementación (ADR-002).
- Separar configuración de la academia y cuenta personal prepara la incorporación de roles sin reorganizar la navegación.
- Un patrón de gestión único da consistencia y acelera la Fase 2.

### Relación con la Constitución
La adopción de `layout/` se registró inicialmente como excepción controlada al principio V. Desde la Constitución 3.1.0, el principio V distingue el **layout adoptado** (código propio de PlayerTech, modificable con cambios mínimos y controlados) de las **demos** de SakaiNG (solo referencia), por lo que ya no se trata de una excepción.

- **Mitigación que se mantiene:** el menú vive en `core/navigation`; las actualizaciones de SakaiNG siguen `docs/engineering/sakai-upstream.md`.

---

## ADR-016: Plan de Supabase durante el MVP

**Estado:** Aceptada · **Fecha:** 2026-10-16 · **Fase:** 1 — Fundación SaaS

### Decisión
- El desarrollo se hace en **local** (Supabase CLI sobre Docker, spec 001); no depende del plan contratado.
- El entorno en la nube usa el **plan Free** durante el desarrollo y el piloto.
- **Antes de cargar datos reales** de academias deben existir: copias de seguridad propias, SMTP propio (ADR-014) y un dominio propio verificado para el envío de correo.
- Se pasa al **plan Pro** cuando ocurra cualquiera de estas condiciones: hay academias que dependen del producto o pagan por él, se necesitan backups gestionados, o el proyecto se acerca a los límites del plan Free.
- **Entorno de pruebas** (2026-10-18, habilitador T-02, spec 008): el frontend se publica en **Vercel** (plan Hobby) desde GitHub, con despliegue automático de `main` y vistas previas de los PR. La configuración pública (URL y clave publicable) llega como variables de entorno de Vercel, no en el código. El plan Hobby es de **uso no comercial**: antes del piloto con academias que paguen se pasa a Vercel Pro u otro alojamiento. Guía: `docs/engineering/deployment.md`.

### Justificación
Todo lo que usa la Fase 1 (PostgreSQL, Auth, Storage, RLS, SMTP propio) está disponible en el plan Free, y sus límites (500 MB de base de datos, 1 GB de almacenamiento, 5 GB de transferencia al mes, 50.000 usuarios activos al mes, 2 proyectos activos) superan con margen lo que necesita un piloto. Las funciones exclusivas de Pro que el diseño necesitaba ya tienen alternativa: el cierre por inactividad se hace en el frontend (ADR-014).

### Riesgos y mitigación

| Riesgo del plan Free | Mitigación |
|---|---|
| Sin copias de seguridad automáticas | Copia propia periódica con `supabase db dump` (automatizada, por ejemplo con GitHub Actions) y procedimiento de restauración documentado, antes de cargar datos reales |
| Pausa del proyecto tras 1 semana sin actividad | Aceptable durante el desarrollo (se reactiva desde el panel). Con academias activas no ocurre por el propio uso |
| Retención de logs de 1 día | Revisar los errores el mismo día; reevaluar al pasar a Pro |
| Sin protección contra contraseñas filtradas ni cierre por inactividad en el servidor | Se activan al pasar a Pro (ADR-014); mientras tanto, contraseña mínima de 8 y temporizador en el frontend |

Los límites del plan Free pueden cambiar: se confirman en la página de precios de Supabase al crear el proyecto en la nube.

### Pendiente
- Proveedor de SMTP (recomendación inicial: Resend; alternativa: Brevo).
- Dominio propio de PlayerTech.
- Automatización de las copias de seguridad.

---

## ADR-017: Portabilidad del backend

**Estado:** Aceptada · **Fecha:** 2026-10-18 · **Fase:** 1 — Fundación SaaS

### Contexto
PlayerTech usa Supabase para la autenticación (Supabase Auth), la autorización (RLS en PostgreSQL), el acceso a los datos (API automática, PostgREST) y los archivos (Storage). El responsable de producto contempla, a futuro, un backend propio (por ejemplo, Symfony en PHP) que asuma la autenticación y la autorización. Esta ADR no planifica esa migración: fija qué se mantiene hoy y qué reglas la mantienen barata.

### Decisión
- **La Fase 2 sigue con Supabase**, incluida la API automática (decisión del responsable de producto del 2026-10-18). No se construye un backend propio por ahora.
- **Si se migra**, el camino recomendado para la autorización es **híbrido**: las reglas de negocio pasan al backend (por ejemplo, voters de Symfony) y **RLS se conserva como red de seguridad del aislamiento entre academias** (principio VIII). El backend indica a PostgreSQL el usuario de cada petición con una variable de sesión de la transacción, y las funciones de autorización la leen en lugar del token de Supabase.
- **Reglas de portabilidad** que toda spec cumple desde ahora (las revisa `/speckit-analyze`):
  1. El usuario actual se obtiene en la base de datos **solo a través de las funciones de autorización** (`is_academy_member`, `has_academy_role`, `current_academy_id`) o de una función propia equivalente. No se añaden usos nuevos de `auth.uid()` en políticas, valores por defecto ni funciones.
  2. La lógica de negocio va en funciones SQL o en el frontend detrás de servicios. Las funciones exclusivas de Supabase (Edge Functions, Realtime, hooks de Auth) solo se usan detrás de una abstracción propia y justificadas en el plan de la spec.
  3. El SDK de Supabase solo aparece en las implementaciones `supabase-*.repository.ts` (regla de lint de ADR-002) y sus errores se traducen siempre a `AppErrorCode`.
  4. No se añaden referencias nuevas al esquema `auth` más allá del identificador del usuario.
  5. Los controles de seguridad nuevos se diseñan independientes del proveedor (`docs/engineering/security.md`).

### Qué es portable y qué está acoplado

| Pieza | Situación | Al migrar |
|---|---|---|
| Frontend (pantallas, servicios, modelos, errores) | Portable: solo los repositorios conocen Supabase (ADR-009) | Implementaciones nuevas de los repositorios contra la API propia |
| Contraseñas | Portables: bcrypt, que Symfony (PasswordHasher) admite | Se migran sin pedir cambio de contraseña |
| Esquema de datos, índices y restricciones | Portable: PostgreSQL estándar | Se conserva (Doctrine sobre la misma base) |
| Autenticación (registro, verificación, recuperación, sesión) | Acoplada a Supabase Auth | Symfony Security, con verificación y recuperación propias y JWT con renovación o sesión |
| Autorización | En la base de datos (RLS y funciones) | Camino híbrido de esta ADR |
| Acceso a datos | API automática (PostgREST) | **Es el mayor costo**: un endpoint por recurso, que crece con cada épica |
| Registro atómico | Trigger sobre `auth.users` (spec 001) | Servicio del backend en una transacción |
| Archivos | Supabase Storage detrás de `FileStorageRepository` (ADR-013) | S3 o similar, sin cambios en el frontend |

### Estado actual (deuda de portabilidad conocida)
Revisión de las migraciones del 2026-10-18:
- `auth.uid()` aparece en las tres funciones de autorización y, además, en 7 políticas RLS (registros propios de `profiles` y `legal_acceptances`, autoría en Storage), como valor por defecto de `created_by` en `files` y `venues` y en el trigger del registro.
- Seis tablas tienen claves foráneas a `auth.users` (`profiles`, `academies`, `academy_members`, `files`, `venues`, `legal_acceptances`).

**Mejora prevista (sin fecha):** una función propia `current_user_id()` que envuelva `auth.uid()` y reemplace sus usos directos en una migración. Así, al migrar, solo cambiaría esa función. Las claves a `auth.users` se resolverán en la migración con una tabla de usuarios propia.

### Consecuencias
- Hoy no hay costo adicional: se sigue con Supabase y las reglas solo limitan nuevos acoplamientos.
- El costo de una migración futura crece con cada recurso nuevo servido por la API automática. La decisión de migrar debe tomarse con ese inventario a la vista.

---

## ADR-018: Modelo de negocio de la Fase 2

**Estado:** Aceptada · **Fecha:** 2026-10-18 · **Fase:** 2 — Negocio (ideación)

### Contexto
La Fase 1 dejó lista la base del SaaS. La Fase 2 construye el flujo principal del MVP (`docs/product/scope.md`, sección 4): jugadores → actividad → convocatoria → mensaje por WhatsApp → respuesta del acudiente → seguimiento. `scope.md` dejaba abiertos tres temas: los acudientes, el lugar de la actividad y el modelo de convocatoria. El responsable de producto los decidió en la ideación del 2026-10-18.

### Decisión

| ID | Decisión |
|---|---|
| DEC-30 | Cada jugador puede tener **uno o más acudientes** (nombre, celular, parentesco). Si el jugador no tiene acudiente (por ejemplo, un adulto), responde él mismo con su celular. En la interfaz se usa el término **acudiente** |
| DEC-31 | **Un enlace por grupo convocado**, secreto, impredecible y que caduca al cierre (DEC-34). Se comparte en **un solo mensaje generado para el grupo de WhatsApp**. Quien lo abre por **primera vez** ve la lista de convocados con **nombre e inicial del apellido**, y el apodo si existe («Samuel V. · Samu»), elige a su jugador, escribe su nombre, su celular y su parentesco, y responde (un jugador adulto sin acudiente elige **«Soy el jugador»**); queda como **acudiente pendiente de validar**, y el **owner valida o rechaza el vínculo con un toque**. El dispositivo queda **recordado** con una llave secreta generada por PlayerTech (no el celular): las siguientes veces va directo a sus jugadores. **Todo dispositivo nuevo queda pendiente de validar**, aunque el celular coincida con un acudiente registrado (los números son visibles en el grupo); la app le indica al owner la coincidencia para validar con un toque. El celular es un dato de contacto, no una verificación: no se envían códigos por SMS ni por WhatsApp. Cada acudiente tiene su propio vínculo (papá y mamá por separado), así que siempre se sabe quién respondió. Sin código de familia: si va en el mismo mensaje no protege, y entregarlo aparte exige un trabajo previo que no se hará (decisión del 2026-10-18; reemplaza el enlace por acudiente de la primera ronda). Flujo: `docs/product/call-up-flow.md` |
| DEC-32 | El lugar de una actividad es una **sede** de la academia (EP-12) o una **cancha externa** de su catálogo: las canchas donde se juegan torneos, con nombre, dirección, ciudad e indicaciones, reutilizables y con nombre único en la academia. Se pueden crear desde el formulario de la actividad. Cada academia tiene su propio catálogo (multi-tenant): no hay catálogo compartido entre academias. Las canchas no son sedes: no tienen principal ni cuentan en «Completa tu academia» |
| DEC-33 | La respuesta puede cambiarse **hasta 3 veces por jugador y convocatoria**, siempre antes del cierre; después queda fija y se indica escribir al owner. Vale la **última respuesta**, con quién la dio y cuándo, y el owner ve el historial corto (por ejemplo, si papá y mamá respondieron distinto) |
| DEC-38 | Tres respuestas: **Sí**, **Sí, provisional** y **No**. Para *No* y *Sí, provisional* se puede elegir un **motivo de una lista fija**, la misma para todas las academias. Para *No*: Enfermedad o lesión, Compromiso académico, Compromiso familiar, Viaje, Transporte u Otro. Para *Sí, provisional*: Horario (colegio o trabajo), Transporte, Salud u Otro. El motivo es **opcional**; si se elige *Otro*, un texto de hasta 200 caracteres es obligatorio. En *Sí* no hay motivo. El seguimiento distingue los provisionales de los confirmados. Si llega el cierre y la respuesta sigue provisional, **queda como provisional**: la aplicación no la convierte y el owner decide |
| DEC-34 | La convocatoria tiene una **fecha límite opcional**. Sin ella, se cierra al empezar la actividad. El owner puede cerrarla antes |
| DEC-35 | **Grupos o categorías simples** (nombre) en la primera entrega. Un jugador puede estar en varios grupos. Al convocar se puede elegir un grupo para marcar a sus jugadores de una vez |
| DEC-36 | **Datos básicos del jugador**: nombres y apellidos, **apodo opcional** (se muestra como «Samuel V. · Samu» en la convocatoria y el seguimiento), fecha de nacimiento (obligatoria), celular propio (**siempre opcional**: los acudientes nacen después, desde el enlace; corregido el 2026-10-18), activo o inactivo y sus acudientes. Sin documento de identidad ni foto: datos mínimos (Ley 1581) |
| DEC-39 | Cuando un acudiente se registra desde el enlace, **autoriza el tratamiento de sus datos** (Ley 1581) con una casilla obligatoria que enlaza la Política de Tratamiento de Datos vigente; cuando lo registra el owner, este declara contar con esa autorización. Se guarda la versión y la hora del servidor, como las aceptaciones del registro de la academia. **La autorización es de la persona, no del vínculo** (ajuste del 2026-10-18, spec 010): se registra una vez, al registrar al acudiente, y asignarlo a otro jugador no la vuelve a pedir |
| DEC-40 | Modelo de tres piezas: **acudiente** (la persona: nombre y celular), **vínculo acudiente-jugador** (parentesco; pendiente, validado o rechazado) y **dispositivo** (la marca secreta en el navegador; pendiente, de confianza o revocado). El vínculo nace cuando el acudiente elige a su jugador y **validar lo confirma junto con el dispositivo**. Un acudiente reconocido que elige a otro jugador (un hermano) genera un vínculo nuevo pendiente, sin repetir sus datos. El owner también puede crear vínculos a mano desde la ficha del jugador (nacen validados). **Rechazar** descarta el vínculo, su respuesta deja de contar y el dispositivo deja de reconocerse. El owner valida desde el seguimiento de la convocatoria, la ficha del jugador o el aviso del inicio. Sin validar, la respuesta igual cuenta, marcada |
| DEC-41 | **Avisos al owner**. En la Fase 2 (spec 4), **dentro de la aplicación**: un contador en la navegación, un aviso en el inicio («N acudientes por validar», respuestas nuevas) y actualización en vivo del seguimiento (aplazada por DEC-46; los avisos van en la spec 014). Las **notificaciones push web** (PWA, que en iPhone requiere agregar la app a la pantalla de inicio) quedan para un habilitador posterior (T-03), detrás de una abstracción propia (ADR-017). Supabase no envía push: solo aporta piezas para dispararlas. El correo, cuando exista el SMTP propio |
| DEC-43 | **Asignar acudientes ya registrados** (ajuste del 2026-10-18, spec 010). Desde la ficha del jugador, «Agregar acudiente» muestra primero los acudientes de la academia con un buscador por nombre o celular, y a quién acompaña cada uno; se elige uno, se indica el parentesco y queda asignado (validado, sin repetir sus datos ni la autorización). «Registrar un acudiente nuevo» lleva al formulario de HU-034. Atajo **«Copiar acudientes de un hermano»**: se elige otro jugador y se asignan sus acudientes (todos marcados por defecto) con el mismo parentesco, editable |
| DEC-44 | **Actividades** (definido el 2026-10-18, spec 2). Datos: tipo (**Entrenamiento** o **Competencia**), fecha, hora de inicio, hora de fin y **hora de citación** opcionales, lugar (una sede o una cancha externa, DEC-32) y observaciones (uniforme, qué llevar); en competencia, además, **rival** y **torneo** opcionales. La actividad **no lleva jugadores ni grupos**: se eligen al convocar (spec 3, DEC-35). Al crear se puede **repetir semanalmente** (días de la semana y fecha final): se generan actividades independientes que se editan una a una. Gestión: **editar**, **cancelar** (queda visible como «Cancelada» y puede reactivarse) y **eliminar** (borrado lógico, con confirmación) |
| DEC-45 | **Convocatoria** (definido el 2026-10-19, spec 3). Se crea desde una actividad próxima y no cancelada (una por actividad) y queda **abierta de inmediato**, sin borrador. Convocados: se eligen **grupos** (sus jugadores activos) y se pueden **quitar jugadores** o **sumar jugadores de cualquier grupo** (por ejemplo, un 2018 en un amistoso de 2017); cada convocado queda en la **lista de un grupo convocado** y cada lista tiene **su enlace** (DEC-31); sin grupos, la convocatoria tiene una sola lista con su enlace. El mensaje se **genera** con los datos de la actividad, los convocados (nombre, inicial y apodo) y el enlace, y el owner puede escribir un **texto propio** (saludo y notas) que se guarda por lista; los datos de la actividad, los convocados y el enlace forman un **bloque generado no editable**, siempre actual. Se comparte **manualmente por WhatsApp**: el mensaje del grupo se **copia y se pega** en el grupo (ajuste del 2026-10-19: abrir WhatsApp sin un número no fue confiable en iOS y la API no envía a grupos), y **«Enviar al acudiente»**, que abre el chat del celular del acudiente (o del propio jugador sin acudientes) con un mensaje personal y el mismo enlace; sin celular, «Copiar». Si la actividad se **cancela o cambia** de fecha, hora o lugar con la convocatoria abierta, se ofrece un **mensaje de aviso** para copiar y pegar |
| DEC-46 | **Respuesta y seguimiento** (definido el 2026-10-21, specs 013 y 014). **Privacidad:** el acudiente solo ve la actividad y a sus jugadores, nunca las respuestas de otros; la lista completa (nombre e inicial) solo aparece para elegir por quién responde. **Hermanos:** un dispositivo reconocido ve a todos sus jugadores de la lista y responde por cada uno, con «¿Respondes por alguien más?» (vínculo nuevo pendiente). **Celular repetido:** si quien se identifica usa el celular de un acudiente de la academia, no se crea otra persona: el vínculo pendiente se asocia a ese acudiente (se conserva su nombre) y el owner ve la coincidencia. **Nombre al identificarse** (ajuste del 2026-10-21): se pide siempre, con el mismo formulario exista o no el celular (pedirlo solo a los nuevos revelaría qué celulares están registrados); basta un nombre, sin apellidos, con autocompletado; lo escrito queda como nombre declarado del dispositivo para que el owner lo compare al validar, y da nombre al acudiente nuevo, que el owner puede completar; con «Soy el jugador» no se pide. **El jugador que responde por sí mismo no es su acudiente** (ajuste del 2026-10-21): internamente se registra quién responde con un vínculo «el jugador», pero en la ficha se muestra aparte como «Responde él mismo · celular», sin editar y con «Quitar»; no cuenta como acudiente ni se ofrece en el selector, y «Enviar» usa el celular de su ficha o, si falta, el que escribió al responder. **Rechazo silencioso:** a quien fue rechazado se le trata como un dispositivo desconocido; nunca se le anuncia. **El owner responde en nombre del acudiente** desde el seguimiento, también tras el cierre: queda «registrada por el owner» y no consume los 3 cambios. **Enlace cerrado o cancelado:** muestra la actividad y la respuesta propia en modo lectura; un enlace inexistente, «ya no está disponible» sin datos. **Jugador quitado** tras responder: sale del conteo, queda en el historial y el acudiente ve «Ya no está convocado». **Seguimiento** en la sección «Convocatoria» de la actividad (totales, estado por jugador, historial, validar o rechazar) y «12/17» (confirmados sobre convocados) en la lista de actividades. La spec 4 de DEC-37 se divide en **013 (respuesta, seguimiento y validación)** y **014 (avisos en la aplicación)**. **Actualización en vivo** del seguimiento (DEC-41): aplazada; el seguimiento se actualiza al abrirlo, al volver a la pantalla y con «Actualizar» |
| DEC-47 | **Avisos en la aplicación** (definido el 2026-10-21, spec 014). El **contador**, en «Inicio» (ajuste del 2026-10-22: junto al aviso que abre «Por validar»), cuenta solo los acudientes y dispositivos **pendientes de validar** (exigen una acción); las respuestas nuevas no lo inflan. Las **respuestas nuevas** se cuentan **por convocatoria**, desde la última vez que el owner abrió esa actividad, y quedan vistas al abrirla; el inicio muestra un aviso por convocatoria con respuestas sin ver. **Validar desde el aviso**: «N acudientes por validar» abre un drawer con todos los pendientes de la academia **agrupados por persona** (ajuste del 2026-10-22: el mismo celular aparecía una vez por jugador): cada tarjeta muestra su celular, los vínculos nuevos que eligió y los jugadores que ya acompaña; «Validar» confirma el celular y todos sus vínculos nuevos, y «Rechazar» los descarta sin tocar los ya validados (la misma operación de HU-040). Se actualiza al navegar y al volver a la aplicación, sin actualización en vivo (DEC-46) |
| DEC-48 | **Aviso de inasistencia por excepción** (definido el 2026-10-23, spec 015; adelanta una parte de la asistencia de la Etapa 2). El owner marca en la cancha **solo a quien no llegó**, desde el inicio de la actividad hasta el final de ese día; a los demás se les asume presentes y no se registran. La lista son los convocados, si hay convocatoria (en competencia, primero los que dijeron «Sí»), o los jugadores activos de los grupos que el owner elige en el momento, si no la hay: los entrenamientos de rutina no necesitan convocatoria ni confirmación. «Avisar» abre WhatsApp al acudiente (o al jugador) con un mensaje sugerido y editable, que no se guarda, y deja el jugador «Avisado» con la hora. Aplica a entrenamientos y competencias. **Fuera**: lista de presentes, historial, porcentajes, reportes y el rol de entrenador (Etapa 2 y EP-11) |
| DEC-49 | **Documentos legales en la aplicación** (definido el 2026-10-25, spec 016; HU-043). Los Términos y Condiciones y la Política de Tratamiento de Datos se leen en un **dialog**, sin salir del formulario, en el registro, en la autorización del acudiente de la ficha del jugador y en la respuesta pública de la convocatoria; en el celular ocupa toda la pantalla. Leer no acepta: la casilla sigue siendo un paso aparte. **Un archivo por versión**: cada documento es un HTML estático del frontend en `/legal/<tipo>/<versión>.html` y `legal_documents.url` apunta ahí; una versión publicada no se modifica y un cambio de texto se publica como versión nueva. La versión vigente pasa a `2026-10-v2`; la `2026-10-v1` (URL provisional que nunca existió) queda como historial de las cuentas de prueba. El texto inicial es un **borrador base** para Colombia (Ley 1581 de 2012 y Decreto 1377 de 2013), cuyo responsable es la persona natural que opera la marca (ajuste del 2026-10-25: sin razón social aún; nombre, domicilio, correo y teléfono, como pide el artículo 13 del Decreto 1377 de 2013, sin número de cédula). Cuando exista la sociedad, se publica una versión nueva con ella como responsable y se informa a los usuarios del cambio. La academia es responsable de los datos de jugadores y acudientes y PlayerTech, encargada; de los datos de la cuenta del owner, PlayerTech es responsable. Lo revisa un abogado antes de cargar datos reales |
| DEC-42 | **Jugador ya registrado**: no se registra otro jugador no eliminado con los mismos nombres, apellidos y fecha de nacimiento (sin distinguir mayúsculas, tildes ni espacios sobrantes). Se muestra «Este jugador ya está registrado» con sus datos y la opción de **actualizar sus datos** con los recién escritos (o de reactivarlo y actualizarlo, si está inactivo). Un jugador eliminado no bloquea |
| DEC-37 | Orden de construcción en **cuatro specs**, una por tramo del flujo: (1) jugadores, acudientes y grupos; (2) actividades y catálogo de canchas; (3) convocatoria, enlaces por acudiente y mensaje de WhatsApp; (4) respuesta del acudiente y seguimiento (dividida en las specs 013 y 014 por DEC-46) |

### Consecuencias
- Las tablas nuevas siguen las reglas de ADR-012 (`academy_id`, RLS, auditoría, borrado lógico) y ADR-017 (portabilidad).
- La respuesta sin cuenta exige una vía de acceso pública y acotada por el enlace del grupo, sin exponer otros datos. Su diseño (por ejemplo, funciones de base de datos que validan el enlace, el recuerdo del dispositivo y el límite de cambios) se decide en el plan de la spec 4 y debe pasar las pruebas de aislamiento.
- La identificación del acudiente no es una autenticación fuerte: la protegen el enlace secreto que caduca, la inicial del apellido y la **validación del owner** de cada vínculo nuevo. Un código por SMS o WhatsApp queda como mejora futura (requiere la API oficial). Se registra como riesgo aceptado en `docs/engineering/security.md` (SEC-03).

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
- `docs/architecture/database-schema.md` — Modelo de datos (Fase 1 vigente)
- `docs/architecture/supabase.md` — Persistencia, autenticación y RLS
- `docs/constitution.md` — Principios generales
