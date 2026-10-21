# Supabase Architecture

## Propósito

Define el uso de Supabase como plataforma de datos y servicios backend administrados durante el MVP v1 de PlayerTech.

Supabase se utilizará para acelerar el desarrollo del producto manteniendo una separación arquitectónica que permita evolucionar posteriormente hacia una API y un backend propio.

El MVP utilizará un modelo **multi-tenant desde el inicio**, donde cada academia representa un tenant y sus datos deben permanecer aislados de los datos de otras academias.

---

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

---

## Modelo Multi-Tenant

PlayerTech utiliza una arquitectura multi-tenant desde el MVP.

La academia representa el tenant principal de los datos de negocio.

El modelo conceptual es:

```text
User
 │
 │ membership
 ▼
Academy / Tenant
 │
 ├── Players
 ├── Groups
 ├── Activities
 ├── Call-ups
 └── Responses
```

La identidad del usuario autenticado y la identidad de la academia son conceptos diferentes.

```text
auth.uid()
    ↓
identidad del usuario

academy_id
    ↓
identidad de la academia / tenant
```

Por lo tanto, no se debe asumir ni implementar:

```text
academy_id = auth.uid()
```

La relación entre usuarios y academias debe representarse explícitamente mediante una relación de pertenencia.

Conceptualmente:

```text
auth.users
    │
    ▼
academy_members
    │
    ▼
academies
```

Una implementación inicial puede permitir que un administrador pertenezca a una sola academia, pero el modelo no debe impedir que posteriormente un usuario pueda pertenecer a múltiples academias si el producto lo requiere.

---

## PostgreSQL

PostgreSQL será la fuente de persistencia principal.

El modelo de datos debe reflejar el dominio definido en:

```text
docs/product/
docs/backlog/
docs/architecture/data.md
```

Las tablas, relaciones, restricciones e índices deberán mantenerse trazables.

Las entidades de negocio que pertenezcan a una academia deben mantener una referencia al tenant correspondiente mediante `academy_id` o la relación equivalente definida por el modelo.

Ejemplo conceptual:

```text
players
----------------
id
academy_id
name
...
```

El mismo principio aplica a las demás entidades que requieran aislamiento por academia.

Las claves foráneas deberán utilizarse para preservar la integridad referencial entre academias y sus datos.

---

## Identidad y pertenencia

Supabase Authentication proporciona la identidad del usuario autenticado.

El sistema de negocio debe mantener separada esta identidad de la pertenencia a una academia.

Conceptualmente:

```text
auth.users
    │
    │ user_id
    ▼
academy_members
    │
    │ academy_id
    ▼
academies
```

`academy_members` representa la pertenencia de un usuario a una academia y puede incorporar posteriormente información como:

- rol;
- estado de la membresía;
- fecha de incorporación;
- otras propiedades de acceso.

El modelo inicial debe mantenerse simple y solo incorporar atributos que respondan a necesidades reales del MVP.

---

## Authentication

El MVP utilizará Supabase Authentication para la autenticación de usuarios.

Inicialmente se utilizará:

```text
Email + Password
```

La autenticación debe mantenerse separada conceptualmente de la lógica de negocio.

Las funcionalidades no deberían depender directamente de la implementación interna de Supabase Auth.

La aplicación debe obtener la identidad del usuario autenticado mediante la abstracción correspondiente y no distribuir llamadas al SDK de autenticación entre los componentes.

---

## Row Level Security

Row Level Security (RLS) es un mecanismo fundamental para implementar el aislamiento de datos entre tenants.

Las tablas que contienen datos pertenecientes a una academia deben utilizar políticas que impidan que un usuario acceda a datos de una academia a la que no pertenece.

Conceptualmente:

```text
Usuario autenticado
        │
        ▼
academy_members
        │
        ▼
Academy autorizada
        │
        ▼
Datos de la Academy
```

Una política de acceso debe verificar la relación entre el usuario autenticado y la academia correspondiente.

Conceptualmente:

```text
auth.uid()
    │
    ▼
academy_members
    │
    ▼
academy_id
    │
    ▼
registro solicitado
```

No se debe utilizar una comparación directa del tipo:

```text
academy_id = auth.uid()
```

cuando `academy_id` representa una academia y `auth.uid()` representa un usuario.

Las políticas concretas deberán mantenerse versionadas mediante migraciones.

### Acceso sin sesión (`anon`)

`anon` no lee ni escribe ninguna tabla de negocio. Cuando una funcionalidad necesita acceso sin cuenta, como el enlace de una convocatoria (spec 013), se expone con funciones `security definer` con `search_path` vacío que:

- reciben el secreto que autoriza el acceso (el token de la lista) y derivan de él la academia, nunca de un dato del cliente;
- devuelven solo los campos necesarios y responden igual ante un secreto inválido, sin revelar si existe;
- aplican las reglas de negocio en el servidor;
- no usan `auth.uid()` ni el esquema `auth` (ADR-017).

Las funciones auxiliares que usan internamente revocan `execute` a `public`, `anon` y `authenticated`. Las pruebas pgTAP comprueban que `anon` no tiene privilegios sobre las tablas.

---

## Aislamiento entre tenants

El aislamiento entre academias es un requisito de seguridad del MVP.

Dado un usuario perteneciente a una academia:

```text
Academy A
```

el sistema debe impedir que pueda:

- consultar datos de Academy B;
- modificar datos de Academy B;
- eliminar datos de Academy B;
- crear relaciones que permitan acceder indebidamente a datos de Academy B.

Este aislamiento debe estar garantizado principalmente en la capa de datos mediante PostgreSQL y RLS.

Las restricciones implementadas en Angular son complementarias y no constituyen un límite de seguridad suficiente.

---

## Políticas de acceso

Las políticas RLS deberán considerar como mínimo:

```text
SELECT
INSERT
UPDATE
DELETE
```

cuando la operación corresponda a la entidad.

Cada política debe evaluar si el usuario autenticado posee una relación válida con la academia propietaria del registro.

Las políticas deben evitar depender de valores enviados arbitrariamente por el cliente.

Por ejemplo, un `academy_id` enviado desde Angular no debe considerarse suficiente evidencia de autorización.

La autorización debe ser determinada y validada por las políticas de seguridad de PostgreSQL/RLS.

---

## Migraciones

Los cambios estructurales de la base de datos deben mantenerse versionados.

Ejemplo:

```text
supabase/
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_academies.sql
    ├── 003_academy_members.sql
    ├── 004_players.sql
    ├── 005_groups.sql
    ├── 006_activities.sql
    └── ...
```

Cada migración debe representar un cambio identificable del esquema.

Las migraciones deben incluir cuando corresponda:

- tablas;
- claves primarias;
- claves foráneas;
- índices;
- restricciones;
- RLS;
- políticas;
- funciones necesarias para seguridad o integridad;
- triggers cuando sean necesarios.

La estructura y procedimiento para crear, ejecutar y mantener migraciones se documenta en:

`docs/architecture/supabase-migrations-guide.md`

---

## Scripts

Los scripts relacionados con la configuración de Supabase deben mantenerse dentro del repositorio cuando sean necesarios para reproducir o mantener el entorno.

Ejemplo:

```text
supabase/
├── config.toml
├── migrations/
├── seed.sql
└── tests/database/
```

La estructura vigente está definida en `specs/001-database-foundation/plan.md`.

Los scripts deben ser reproducibles y mantenerse versionados.

No se deben utilizar modificaciones manuales de la base de datos como mecanismo principal de evolución del esquema.

---

## Seed

Cuando sea necesario disponer de datos iniciales para desarrollo o pruebas, estos deberán mantenerse mediante scripts reproducibles.

Ejemplo:

```text
supabase/seed.sql
```

Los datos de seed deben respetar el modelo multi-tenant.

Por ejemplo:

```text
Academy
    ↓
Academy Member
    ↓
Players
    ↓
Activities
```

Los datos de prueba no deben depender de identificadores generados manualmente que no puedan reproducirse de forma controlada.

---

## Regla de acceso desde el frontend

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

El acceso a datos debe respetar además el contexto de academia y las políticas de autorización definidas en Supabase.

---

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
Repository
        ↓
Feature
        ↓
Tests
```

Los cambios estructurales o de seguridad relevantes deben poder identificarse mediante sus migraciones correspondientes.

---

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

El modelo multi-tenant debe mantenerse durante esta evolución.

La implementación del aislamiento podrá trasladarse desde RLS hacia mecanismos de autorización del backend cuando exista una API propia, sin modificar el concepto de:

```text
User
   ↓
Membership
   ↓
Academy / Tenant
   ↓
Business Data
```

---

## Fuera del alcance actual

No se define todavía:

- backend propio;
- API REST;
- Symfony;
- arquitectura de microservicios;
- infraestructura cloud compleja;
- CI/CD específico para backend;
- facturación multi-tenant;
- administración avanzada de múltiples academias por usuario.

Estas decisiones podrán incorporarse cuando el producto requiera una evolución de arquitectura.

El modelo multi-tenant y el aislamiento de datos entre academias, en cambio, forman parte del MVP.