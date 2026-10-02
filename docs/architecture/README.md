# PlayerTech — Architecture

## Propósito

Este directorio contiene las decisiones y definiciones arquitectónicas de PlayerTech.

La arquitectura está orientada al desarrollo del MVP v1, buscando mantener una base simple para avanzar rápidamente sin generar un acoplamiento innecesario con las tecnologías utilizadas temporalmente.

## Documentos

| Documento | Propósito |
|---|---|
| [system.md](./system.md) | Vista general de la arquitectura y sus principales componentes |
| [frontend.md](./frontend.md) | Estructura y organización de la aplicación Angular |
| [data.md](./data.md) | Arquitectura de acceso y abstracción de datos |
| [ui.md](./ui.md) | Arquitectura visual y tecnologías de UI |
| [supabase.md](./supabase.md) | Persistencia, autenticación, seguridad y evolución de Supabase |

## Principios arquitectónicos

### 1. Simplicidad

La arquitectura debe ser suficientemente simple para desarrollar y validar el MVP sin introducir complejidad prematura.

### 2. Separación de responsabilidades

La interfaz, la lógica de aplicación y el acceso a datos deben mantenerse separados.

### 3. Bajo acoplamiento con Supabase

Supabase es la solución de persistencia utilizada para el MVP, pero las funcionalidades del frontend no deben depender directamente de su implementación.

### 4. Evolución

Las decisiones actuales deben permitir incorporar posteriormente una API sin rediseñar las funcionalidades existentes.

### 5. Reutilización

Los componentes, servicios, modelos y elementos visuales reutilizables deben centralizarse en las áreas correspondientes de la aplicación.

### 6. Trazabilidad

La configuración de Supabase, especialmente el esquema de base de datos, políticas y scripts SQL, debe mantenerse versionada y trazable dentro del repositorio.

## Arquitectura de alto nivel

```text
┌──────────────────────────────────────────────┐
│                  PlayerTech                  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │              Angular                  │  │
│  │                                        │  │
│  │  Features ── Shared ── Core ── Layout │  │
│  │                │                       │  │
│  │         Application Services           │  │
│  │                │                       │  │
│  │         Data Abstraction               │  │
│  └────────────────┼───────────────────────┘  │
│                   │                          │
│                   ▼                          │
│              Supabase                       │
│                   │                          │
│          ┌────────┴─────────┐               │
│          │                  │               │
│      PostgreSQL          Auth / RLS         │
│                                              │
└──────────────────────────────────────────────┘
```

## Evolución prevista

La arquitectura debe permitir evolucionar de:

```text
Angular → Supabase
```

hacia:

```text
Angular → API → Backend → Database
```

sin modificar sustancialmente la lógica funcional de las features.

La implementación concreta de esta evolución no forma parte del MVP actual.