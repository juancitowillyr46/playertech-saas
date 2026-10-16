# SDD y GitHub Spec Kit

## Propósito

Este documento resume cómo se relacionan **Spec-Driven Development (SDD)**, la documentación de PlayerTech y **GitHub Spec Kit**.

Su objetivo es servir como guía rápida para entender:

- qué artefacto se crea en cada etapa;
- qué pregunta responde cada artefacto;
- qué comando de Spec Kit participa;
- cómo se mantiene la trazabilidad desde una necesidad funcional hasta el código.

---

# 1. Mapa mental

```text
                         PLAYERTECH
                             │
                             ▼
                  ┌─────────────────────┐
                  │     CONSTITUTION    │
                  │        RULES         │
                  │   Principios estables│
                  └──────────┬──────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ PRODUCT CONTEXT│
                    │ Qué es el      │
                    │ producto       │
                    └───────┬────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
       ┌──────────────┐           ┌──────────────┐
       │   BACKLOG    │           │ ARCHITECTURE │
       │ Qué queremos │           │ Cómo está    │
       │ construir    │           │ estructurado │
       └───────┬──────┘           └──────────────┘
               │
               ▼
        ┌──────────────┐
        │     HU       │
        │ Necesidad    │
        │ funcional    │
        └───────┬──────┘
                │
                ▼
       ┌─────────────────┐
       │   SPECIFICATION │
       │      WHAT       │
       │ Qué debe hacer  │
       └────────┬────────┘
                │
                │ /speckit.clarify
                ▼
       ┌─────────────────┐
       │     CLARIFY     │
       │ Resolver dudas  │
       │ y ambigüedades  │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │      PLAN       │
       │       HOW       │
       │ Cómo construirlo│
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │      TASKS      │
       │      WORK       │
       │ Qué trabajo     │
       │ realizar        │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │  IMPLEMENTATION │
       │       CODE      │
       │ Código + tests  │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │     VERIFY      │
       │ Validar contra  │
       │ la especificación│
       └─────────────────┘
```

---

# 2. Las cinco preguntas fundamentales

Una forma sencilla de memorizar SDD es asociar cada artefacto con una pregunta.

| Artefacto | Pregunta | Contenido |
|---|---|---|
| Constitution | **¿Qué reglas debemos respetar?** | Principios y reglas estables |
| HU / Backlog | **¿Qué necesita el usuario?** | Necesidad funcional |
| Spec | **¿Qué debe hacer el sistema?** | Comportamiento y criterios verificables |
| Plan | **¿Cómo lo vamos a construir?** | Diseño técnico |
| Tasks | **¿Qué trabajo debemos realizar?** | Tareas concretas |
| Implementation | **¿Qué código debemos escribir?** | Código y pruebas |

### Regla de oro

```text
CONSTITUTION = RULES
HU           = NEED
SPEC         = WHAT
PLAN         = HOW
TASKS        = WORK
CODE         = IMPLEMENTATION
TESTS        = VERIFY
```

---

# 3. Flujo SDD + GitHub Spec Kit

```text
                    IDEA / NECESIDAD
                           │
                           ▼
                  PRODUCT / BACKLOG
                           │
                           ▼
                    USER STORY
                           │
                           │
                    /speckit.specify
                           │
                           ▼
                     ┌──────────┐
                     │  SPEC.md │
                     └────┬─────┘
                          │
                          │
                   ¿Hay ambigüedades?
                          │
                    ┌─────┴─────┐
                    │           │
                   Sí          No
                    │           │
                    ▼           │
            /speckit.clarify    │
                    │           │
                    └─────┬─────┘
                          │
                          ▼
                     /speckit.plan
                          │
                          ▼
                     ┌──────────┐
                     │ PLAN.md  │
                     └────┬─────┘
                          │
                          ▼
                     /speckit.tasks
                          │
                          ▼
                    ┌───────────┐
                    │ TASKS.md  │
                    └─────┬─────┘
                          │
                          ▼
                  /speckit.implement
                          │
                          ▼
                    ┌───────────┐
                    │   CODE    │
                    │   TESTS   │
                    └─────┬─────┘
                          │
                          ▼
                       VERIFY
```

---

# 4. ¿Dónde vive cada cosa en PlayerTech?

```text
playertech-saas/
│
├── .specify/
│   └── memory/
│       └── constitution.md
│
├── docs/
│   │
│   ├── constitution.md
│   │
│   ├── product/
│   │   └── ...
│   │
│   ├── backlog/
│   │   ├── epics/
│   │   └── user-stories/
│   │       └── HU-001-admin-login.md
│   │
│   ├── architecture/
│   │   └── ...
│   │
│   └── engineering/
│       └── ...
│
├── specs/
│   └── 001-admin-login/
│       ├── spec.md
│       ├── plan.md
│       └── tasks.md
│
├── frontend/
│   └── ...
│
└── backend/
    └── ...
```

---

# 5. Relación entre documentación y SDD

No toda la documentación del proyecto es una `spec`.

```text
                    DOCUMENTACIÓN
                         │
        ┌────────────────┼─────────────────┐
        │                │                 │
        ▼                ▼                 ▼
     PRODUCT        ARCHITECTURE       ENGINEERING
     Qué es         Cómo funciona      Cómo trabajamos
        │                │                 │
        └────────────────┼─────────────────┘
                         │
                         ▼
                       BACKLOG
                         │
                         ▼
                         HU
                         │
                         ▼
                       SPEC
                         │
                         ▼
                       PLAN
                         │
                         ▼
                       TASKS
                         │
                         ▼
                       CODE
```

La documentación permanente explica **el conocimiento del proyecto**.

Los artefactos de `specs/` describen **el trabajo concreto que se está construyendo**.

---

# 6. Constitution vs Architecture vs Spec

Estas tres piezas pueden confundirse fácilmente.

## Constitution

Define reglas que deberían mantenerse durante la evolución del proyecto.

Ejemplos:

- desarrollar guiándose por especificaciones;
- mantener separación de responsabilidades;
- favorecer reutilización;
- mantener trazabilidad;
- evitar complejidad innecesaria.

```text
Constitution
     │
     └── "Debemos trabajar de esta manera"
```

---

## Architecture

Define las decisiones estructurales del sistema.

Ejemplos:

- Angular;
- organización `core / shared / features`;
- patrón Service → Repository → Data Access;
- Supabase durante el MVP;
- posibilidad de evolucionar hacia una API.

```text
Architecture
     │
     └── "El sistema está estructurado de esta manera"
```

---

## Specification

Define el comportamiento de una funcionalidad concreta.

Ejemplo:

```text
HU-001
   │
   ▼
specs/001-admin-login/spec.md
```

La especificación responde:

> ¿Qué comportamiento debe tener el login?

No pretende convertirse en una copia de toda la arquitectura del proyecto.

---

# 7. Ejemplo con HU-001 — Admin Login

## HU

```text
Como administrador,
quiero iniciar sesión con mi correo y contraseña,
para acceder a la gestión de mi academia.
```

La HU expresa la **necesidad**.

---

## Spec

La especificación puede definir:

```text
Login
 │
 ├── Email requerido
 ├── Password requerido
 ├── Credenciales válidas
 │      └── acceso permitido
 │
 ├── Credenciales inválidas
 │      └── mostrar error
 │
 └── Usuario no autenticado
        └── impedir acceso privado
```

También puede definir comportamientos observables de la interfaz:

```text
Estado inicial
      │
      ▼
Usuario ingresa credenciales
      │
      ▼
Submitting
      │
 ┌────┴─────┐
 ▼          ▼
Success    Error
 │          │
 ▼          ▼
Acceso     Mensaje
```

La spec describe **qué debe observar el usuario**, no necesariamente qué componente técnico se utilizará.

---

# 8. Plan técnico

El `plan.md` traduce la especificación a decisiones técnicas.

Por ejemplo:

```text
spec.md
   │
   │ ¿Cómo lo implementamos?
   ▼
plan.md
```

Para HU-001 podría definir:

```text
Angular
   │
   ▼
LoginComponent
   │
   ▼
AuthService
   │
   ▼
AuthRepository
   │
   ▼
Supabase Auth
```

Y decisiones como:

- Angular Reactive Forms;
- PrimeNG para componentes de UI;
- Tailwind para composición visual;
- Supabase Auth;
- AuthGuard;
- manejo de sesión;
- traducción de errores técnicos a errores de negocio;
- estrategia de pruebas.

---

# 9. Ejemplo: error de Supabase

La separación puede verse así:

### HU

```text
Credenciales inválidas
→ el acceso debe ser rechazado
→ mostrar un mensaje al usuario
```

### Spec

```text
Cuando la autenticación falla por credenciales inválidas:

- no se permite el acceso;
- el usuario permanece en el login;
- se muestra un mensaje comprensible;
- no se muestran detalles técnicos del proveedor.
```

### Plan

```text
Supabase Auth
     │
     ▼
AuthRepository
     │
     ▼
AuthErrorMapper
     │
     ▼
Application Error
     │
     ▼
UI
     │
     ▼
PrimeNG Message
```

De esta manera:

```text
SPEC
  ↓
comportamiento observable

PLAN
  ↓
implementación técnica
```

---

# 10. Trazabilidad completa

Uno de los objetivos principales de SDD es poder responder:

> ¿Por qué existe este código?

La trazabilidad esperada es:

```text
Necesidad
   │
   ▼
Epic
   │
   ▼
User Story
   │
   ▼
Specification
   │
   ▼
Plan
   │
   ▼
Task
   │
   ▼
Code
   │
   ▼
Test
```

Ejemplo:

```text
EP-01
 │
 └── HU-001
       │
       └── specs/001-admin-login/spec.md
              │
              └── plan.md
                    │
                    └── tasks.md
                          │
                          ├── LoginComponent
                          ├── AuthService
                          ├── AuthRepository
                          ├── AuthGuard
                          └── Tests
```

---

# 11. ¿Qué hace realmente GitHub Spec Kit?

GitHub Spec Kit no reemplaza la arquitectura ni la documentación del proyecto.

Es una herramienta para **operacionalizar SDD**.

```text
SDD
 │
 │ metodología
 ▼
GitHub Spec Kit
 │
 │ herramientas / comandos
 ▼
Artefactos
 │
 ├── spec.md
 ├── plan.md
 └── tasks.md
 │
 ▼
Implementación
```

En otras palabras:

> **SDD es la forma de trabajar. Spec Kit ayuda a ejecutar ese proceso de manera estructurada.**

---

# 12. Comandos principales de Spec Kit

| Comando | Propósito | Resultado |
|---|---|---|
| `/speckit.constitution` | Definir principios | Constitution |
| `/speckit.specify` | Definir funcionalidad | `spec.md` |
| `/speckit.clarify` | Resolver ambigüedades | Spec refinada |
| `/speckit.plan` | Diseñar implementación | `plan.md` |
| `/speckit.tasks` | Descomponer trabajo | `tasks.md` |
| `/speckit.implement` | Implementar | Código |
| `/speckit.analyze` | Revisar consistencia | Hallazgos |

> Los comandos disponibles pueden variar según la versión/configuración de Spec Kit.

---

# 13. Regla práctica para PlayerTech

Antes de escribir código, deberíamos poder recorrer:

```text
¿Existe una necesidad?
        │
        ▼
¿Está en el backlog?
        │
        ▼
¿Existe una HU?
        │
        ▼
¿Está especificado?
        │
        ▼
¿Las ambigüedades están resueltas?
        │
        ▼
¿Existe un plan técnico?
        │
        ▼
¿Existen tareas?
        │
        ▼
IMPLEMENTAR
```

Si una decisión pertenece a todo el proyecto:

```text
→ Constitution
→ Architecture
→ Engineering
```

Si pertenece a una funcionalidad:

```text
→ HU
→ Spec
→ Plan
→ Tasks
```

---

# 14. La fórmula para memorizar

```text
                 SDD
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
     PRODUCT             ENGINEERING
        │                   │
        ▼                   ▼
       HU              CONSTITUTION
        │              ARCHITECTURE
        │              ENGINEERING DOCS
        ▼
      SPEC
      WHAT
        │
        ▼
      PLAN
      HOW
        │
        ▼
      TASKS
      WORK
        │
        ▼
      CODE
      IMPLEMENT
        │
        ▼
      TEST
      VERIFY
```

## Frase de referencia

> **Constitution define las reglas.  
> La HU define la necesidad.  
> La Spec define qué debe hacer.  
> El Plan define cómo construirlo.  
> Las Tasks definen el trabajo.  
> La implementación produce el código.  
> Los Tests verifican que el código cumple la Spec.**

---

# 15. Flujo completo de trabajo en PlayerTech

```text
                    PLAYERTECH
                        │
                        ▼
                 PRODUCT VISION
                        │
                        ▼
                     BACKLOG
                        │
                        ▼
                  USER STORY
                        │
                        ▼
               /speckit.specify
                        │
                        ▼
                     SPEC.md
                        │
                        ▼
               /speckit.clarify
                        │
                        ▼
                 SPEC REFINADA
                        │
                        ▼
                 /speckit.plan
                        │
                        ▼
                     PLAN.md
                        │
                        ▼
                 /speckit.tasks
                        │
                        ▼
                    TASKS.md
                        │
                        ▼
               /speckit.implement
                        │
                        ▼
                  IMPLEMENTACIÓN
                        │
                        ▼
                       TESTS
                        │
                        ▼
                    VALIDACIÓN
                        │
                        ▼
                  FEATURE LISTA
```

Este flujo permite que PlayerTech evolucione manteniendo una relación clara entre **producto → requisitos → especificación → arquitectura → código → pruebas**.
