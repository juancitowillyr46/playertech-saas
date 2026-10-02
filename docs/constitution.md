# PlayerTech Constitution

## Propósito

Define los principios fundamentales e irrevocables que gobiernan PlayerTech.

Cada especificación, decisión arquitectónica e implementación debe respetar estos principios.

---

## Principios Fundamentales

### I. Spec-Driven Development

**OBLIGATORIO:**
- Toda funcionalidad significativa comienza con una Historia de Usuario
- Antes de implementar, escribir especificación (spec.md)
- Especificación define criterios de aceptación en formato BDD (Given/When/Then)
- Especificación referencia ADRs aplicables

**FLUJO:**
```
Historia de Usuario → Especificación → Plan Técnico → Tareas → Implementación → Pruebas
```

**PERMITIDO:**
- Features muy pequeñas (< 20 líneas) con documentación mínima
- Refactors internos sin cambio de comportamiento

**PROHIBIDO:**
- Implementar sin especificación previa
- Especificación sin criterios de aceptación claros
- Código sin trazabilidad a Historia de Usuario

---

### II. Simplicidad

**OBLIGATORIO:**
- Implementar solo lo necesario para resolver la necesidad actual
- Usar librerías y patrones ya adoptados antes de crear propios
- Evitar abstracciones sin caso de uso presente

**PERMITIDO:**
- Refactorizar cuando complejidad obstaculiza desarrollo
- Duplicación hasta 2 ocurrencias

**PROHIBIDO:**
- Introducir complejidad por necesidades hipotéticas
- Patrones "porque es good practice"
- Abstracciones prematuras

---

### III. Separación de Responsabilidades

**OBLIGATORIO:**
- Componentes: renderizar UI + capturar input (SIN lógica de negocio)
- Servicios: orquestar datos + aplicar reglas de negocio (SIN acceso directo a BD)
- Repositorios: comunicar con backend (SIN lógica de negocio)
- Infraestructura: Supabase, HTTP, Config (SIN lógica de aplicación)

**ARQUITECTURA:**
```
Presentación → Lógica de Aplicación → Acceso a Datos → Infraestructura
```

**PERMITIDO:**
- Lógica simple en componentes si es trivial
- Transformación de datos en componentes si es menor a 5 líneas

**PROHIBIDO:**
- Query directo a Supabase desde componente
- Lógica de negocio en componentes
- Acceso a datos sin pasar por Repository

---

### IV. Reutilización Controlada

**OBLIGATORIO:**
- Antes de crear nuevo, buscar solución existente
- Documentar por qué no se reutiliza, si aplica

**REGLA DEL 2-3:**
- 1ª ocurrencia: permitida duplicación
- 2ª ocurrencia: considerar extracción
- 3ª ocurrencia: extracción OBLIGATORIA

**PERMITIDO:**
- Duplicación bajo regla 2-3
- Servicios pequeños especializados

**PROHIBIDO:**
- Componentes/servicios genéricos sin uso presente
- "Preparar para reutilización futura"

---

### V. Arquitectura Evolutiva

**OBLIGATORIO:**
- Diseño debe permitir migración de Supabase → API Symfony + MySQL
- Todas las tablas incluyen `academy_id` (preparación multi-tenancy)
- Repository Pattern implementado (abstracción de datos)
- Row Level Security (RLS) en tablas sensibles

**PERMITIDO:**
- Funcionalidad acoplada a Supabase en MVP
- Decisiones post-MVP no implementadas

**PROHIBIDO:**
- Decisiones que impidan evolución
- Queries SQL directas en frontend
- Lógica multi-tenancy en MVP (solo estructura)

---

### VI. Trazabilidad Completa

**OBLIGATORIO:**
- Cada Historia de Usuario en backlog
- Cada Historia tiene especificación (spec.md)
- Cada spec referencia ADRs aplicables
- Cada commit referencia Historia de Usuario
- Tests validan criterios de aceptación

**FLUJO TRAZABLE:**
```
Backlog (HU) → Spec → ADRs → Código → Tests → Commit
```

**PERMITIDO:**
- Features pequeñas con documentación mínima
- Refactors sin Historia de Usuario

**PROHIBIDO:**
- Código sin referencia a Historia de Usuario
- Cambios arquitectónicos sin ADR
- Tests sin criterios de aceptación

---

### VII. Autenticación y Autorización

**AUTENTICACIÓN (MVP):**
- OBLIGATORIO: Supabase Auth (email + password)
- PROHIBIDO: Sistema de autenticación propio
- PROHIBIDO: API keys en código
- OBLIGATORIO: Variables de entorno (.env.local)

**AUTORIZACIÓN (MVP):**
- OBLIGATORIO: Row Level Security (RLS) habilitado
- OBLIGATORIO: Validaciones de negocio en Service (no solo UI)
- PROHIBIDO: Confiar solo en validaciones frontend
- PROHIBIDO: Acceso directo a datos sin RLS

**TABLAS CON RLS OBLIGATORIO:**
- players, groups, activities, call_ups, responses

**PERMITIDO:**
- Acceso público por token temporal (call_ups para tutores)
- Bypassear RLS con justificación documentada

---

### VIII. Multi-tenancy (Preparación)

**MVP: SINGLE-TENANT operativo**

**OBLIGATORIO:**
- `academy_id` en todas las tablas con datos de usuario
- RLS filtra por `academy_id = auth.uid()`
- Cada admin gestiona UNA academia

**PERMITIDO:**
- Post-MVP: múltiples academias por plataforma
- Post-MVP: múltiples admins por academia

**PROHIBIDO:**
- Sistema de invitaciones en MVP
- Gestor centralizado de usuarios en MVP
- Facturación multi-tenant en MVP

**PREPARADO PERO NO IMPLEMENTADO:**
- Tabla `users` (en MVP: solo auth.uid)
- Rol-based access control (en MVP: admin único)

---

### IX. Calidad y Testing

**OBLIGATORIO:**
- Services: tests unitarios (cobertura 80%+ en lógica crítica)
- Componentes críticos (formularios, validaciones): tests
- Cada Historia de Usuario tiene casos de prueba
- Flujos principales validados (manual o E2E)

**PERMITIDO:**
- 60-80% code coverage en MVP
- Componentes simples sin tests
- QA manual para features de bajo riesgo

**PROHIBIDO:**
- Funcionalidad sin test de algún tipo
- Criterios de aceptación sin prueba asociada
- Validaciones de negocio sin test

---

### X. Documentación de Fuente Única

**OBLIGATORIO:**
- Cada concepto documentado en EXACTAMENTE UN lugar
- Referencias cruzadas a documentación, no duplicación
- Cada documento referencia sus dependencias

**FUENTES ÚNICAS:**
| Información | Ubicación | NO repetir |
|-------------|-----------|-----------|
| Visión del producto | docs/product/vision.md | README, specs, etc |
| Decisiones técnicas | docs/architecture/decisions.md | código, comentarios |
| Modelo de datos | docs/architecture/database-schema.md | código frontend |
| Estándares de código | docs/engineering/ | checklists, PRs |
| Histórico de cambios | Constitution + Changelog | documentos viejos |

**PERMITIDO:**
- Referencias a documentación oficial
- Ejemplos en documentación técnica

**PROHIBIDO:**
- Duplicar información entre docs
- Documentación desactualizada

---

### XI. Convención para GitHub Spec Kit

**ESTRUCTURA OBLIGATORIA:**

```
specs/<feature>/
├── spec.md          (QUÉ: funcionalidad)
├── plan.md          (CÓMO: decisiones técnicas)
└── tasks.md         (TAREAS: pasos de implementación)
```

**spec.md DEBE CONTENER:**
- Referencia: Historia de Usuario (HU-XXX)
- Criterios de aceptación (Given/When/Then)
- Reglas de negocio
- Fuera de alcance

**plan.md DEBE CONTENER:**
- ADRs aplicables
- Componentes a crear
- Cambios en BD
- Flujos técnicos

**tasks.md DEBE CONTENER:**
- Pasos concretos
- Checklist de implementación
- Criterios de compleción

**TRAZABILIDAD:**
```
Backlog (HU) → spec.md → plan.md (ADRs) → tasks.md → Commits
```

**PROHIBIDO:**
- Specs sin Historia de Usuario
- Specs sin criterios de aceptación
- Plan sin referencias a ADRs
- Tasks sin checklist

---

### XII. Excepciones Controladas

**PERMITIDO:**
- Apartarse de principio SI está explícitamente justificado
- Documentar: principio violado + justificación + fecha

**FORMATO DE EXCEPCIÓN:**
```markdown
## Excepción a Constitución

Principio: [Sección N]
Violación: [Qué se hizo]
Justificación: [Por qué fue necesario]
Documento: [PR #X, commit Y]
Revisión: [Fecha para evaluar si aplica aún]
```

**PERMITIDO:**
- Excepciones temporales ("refactor después")
- Excepciones por restricción técnica

**PROHIBIDO:**
- Excepciones "porque sí"
- Excepciones por conveniencia sin documentación
- Excepciones que se conviertan en norma sin actualizar Constitution

---

## Referencias

- **ADRs**: docs/architecture/decisions.md
- **Database**: docs/architecture/database-schema.md
- **Engineering**: docs/engineering/
- **Product**: docs/product/
- **Backlog**: docs/backlog/
- **Specs**: specs/

---

## Cambios a la Constitución

| Versión | Fecha | Cambio |
|---------|-------|--------|
| 1.0 | 2024-10-02 | Creación (versión extensa) |
| 2.0 | 2024-10-02 | Refactor: declarativa, normativa, clara |
