# Frontend Architecture

## Propósito

Define la estructura arquitectónica del frontend de PlayerTech desarrollado con Angular.

## Tecnologías

- Angular
- TypeScript
- PrimeNG
- SakaiNG
- Tailwind CSS

## Estructura

La aplicación se organiza principalmente mediante:

```text
src/app/

├── core/
├── shared/
├── features/
└── layout/
```

## Core

Contiene funcionalidades transversales que tienen alcance global dentro de la aplicación.

Ejemplos:

```text
core/
├── auth/
├── academy-context/
├── guards/
├── interceptors/
├── config/
└── services/
```

No debe utilizarse `core` como contenedor general de cualquier código reutilizable.

El contexto de academia, cuando sea necesario para una operación de aplicación o experiencia de usuario, debe centralizarse en una capacidad transversal. No debe construirse agregando manualmente un `academy_id` desde cada componente, ni debe considerarse una frontera de autorización.

## Shared

Contiene elementos reutilizables por múltiples features.

Ejemplos:

```text
shared/
├── components/
├── models/
├── directives/
├── pipes/
└── utils/
```

Los elementos de `shared` no deben contener lógica específica de una funcionalidad concreta.

## Features

Las funcionalidades del producto se organizan por dominio funcional.

Ejemplo:

```text
features/
├── players/
├── groups/
├── activities/
├── call-ups/
└── responses/
```

Cada feature puede contener sus propios:

```text
components/
pages/
services/
models/
```

La organización exacta podrá evolucionar según crezca la aplicación.

## Layout

Contiene la estructura visual general de la aplicación.

Ejemplos:

- sidebar;
- topbar;
- navegación;
- contenido principal;
- configuración visual.

SakaiNG proporciona la base inicial del layout.

## Regla de dependencias

La dependencia debe favorecer una dirección clara:

```text
Features
   ↓
Shared / Core
```

Una feature no debería depender de otra feature directamente salvo que exista una necesidad explícita y documentada.

Los elementos reutilizables deben extraerse hacia `shared` cuando corresponda.

## Acceso a datos

Los componentes no deben realizar directamente operaciones contra Supabase.

Evitar:

```text
Component
   ↓
Supabase
```

Preferir:

```text
Component
   ↓
Feature Service
   ↓
Repository / Data Access
   ↓
Supabase
```

Esto mantiene la lógica de acceso a datos separada de la interfaz.

Los repositorios y servicios pueden operar dentro de un contexto de academia, pero PostgreSQL/RLS debe validar siempre que el usuario autenticado pertenece a la academia correspondiente.

## Principio

La estructura del frontend debe organizarse alrededor de las funcionalidades del producto y no alrededor de las tecnologías utilizadas para almacenar los datos.
