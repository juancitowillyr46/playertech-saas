# PlayerTech Constitution (Versión completa)

## Propósito

Esta Constitución define los principios fundamentales que gobiernan el desarrollo y evolución de PlayerTech.

Las especificaciones, decisiones arquitectónicas e implementaciones deben respetar estos principios.

Los detalles técnicos y procedimientos se mantienen en la documentación especializada del proyecto.

Esta Constitución es el documento de referencia para:
- Decisiones arquitectónicas (ADRs)
- Estándares de ingeniería
- Procesos de desarrollo
- GitHub Spec Kit

---

## I. Desarrollo guiado por especificaciones

Las funcionalidades significativas deben desarrollarse mediante un proceso Spec-Driven Development (SDD).

```text
Historia de Usuario (Backlog)
        ↓
Especificación Funcional (spec.md)
        ↓
Plan Técnico (plan.md)
        ↓
Tareas de Implementación (tasks.md)
        ↓
Implementación (código)
        ↓
Pruebas (unitarias + integración)
```

### Principios SDD

**Cada funcionalidad significativa debe:**
- Tener una Historia de Usuario clara en el backlog
- Contar con una especificación que defina comportamiento esperado
- Incluir un plan técnico con decisiones arquitectónicas
- Listar tareas concretas para implementación
- Estar completamente testeada

**La especificación es fuente de verdad:**
- Antes de implementar, escribir spec
- Spec define criterios de aceptación (BDD format)
- Spec referencia Historia de Usuario e ADRs aplicables
- Implementación no debe desviarse de spec sin justificación documentada

---

## II. Simplicidad

La solución debe implementar la complejidad necesaria para resolver la necesidad actual del producto.

No se debe introducir complejidad, abstracciones o infraestructura únicamente por necesidades hipotéticas futuras.

### Aplicación práctica

**En el MVP:**
- Usar Supabase, no backend propio
- PrimeNG out-of-the-box, no componentes custom innecesarios
- Repository Pattern simple, no Domain-Driven Design completo
- 60-80% test coverage, no 100% obsesionante

**Refactorizar cuando:**
- Complejidad obstaculiza desarrollo
- Patrón se repite en 3+ lugares
- Cambio requiere modificar múltiples archivos
- Código supera 30 líneas / 5 responsabilidades

**No refactorizar por:**
- "Buena práctica teórica"
- "Podría necesitarse en futuro"
- "Es más elegante"

---

## III. Separación de responsabilidades

La solución debe mantener separadas las responsabilidades de:

- **Presentación** (Components): renderizar, capturar input, mostrar datos
- **Lógica de Aplicación** (Services): orquestar datos, aplicar reglas negocio
- **Acceso a Datos** (Repositories): comunicar con backend (Supabase/API)
- **Infraestructura** (HTTP, Supabase, Config): detalles técnicos

Las dependencias entre capas deben ser explícitas y controladas.

### Arquitectura de capas

```
┌─────────────────────────────────────────┐
│   Presentación (Components)             │
│   - Renderizar UI                       │
│   - Capturar eventos                    │
│   - Llamar servicios                    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│   Lógica de Aplicación (Services)       │
│   - Orquestar datos                     │
│   - Reglas de negocio                   │
│   - Manejo de estado                    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│   Acceso a Datos (Repositories)         │
│   - Interfaz abstracta                  │
│   - Implementación Supabase/HTTP        │
│   - Transformaciones de datos           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│   Infraestructura                       │
│   - Supabase Client (MVP)               │
│   - HttpClient (futuro)                 │
│   - Configuración                       │
└─────────────────────────────────────────┘
```

### Violaciones prohibidas

❌ **Query directo en component a Supabase**
```typescript
// MAL
ngOnInit() {
  this.supabase.from('players').select().then(...);
}
```

❌ **Lógica de presentación en servicio**
```typescript
// MAL
playerService.createAndFormatUIAndShowNotification() { ... }
```

❌ **Validaciones de negocio solo en UI**
```typescript
// MAL: validación solo en FormValidator
// BIEN: validación en Service/Model, también en UI
```

---

## IV. Reutilización

Antes de crear una nueva solución, se debe evaluar si existe una solución reutilizable dentro de:

- La arquitectura existente
- Componentes compartidos (shared/)
- Librerías adoptadas (PrimeNG, Angular, RxJS)
- Patrones establecidos en el proyecto

La reutilización **no debe justificar abstracciones prematuras**.

### Regla del 2-3

- **1ª ocurrencia:** dejar como está (permitida duplicación)
- **2ª ocurrencia:** considerar extracción
- **3ª ocurrencia:** extracción OBLIGATORIA

### Dónde reutilizar

| Tipo | Ubicación |
|------|-----------|
| Componentes visuales | `shared/components/` |
| Modelos compartidos | `shared/models/` |
| Utilidades | `shared/utils/` |
| Servicios globales | `core/services/` |
| Pipes/Directives | `shared/pipes/`, `shared/directives/` |

---

## V. Evolución

El MVP debe permitir la evolución del producto sin requerir reconstrucciones innecesarias.

Las decisiones actuales deben evitar acoplamientos que dificulten la evolución hacia:

- **APIs REST**: migrar de Supabase a backend propio
- **Backend Symfony + MySQL**: tecnología elegida para post-MVP
- **Multi-tenancy completo**: múltiples academias en plataforma
- **Soporte multi-sport**: fútbol, vóley, básquet, etc.

Las necesidades futuras **no deben convertirse en funcionalidades prematuras**.

### Decisiones preparadas para evolución

✅ **Repository Pattern** → permite cambiar Supabase por API sin afectar features

✅ **academy_id en todas las tablas** → preparado para multi-tenant

✅ **Modelos independientes de UI** → lógica reusable en futuro backend

✅ **RLS en Supabase** → aislamiento de datos listo para multi-tenant

### Lo que SÍ hacemos en MVP

- Repository abstract
- Foreign keys academy_id
- RLS policies configuradas
- Modelos de negocio claros

### Lo que NO hacemos en MVP

- ❌ Multi-tenant completo (administración multi-org)
- ❌ Sistema de roles/permisos avanzado
- ❌ Caché distribuido
- ❌ Eventos de dominio
- ❌ CQRS o Event Sourcing

---

## VI. Trazabilidad

Las decisiones de desarrollo deben mantener una relación verificable entre:

```text
Producto (Visión)
   ↓
Historia de Usuario (Backlog)
   ↓
Especificación (SDD - spec.md)
   ↓
Arquitectura (ADRs)
   ↓
Implementación (Código + Tests)
   ↓
Commits Git
```

### Cada nivel complementa sin duplicar

| Nivel | Fuente de verdad | No duplica |
|-------|------------------|-----------|
| Producto | `docs/product/` | visión general |
| Backlog | `docs/backlog/` | QUÉ hacer (historias + AC) |
| Especificación | `specs/<feature>/spec.md` | funcionalidad detallada |
| Arquitectura | `docs/architecture/` + ADRs | decisiones técnicas |
| Implementación | Código + tests | HOW (cómo se codifica) |
| Control | Git commits | trazabilidad temporal |

### Trazabilidad en práctica

```
HU-002: Registrar jugador
    ↓ (referencia en)
specs/players/spec.md
    ↓ (utiliza arquitectura de)
ADR-002: Repository Pattern
ADR-003: PrimeNG para UI
    ↓ (implementado mediante)
features/players/services/player.service.ts
features/players/repositories/player.repository.ts
features/players/components/player-form/...
    ↓ (validado por)
player.service.spec.ts
    ↓ (commit)
feat: HU-002 add player registration
```

---

## VII. Autenticación y Autorización

PlayerTech utiliza **Supabase Auth** para autenticación y **Row Level Security (RLS)** para autorización.

### Autenticación

**MVP v1:**
- ✅ Email + contraseña (Supabase Auth)
- ✅ Gestión de sesiones (Supabase)
- ❌ Recuperación de contraseña (fuera de alcance)
- ❌ Multi-factor authentication (fuera de alcance)
- ❌ Proveedores externos (fuera de alcance)

**Responsabilidades:**

| Componente | Responsabilidad |
|-----------|------------------|
| Supabase Auth | Validar credenciales, gestionar tokens, sesiones |
| Frontend Auth Guard | Proteger rutas privadas |
| Frontend Interceptor | Adjuntar token a requests |
| Database RLS | Filtrar datos por usuario/academy |

### Autorización

**MVP v1: Modelo simple**

Un admin por academia. El admin puede:
- Ver todos los datos de su academia
- Crear/actualizar/eliminar jugadores, actividades, convocatorias
- Ver respuestas de tutores

Los tutores:
- Acceden sin autenticación (token temporal)
- Solo pueden responder convocatorias
- Una respuesta es inmutable

**Modelo futuro:** Roles y permisos avanzados (fuera de MVP)

### Row Level Security (RLS)

Todas las tablas sensibles tienen RLS habilitado:

```sql
-- Ejemplo: admin solo ve sus jugadores
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_view_own_players"
ON players FOR SELECT
TO authenticated
USING (academy_id = auth.uid());
```

**RLS es OBLIGATORIO en:**
- ✅ `players`
- ✅ `groups`
- ✅ `activities`
- ✅ `call_ups` (parcial: admin autenticado, tutor por token)
- ✅ `responses`

**Validación en capas:**

```
Frontend validation (UX)
    +
RLS en base de datos (Seguridad)
    ↓
Datos filtrados automáticamente
```

### Seguridad de datos sensibles

**Prohibido:**
- ❌ API keys en código
- ❌ Service role keys en frontend
- ❌ Almacenar contraseñas propias (usar Supabase Auth)
- ❌ Confiar solo en validaciones frontend

**Requerido:**
- ✅ Usar variables de entorno (.env.local)
- ✅ RLS policies bien definidas
- ✅ Validaciones en backend (vía RLS)
- ✅ Contraseñas hasheadas (Supabase lo hace)

---

## VIII. Multi-tenancy (Preparación)

PlayerTech está **preparado arquitectónicamente** para multi-tenancy, pero **solo una academia activa en MVP v1**.

### MVP v1: Single-tenant operativo

```
┌─────────────────┐
│ Admin A         │
├─────────────────┤
│ Academia A      │
│ - Jugadores     │
│ - Actividades   │
│ - Convocatorias │
└─────────────────┘
```

### Estructura preparada para multi-tenant

```
Cada tabla tiene academy_id:

players.academy_id
groups.academy_id
activities.academy_id
call_ups.activity_id → activities.academy_id
```

### Evolución a multi-tenant (Post-MVP)

**Fase 1: Administración multi-academia**
- Tabla `users` (múltiples admins posibles)
- Tabla `user_academy` (relación N:N)
- RLS: verificar `user_academy` en lugar de solo `auth.uid()`

**Fase 2: Portal SaaS**
- Onboarding de nuevas academias
- Gestión de suscripciones
- Configuración por academia

**Fase 3: Datos completamente aislados**
- Backup por academy
- Cumplimiento de GDPR (cada academy controla sus datos)

### Decisiones de MVP que facilitan multi-tenant

✅ `academy_id` en todas las tablas
✅ RLS policies por academy
✅ Repository pattern (no acoplamiento a Supabase)
✅ Modelos de negocio agnósticos

### Decisiones que NO hacemos en MVP

❌ Sistema de invitaciones para múltiples admins
❌ Gestión centralizada de usuarios
❌ Facturación multi-tenant
❌ Configuración por academy

---

## IX. Calidad

La calidad debe evaluarse principalmente mediante **comportamiento verificable**.

Las funcionalidades deben contar con criterios de aceptación claros y pruebas apropiadas para su nivel de riesgo.

### Estándar de calidad para MVP

**Services (Business Logic):**
- ✅ Tests unitarios obligatorios
- ✅ Coverage 80%+ en lógica crítica
- ✅ Casos edge testados

**Componentes (UI):**
- ✅ Componentes críticos (formularios, validaciones): tests
- ✅ Componentes simples: QA manual
- ✅ No es necesario 100% coverage

**Flujos principales (E2E):**
- ✅ Login → crear jugador → crear actividad → convocatoria → respuesta
- ✅ Pruebas manuales o automated

**Código general:**
- ✅ Clean Code aplicado
- ✅ Nombres descriptivos
- ✅ Métodos pequeños (<30 líneas)
- ✅ Sin lógica muerta

### No es necesario en MVP

❌ 100% code coverage
❌ Tests de cada getter/setter
❌ Tests de componentes visuales triviales
❌ Performance tunning exhaustivo

### Criterios de aceptación (BDD)

Cada Historia de Usuario tiene criterios en formato Given/When/Then:

```gherkin
Given que el administrador tiene credenciales válidas,
When intenta iniciar sesión,
Then el sistema lo autentica y lo redirige al dashboard.
```

---

## X. Documentación como fuente de conocimiento

La información del proyecto debe mantenerse en la documentación correspondiente.

**No se debe duplicar información cuando pueda existir una única fuente de verdad.**

### Estructura de documentación

| Documento | Propósito | Ubicación |
|-----------|-----------|-----------|
| **Constitution** | Principios fundamentales | `docs/constitution-daft.md` |
| **Visión** | Qué es PlayerTech | `docs/product/vision.md` |
| **Alcance** | Qué entra en MVP v1 | `docs/product/scope.md` |
| **Glosario** | Vocabulario compartido | `docs/product/glossary.md` |
| **Roadmap** | Evolución del producto | `docs/product/roadmap.md` |
| **Backlog** | Épicas + Historias de Usuario | `docs/backlog/` |
| **Architecture** | Decisiones técnicas (ADRs) | `docs/architecture/decisions.md` |
| **Database** | Schema y modelo de datos | `docs/architecture/database-schema.md` |
| **Engineering** | Estándares de código | `docs/engineering/` |
| **Specifications** | Funcionalidades concretas | `specs/<feature>/` |

### Cómo referenciar

**Cada documento referencia sus dependencias:**

```markdown
# HU-002: Registrar jugador

**Épica:** EP-02 Gestión de jugadores
**Alcance:** docs/product/scope.md
**Glosario:** docs/product/glossary.md (Player, Academy)
**Arquitectura:** docs/architecture/decisions.md (ADR-002, ADR-004)
**Database:** docs/architecture/database-schema.md (tabla players)
**Estándares:** docs/engineering/frontend-clean-architecture.md
```

### Single Source of Truth

| Información | Fuente única | No repetir |
|-------------|--------------|-----------|
| Visión del producto | `docs/product/vision.md` | No en README, specs, etc |
| Decisiones técnicas | ADRs en `decisions.md` | No en código/comentarios |
| Modelos de datos | `database-schema.md` | No en código frontend |
| Estándares de código | `docs/engineering/` | No en PRs/checklists |

---

## XI. Convención para GitHub Spec Kit

PlayerTech utiliza **GitHub Spec Kit** para orquestar SDD.

### Estructura de especificaciones

```
specs/
├── auth/
│   ├── spec.md           # QUÉ: funcionalidad
│   ├── plan.md           # CÓMO: decisiones técnicas
│   └── tasks.md          # TAREAS: pasos de implementación
├── players/
│   ├── spec.md
│   ├── plan.md
│   └── tasks.md
└── call-ups/
    ├── spec.md
    ├── plan.md
    └── tasks.md
```

### Contenido esperado en cada archivo

**spec.md:**
- Referencia a Historia de Usuario (HU-XXX)
- Descripción funcional
- Criterios de aceptación (Given/When/Then)
- Reglas de negocio
- Casos de uso
- Fuera de alcance

**plan.md:**
- Decisiones arquitectónicas aplicables (ADRs)
- Componentes a crear
- Servicios necesarios
- Modelos de datos
- Cambios en BD (migraciones)
- Flujos técnicos

**tasks.md:**
- Pasos concretos
- Checklist de implementación
- Pruebas a escribir
- Commits esperados
- Criterios de compleción

### Trazabilidad en Spec Kit

```
Backlog (HU-002)
    ↓ (referencia)
specs/players/spec.md
    ↓ (implementa)
specs/players/plan.md (Architecture + ADRs)
    ↓ (ejecuta)
specs/players/tasks.md (Pasos concretos)
    ↓ (evidencia)
Commits en Git + PRs + Tests
```

---

## XII. Excepciones

Cuando una implementación necesite apartarse de un principio de esta Constitución, la excepción debe estar **explícitamente justificada y documentada**.

Una excepción no modifica automáticamente la Constitución.

### Cómo documentar una excepción

**En un commit o PR:**

```markdown
## Excepción a Constitución

**Principio:** Separación de responsabilidades (Sección III)

**Violación:** Lógica de negocio directa en component

**Justificación:**
- Feature pequeña (50 líneas)
- Temporal: refactor después en próximo sprint
- No afecta otras features

**Documento:** PR #42, fecha 2024-10-15

**Próxima revisión:** Sprint 3
```

### Tipos de excepciones válidas

✅ **Temporales:** "refactor después"
✅ **Costo-beneficio:** "simple feature, cost de refactor no justificado"
✅ **Restricción técnica:** "Supabase no permite, implementar workaround"
❌ **Teoría:** "la teoría lo exige, pero aquí no"

---

## Documentación relacionada

Los detalles de implementación y las prácticas específicas se encuentran en:

- `docs/architecture/decisions.md` — Architecture Decision Records (ADRs)
- `docs/architecture/database-schema.md` — Modelo de datos
- `docs/architecture/supabase-migrations-guide.md` — Versionado de BD
- `docs/engineering/frontend-clean-architecture.md` — Estructura Angular pragmática
- `docs/engineering/coding-standards.md` — Estándares de código
- `docs/engineering/git.md` — Workflow Git
- `docs/engineering/testing.md` — Estrategia de pruebas
- `docs/engineering/security.md` — Prácticas de seguridad
- `docs/product/` — Visión, alcance, glosario, roadmap
- `docs/backlog/` — Épicas e historias de usuario
- `specs/` — Especificaciones por feature (Spec Kit)

---

## Versión y cambios

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 2024-10-02 | Creación inicial |
| 1.1 | 2024-10-02 | Agregar Auth/Authz, Multi-tenancy, Spec Kit |

