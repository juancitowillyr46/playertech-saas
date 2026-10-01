# Supabase Architecture

## Propósito

Define el uso de Supabase como plataforma backend del MVP v1.

Supabase se utilizará como solución práctica para acelerar el desarrollo del producto, manteniendo una separación que permita sustituirlo posteriormente por una API.

## Componentes utilizados

El MVP podrá utilizar los siguientes servicios de Supabase:

```text
Supabase
├── PostgreSQL
├── Authentication
├── Row Level Security
└── Storage / otros servicios
    └── Solo cuando sean necesarios
```

No se incorporarán servicios de Supabase que no respondan a una necesidad funcional o técnica del MVP.

## PostgreSQL

PostgreSQL será la fuente de persistencia principal.

El modelo de datos debe reflejar el dominio definido en:

```text
docs/product/
docs/backlog/
```

Las tablas, relaciones, restricciones e índices deberán mantenerse trazables.

## Migraciones

Los cambios estructurales de la base de datos deben mantenerse versionados.

Ejemplo:

```text
supabase/
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_players.sql
    ├── 003_groups.sql
    ├── 004_activities.sql
    └── ...
```

Cada migración debe representar un cambio identificable del esquema.

## Scripts

Los scripts relacionados con la configuración de Supabase deben mantenerse dentro del repositorio cuando sea necesario para reproducir o mantener el entorno.

Ejemplos:

```text
supabase/
├── migrations/
├── seed/
└── scripts/
```

La estructura exacta podrá evolucionar según las necesidades del proyecto.

## Authentication

El MVP utilizará autenticación para el acceso del administrador.

La autenticación debe mantenerse separada conceptualmente de la lógica de negocio.

Las funcionalidades no deberían depender directamente de la implementación interna de Supabase Auth.

## Row Level Security

Las políticas de Row Level Security deberán proteger el acceso a los datos.

La seguridad no debe depender exclusivamente de restricciones implementadas en Angular.

Las políticas deberán mantenerse versionadas y documentadas junto con los cambios de esquema.

## Seed

Cuando sea necesario disponer de datos iniciales para desarrollo o pruebas, estos deberán mantenerse mediante scripts reproducibles.

Ejemplo:

```text
supabase/seed/development.sql
```

## Trazabilidad

Los cambios de base de datos deben poder relacionarse con las necesidades funcionales que los originaron.

Ejemplo:

```text
HU-002 Player Registration
        ↓
Data Model
        ↓
Migration
        ↓
RLS Policy
        ↓
Frontend Repository
```

## Regla de acceso

El frontend no debe distribuir consultas Supabase arbitrariamente entre los componentes.

Preferir:

```text
Feature
   ↓
Service
   ↓
Repository
   ↓
Supabase
```

en lugar de:

```text
Component
   ↓
Supabase SDK
```

## Evolución futura

Supabase es una decisión tecnológica para el MVP y no debe convertirse en un requisito permanente de la arquitectura funcional.

La arquitectura debe permitir evolucionar hacia:

```text
Angular
   ↓
API
   ↓
Backend
   ↓
Database
```

sin modificar significativamente la experiencia funcional de las features.

## Fuera del alcance actual

No se define todavía:

- backend propio;
- API REST;
- Symfony;
- arquitectura de microservicios;
- infraestructura cloud compleja;
- CI/CD específico para backend.

Estas decisiones podrán incorporarse cuando el producto requiera una evolución de arquitectura.