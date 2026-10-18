# Coding Standards

## Propósito

Define las convenciones generales para desarrollar código mantenible y consistente en PlayerTech.

## Lenguaje y framework

El frontend utiliza:

- TypeScript;
- Angular.

Las decisiones específicas de UI y arquitectura frontend están definidas en:

```text
docs/architecture/frontend.md
docs/architecture/ui.md
```

## Principios de código

### Claridad sobre brevedad

El código debe priorizar ser comprensible antes que ser excesivamente compacto.

Evitar abstracciones innecesarias o implementaciones excesivamente inteligentes.

### Responsabilidad única

Cada componente, servicio o clase debe tener una responsabilidad clara.

Evitar componentes que concentren:

- presentación;
- lógica de negocio;
- acceso a datos;
- transformación compleja de información.

### Evitar duplicación

Cuando una lógica sea reutilizada por varias funcionalidades, evaluar su extracción a una abstracción común.

No crear abstracciones prematuramente para casos que todavía tienen una única utilización.

## Angular

La organización del código debe seguir la arquitectura definida para:

```text
core/
shared/
features/
layout/
```

Las funcionalidades deben organizarse por feature y no por tipo técnico global.

Preferir:

```text
features/
└── players/
    ├── pages/
    ├── components/
    ├── services/
    └── models/
```

sobre una estructura global como:

```text
components/
services/
models/
```

para toda la aplicación.

## Componentes

Los componentes deben enfocarse principalmente en:

- presentación;
- interacción;
- coordinación de la vista.

No deben realizar consultas directas a Supabase.

## Servicios

Los servicios deben encapsular operaciones de aplicación o comportamiento reutilizable.

No utilizar servicios como contenedores genéricos para cualquier lógica.

## Acceso a datos

El acceso a Supabase debe mantenerse separado de los componentes.

La arquitectura esperada es:

```text
Component
    ↓
Service
    ↓
Repository / Data Access
    ↓
Supabase
```

La implementación concreta está definida en:

```text
docs/architecture/data.md
```

## TypeScript

Preferir:

- tipos explícitos cuando mejoren la claridad;
- interfaces para contratos;
- `readonly` cuando corresponda;
- funciones pequeñas;
- nombres descriptivos.

Evitar:

- `any` innecesario;
- variables con nombres ambiguos;
- tipos duplicados;
- código muerto;
- comentarios que expliquen código que debería ser evidente.

## Naming

Utilizar nombres descriptivos y consistentes.

Ejemplos:

```text
PlayerService
PlayerRepository
PlayerListComponent
CreatePlayerComponent
```

Los nombres deben utilizar el vocabulario definido en:

```text
docs/product/glossary.md
```

### Base de datos y TypeScript

- La base de datos usa `snake_case` en tablas, columnas y funciones (`academy_id`, `deleted_at`, `set_primary_venue`).
- El código TypeScript usa `camelCase` en propiedades y variables (`academyId`, `deletedAt`), y `PascalCase` en tipos y clases.
- La traducción entre ambos estilos se hace **solo en la implementación Supabase del repositorio** (`supabase-*.repository.ts`). Los modelos de la feature, los servicios y los componentes nunca ven nombres en `snake_case`.
- Los tipos generados por `npm run db:types` conservan el `snake_case` y solo se usan dentro de esas implementaciones.

## UI

Los componentes visuales deben reutilizar PrimeNG, SakaiNG y Tailwind según las reglas definidas en:

```text
docs/architecture/ui.md
```

No crear estilos propios cuando una solución existente sea suficiente.

## Regla general

> El código debe ser fácil de leer, modificar y reemplazar.