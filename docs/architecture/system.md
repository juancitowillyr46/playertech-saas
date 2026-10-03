# System Architecture

## Propósito

Define la arquitectura general de PlayerTech y la relación entre sus principales componentes durante el MVP v1.

## Contexto

PlayerTech se implementará inicialmente como una aplicación web multi-tenant para la gestión de academias deportivas. El escenario funcional inicial puede operar con una academia de fútbol, sin que ello elimine el aislamiento arquitectónico entre academias.

Durante el MVP se utilizará Supabase como plataforma de datos y servicios backend administrados.

La arquitectura prioriza:

- velocidad de desarrollo;
- simplicidad;
- separación de responsabilidades;
- reutilización;
- trazabilidad;
- posibilidad de evolución hacia una arquitectura basada en APIs.

## Componentes principales

### Frontend

Aplicación web desarrollada con:

- Angular
- TypeScript
- SakaiNG
- PrimeNG
- Tailwind CSS

El frontend contiene la interfaz, navegación, lógica de presentación y coordinación de las operaciones de la aplicación.

### Supabase

Supabase proporciona inicialmente:

- PostgreSQL;
- autenticación;
- Row Level Security;
- acceso a datos;
- servicios complementarios cuando sean necesarios.

## Flujo general

```text
Usuario
   │
   ▼
Angular
   │
   ├── Feature
   │
   ├── Shared
   │
   └── Core
   │
   ▼
Application / Data Services
   │
   ▼
Data Abstraction
   │
   ▼
Supabase
   │
   ├── PostgreSQL / Academy Memberships
   ├── Auth
   └── RLS
```

## Responsabilidades

### Angular

Responsable de:

- interfaz de usuario;
- navegación;
- interacción con el usuario;
- validaciones de presentación;
- coordinación de casos de uso;
- presentación de información.

### Features

Cada feature representa una capacidad funcional del producto.

Ejemplos:

- Players
- Groups
- Activities
- Call-ups
- Responses

Las features contienen el comportamiento específico de cada dominio funcional.

### Shared

Contiene elementos reutilizables entre diferentes features.

Ejemplos:

- componentes;
- modelos compartidos;
- utilidades;
- servicios reutilizables.

### Core

Contiene capacidades transversales de la aplicación.

Ejemplos:

- autenticación;
- guards;
- configuración;
- servicios globales;
- manejo de sesión.
- contexto de academia cuando corresponda.

El contexto de academia representa el tenant dentro del cual opera la aplicación. No reemplaza la autorización: la pertenencia del usuario y el aislamiento de datos deben validarse en PostgreSQL/RLS.

### Supabase

Responsable de la persistencia y servicios backend utilizados durante el MVP.

## Evolución arquitectónica

La arquitectura actual no requiere un backend propio.

La evolución futura podrá incorporar una API:

```text
MVP

Angular
   ↓
Data Abstraction
   ↓
Supabase


Evolución

Angular
   ↓
Data Abstraction
   ↓
API
   ↓
Backend
   ↓
Database
```

El objetivo es que las features no tengan que conocer directamente cuál de estas implementaciones está proporcionando los datos.

La evolución debe preservar el modelo `Usuario → Membresía → Academia/Tenant → Datos de negocio`, trasladando los mecanismos de autorización al backend propio cuando corresponda.
