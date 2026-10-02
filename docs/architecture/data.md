# Data Architecture

## Propósito

Define cómo las funcionalidades de PlayerTech acceden y utilizan los datos.

El objetivo principal es evitar que la aplicación quede acoplada directamente a Supabase.

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

## Flujo actual

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
```

## Flujo futuro

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
```

La feature y el servicio de aplicación deberían permanecer conceptualmente iguales.

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

El servicio no debería contener detalles específicos de cómo Supabase ejecuta una consulta.

## Repositorios

El repositorio representa la abstracción de acceso a los datos.

Ejemplo conceptual:

```typescript
interface PlayerRepository {
    getPlayers(): ...
    getPlayer(id): ...
    createPlayer(player): ...
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

## Modelos

Los modelos utilizados por las features deben representar el dominio de PlayerTech.

No se debe propagar innecesariamente hacia toda la aplicación el modelo específico de una tecnología de persistencia.

## Beneficio

Esta separación permite:

- cambiar Supabase por una API;
- modificar consultas sin afectar componentes;
- centralizar acceso a datos;
- facilitar pruebas;
- reducir acoplamiento;
- mantener las features enfocadas en comportamiento funcional.

## Regla principal

> Las features conocen las necesidades de datos del producto; no deberían conocer los detalles de infraestructura utilizados para obtenerlos.