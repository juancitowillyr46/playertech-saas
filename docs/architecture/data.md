# Data Architecture

## Propósito

Define cómo las funcionalidades de PlayerTech acceden y utilizan los datos.

El objetivo principal es mantener separadas las necesidades funcionales del producto de los mecanismos concretos de persistencia e infraestructura.

La arquitectura debe permitir utilizar Supabase durante el MVP y evolucionar posteriormente hacia una API o backend propio sin requerir cambios innecesarios en las funcionalidades.

---

## Principio de separación

Una feature no debe conocer detalles específicos de la infraestructura de persistencia.

La dependencia conceptual será:

```text
UI
 ↓
Application Service
 ↓
Data Access Abstraction
 ↓
Data Provider
```

Durante el MVP:

```text
Data Provider = Supabase
```

En una evolución futura:

```text
Data Provider = API
```

La implementación concreta del proveedor de datos no debe propagarse hacia los componentes de las features.

---

## Modelo Multi-Tenant

PlayerTech utiliza un modelo multi-tenant desde el MVP.

En PlayerTech, una **Academy** representa el tenant principal de los datos de negocio.

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

Los usuarios y las academias son conceptos distintos.

El identificador del usuario autenticado (`auth.uid()`) representa la identidad del usuario y no debe utilizarse como identificador de la academia.

La pertenencia de un usuario a una academia determina el contexto dentro del cual puede operar.

Conceptualmente:

```text
Authenticated User
        │
        ▼
Academy Membership
        │
        ▼
Academy / Tenant
        │
        ▼
Business Data
```

Las entidades de negocio que pertenezcan a una academia deben mantener una referencia al tenant correspondiente, normalmente mediante `academy_id`.

Ejemplo:

```text
players
----------------
id
academy_id
name
...
```

El mismo principio aplica a las demás entidades de negocio que requieran aislamiento por academia.

---

## Contexto de Academia

Las operaciones sobre datos deben ejecutarse dentro del contexto de la academia a la que pertenece el usuario.

Conceptualmente:

```text
User
 ↓
Current Academy Context
 ↓
Application Service
 ↓
Repository
 ↓
Data Provider
```

El contexto de academia no debe depender de que cada componente de la interfaz agregue manualmente un `academy_id` a cada operación.

La determinación y validación del contexto de academia deben estar centralizadas en las capas correspondientes de la arquitectura.

La forma concreta de determinar y proteger este contexto depende del proveedor de datos y se documenta en:

`docs/architecture/supabase.md`

---

## Flujo actual

Durante el MVP, una operación de una feature seguirá conceptualmente el siguiente flujo:

```text
PlayerComponent
      │
      ▼
PlayerService
      │
      ▼
PlayerRepository
      │
      ▼
SupabasePlayerRepository
      │
      ▼
Supabase
      │
      ▼
Academy-scoped Data
```

El repositorio es responsable de acceder a los datos mediante el contexto correspondiente.

Los componentes no deben realizar consultas directamente contra Supabase.

---

## Flujo futuro

La arquitectura debe permitir evolucionar hacia una API:

```text
PlayerComponent
      │
      ▼
PlayerService
      │
      ▼
PlayerRepository
      │
      ▼
HttpPlayerRepository
      │
      ▼
API
      │
      ▼
Backend
      │
      ▼
Database
```

La feature y el servicio de aplicación deberían permanecer conceptualmente iguales.

El contexto de academia deberá continuar formando parte del modelo de autorización y acceso a datos, aunque su implementación pueda cambiar al introducir una API o backend propio.

---

## Servicios de aplicación

Los servicios coordinan las operaciones que necesita una feature.

Ejemplo:

```text
PlayerService

- createPlayer()
- getPlayers()
- getPlayer()
- updatePlayer()
```

El servicio:

- coordina el caso de uso;
- aplica reglas de aplicación;
- utiliza los repositorios correspondientes;
- trabaja dentro del contexto de academia;
- no contiene detalles específicos de cómo Supabase ejecuta una consulta.

El servicio no debe asumir que el usuario autenticado y la academia son la misma entidad.

---

## Repositorios

El repositorio representa la abstracción de acceso a los datos.

Ejemplo conceptual:

```typescript
interface PlayerRepository {
    getPlayers(): ...
    getPlayer(id): ...
    createPlayer(player): ...
    updatePlayer(id, player): ...
}
```

La implementación concreta puede ser:

```text
SupabasePlayerRepository
```

y posteriormente:

```text
HttpPlayerRepository
```

El repositorio debe respetar el contexto de academia establecido por la arquitectura y no debe permitir que una operación acceda arbitrariamente a datos pertenecientes a otra academia.

Los mecanismos concretos utilizados para garantizar este aislamiento dependen de la infraestructura y deben estar documentados en la arquitectura correspondiente.

---

## Modelos

Los modelos utilizados por las features deben representar el dominio de PlayerTech.

No se debe propagar innecesariamente hacia toda la aplicación el modelo específico de una tecnología de persistencia.

Los modelos de dominio pueden representar relaciones relevantes del producto, incluyendo la pertenencia de una entidad a una academia cuando corresponda.

La estructura específica de las tablas, relaciones, claves e índices pertenece a la arquitectura de datos y a las migraciones de Supabase.

---

## Aislamiento de datos

El aislamiento entre academias es un requisito arquitectónico del modelo multi-tenant.

Una operación realizada dentro del contexto de una academia no debe permitir acceder o modificar datos pertenecientes a otra academia.

La aplicación no debe depender exclusivamente de filtros implementados en la interfaz de usuario para garantizar este aislamiento.

Durante el MVP, Supabase y PostgreSQL proporcionarán los mecanismos técnicos para implementar este aislamiento, incluyendo Row Level Security (RLS) cuando corresponda.

La estrategia concreta de RLS y autorización se define en:

`docs/architecture/supabase.md`

---

## Responsabilidades

### Feature

Conoce:

- el comportamiento funcional;
- los datos que necesita;
- las operaciones que debe realizar.

No conoce:

- cómo Supabase ejecuta consultas;
- cómo se implementa RLS;
- detalles internos de PostgreSQL;
- credenciales o mecanismos privilegiados.

### Application Service

Responsable de:

- coordinar casos de uso;
- aplicar reglas de aplicación;
- utilizar repositorios;
- trabajar dentro del contexto de academia.

### Repository

Responsable de:

- abstraer el acceso a datos;
- representar las operaciones requeridas por una feature;
- respetar el contexto de academia;
- ocultar detalles del proveedor de datos.

### Data Provider

Responsable de:

- implementar el acceso concreto a los datos;
- comunicarse con Supabase durante el MVP;
- posteriormente comunicarse con una API u otro proveedor.

### Infraestructura

Responsable de:

- persistencia;
- autenticación;
- autorización;
- RLS;
- configuración del proveedor;
- mecanismos técnicos de aislamiento.

---

## Beneficios

Esta separación permite:

- cambiar Supabase por una API;
- modificar consultas sin afectar componentes;
- centralizar acceso a datos;
- facilitar pruebas;
- reducir acoplamiento;
- mantener las features enfocadas en comportamiento funcional;
- mantener el aislamiento entre academias;
- evolucionar el modelo multi-tenant sin reconstruir las funcionalidades existentes.

---

## Reglas principales

> Las features conocen las necesidades de datos del producto; no deberían conocer los detalles de infraestructura utilizados para obtenerlos.

> El usuario autenticado y la academia son conceptos distintos.

> Las operaciones de datos deben ejecutarse dentro del contexto de una academia.

> El aislamiento entre academias debe estar garantizado por mecanismos de arquitectura y seguridad, no únicamente por la interfaz de usuario.

> Ningún componente de una feature debe acceder directamente al proveedor de persistencia.