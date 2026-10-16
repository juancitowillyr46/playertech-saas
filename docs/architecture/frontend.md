# Frontend Architecture

## Propósito

Define la estructura arquitectónica del frontend de PlayerTech desarrollado con Angular.

Las decisiones de esta página están registradas en ADR-015 (`decisions.md`). Los patrones visuales y de experiencia se documentan en `ui.md`.

## Tecnologías

- Angular 21 (componentes standalone, sin zone.js mediante `provideZonelessChangeDetection`)
- TypeScript (modo estricto)
- PrimeNG 21
- SakaiNG (base de layout)
- Tailwind CSS 4
- Supabase JavaScript client (solo en la capa de infraestructura)

## Decisiones base

| Tema | Decisión |
|---|---|
| Estado | Servicios con **signals**. No se usa NgRx ni otra librería de estado |
| Formularios | **Reactive Forms tipados**. No se usan Signal Forms mientras sean experimentales |
| Inyección de repositorios | **Clases abstractas como token** (`{ provide: VenueRepository, useClass: SupabaseVenueRepository }`) |
| Tipos de base de datos | Generados con `supabase gen types` y usados **solo dentro de los repositorios Supabase** |
| Autenticación | Supabase Auth con flujo **PKCE** y una ruta de retorno `/auth/callback` |
| Idioma | Interfaz en español (`LOCALE_ID = 'es-CO'`, traducciones de PrimeNG); código y URLs en inglés |
| Zona horaria | Las fechas se muestran en la zona horaria de la academia (America/Bogota en el MVP) |
| Configuración | Archivos `environment.ts` por entorno; solo valores públicos |
| Pruebas | Vitest (ver `docs/engineering/testing.md`) |
| Calidad | ESLint con `angular-eslint` (formato de ESLint 9) y Prettier |

## Estructura

```text
src/app/
├── core/                         # Capacidades transversales, una sola instancia
│   ├── supabase/                 # Cliente y tipos generados (infraestructura)
│   ├── config/                   # Configuración por entorno
│   ├── auth/                     # AuthRepository + implementación Supabase, AuthService,
│   │                             # guards e InactivityService
│   ├── academy-context/          # Academia actual resuelta desde la membresía
│   ├── storage/                  # FileStorageRepository + implementación Supabase (ADR-013)
│   ├── errors/                   # Mapeo de errores y ErrorHandler global
│   └── navigation/               # Configuración del menú de PlayerTech
├── shared/                       # Reutilizable entre features, sin lógica de negocio
│   ├── components/
│   ├── validators/
│   ├── pipes/
│   └── models/
├── features/                     # Una carpeta por funcionalidad
│   ├── auth/                     # Pantallas públicas de autenticación
│   ├── home/                     # Inicio
│   ├── academy/                  # Configuración > Academia
│   └── venues/                   # Configuración > Sedes
├── layout/                       # Layout de SakaiNG adoptado por PlayerTech
└── pages/                        # Demos de SakaiNG: solo referencia (ver más abajo)
```

### Core

Contiene funcionalidades transversales con alcance global. No debe utilizarse como contenedor general de cualquier código reutilizable.

El contexto de academia se centraliza en `core/academy-context`. No se construye agregando manualmente un `academy_id` desde cada componente, y no constituye una frontera de autorización: RLS valida siempre la membresía.

### Shared

Contiene elementos reutilizables por varias features. No contiene lógica específica de una funcionalidad.

Un elemento solo se mueve a `shared/` cuando lo necesita una segunda feature; mientras tanto, permanece en la feature que lo usa (principio IV de la Constitución).

### Features

Cada feature se organiza así:

```text
features/venues/
├── pages/          # Componentes conectados a una ruta
├── components/     # Componentes de presentación de la feature
├── services/       # Casos de uso y estado (signals)
├── data/           # venue.repository.ts (abstracto) + supabase-venue.repository.ts
├── models/         # Modelos de dominio
└── venues.routes.ts
```

### Layout

El layout de SakaiNG (`layout/`) se **adopta como código propio de PlayerTech** con cambios mínimos:

- El menú se define en `core/navigation` y el componente de menú lo consume.
- La marca (logo y nombre) es configurable.
- El configurador de temas no se muestra al usuario final.

Esta adopción es una excepción controlada al principio V de la Constitución, documentada en ADR-015. Las actualizaciones de SakaiNG que afecten a `layout/` se integran según `docs/engineering/sakai-upstream.md`.

### Demos de SakaiNG

Las páginas de `pages/` (dashboard, uikit, crud, landing, documentación) se conservan como catálogo de referencia. Solo se registran en las rutas en el entorno de desarrollo, bajo `/dev`, y nunca forman parte de la aplicación de producción ni se modifican para implementar funcionalidades.

## Rutas

```text
PÚBLICAS — layout de autenticación (guestGuard: con sesión redirige a /home)
/auth/login               HU-001
/auth/register            HU-014
/auth/verify-email        HU-014
/auth/callback            Retorno de Supabase (verificación y recuperación)
/auth/forgot-password     HU-016
/auth/reset-password      HU-016
/auth/access-denied       HU-001
/auth/suspended           HU-001

PRIVADAS — AppLayout (authGuard + membershipGuard)
/home                     HU-032
/settings/academy         HU-017
/settings/venues          HU-029, HU-030, HU-031

SOLO DESARROLLO
/dev/**                   Demos de SakaiNG

/        → /home
**       → página 404 de PlayerTech
```

Cada feature se carga de forma diferida (`loadChildren` / `loadComponent`).

| Guard | Responsabilidad |
|---|---|
| `authGuard` | Exige una sesión válida; si no existe, redirige a `/auth/login` |
| `membershipGuard` | Exige membresía activa en una academia activa; redirige a `/auth/access-denied` o `/auth/suspended` |
| `guestGuard` | Impide abrir las pantallas públicas con una sesión iniciada |

Los guards mejoran la experiencia, pero no protegen datos: la protección real la aplica RLS.

## Regla de dependencias

```text
Features
   ↓
Shared / Core
```

Una feature no depende de otra feature directamente salvo que exista una necesidad explícita y documentada.

## Acceso a datos

Los componentes no realizan operaciones contra Supabase.

```text
Page / Component
   ↓
Feature Service          (signals, casos de uso)
   ↓
Repository               (clase abstracta)
   ↓
SupabaseRepository       (implementación; único lugar con el SDK y los tipos generados)
   ↓
Supabase
```

Ejemplo de contrato y registro:

```typescript
export abstract class VenueRepository {
    abstract list(): Promise<Venue[]>;
    abstract create(input: CreateVenueInput): Promise<Venue>;
}

// app.config.ts
{ provide: VenueRepository, useClass: SupabaseVenueRepository }
```

Reglas:

- El repositorio traduce las filas de la base de datos a modelos de dominio.
- El `academy_id` de una operación lo determina la base de datos (membresía y RLS), nunca un valor elegido en la interfaz.
- Para cambiar a una API propia basta con registrar otra implementación (`HttpVenueRepository`).

## Autenticación y sesión

- `AuthRepository` encapsula registro, inicio y cierre de sesión, recuperación de contraseña y restauración de sesión.
- La verificación de correo y la recuperación usan el flujo PKCE: Supabase redirige a `/auth/callback`, que completa el intercambio y dirige al usuario a la pantalla correspondiente.
- `InactivityService` cierra la sesión tras 60 minutos sin interacción del usuario (ADR-014).
- La sesión no ofrece la opción "Recordarme", que contradiría el cierre por inactividad.

## Manejo de errores

```text
Error de Supabase → Repository → Error de aplicación normalizado → Service → Interfaz
```

- Los repositorios convierten los errores del proveedor en errores de aplicación estables.
- La interfaz muestra solo mensajes funcionales en español, sin detalles técnicos ni información sensible.
- Un `ErrorHandler` global registra los errores no controlados y muestra un aviso genérico.

## Principio

La estructura del frontend se organiza alrededor de las funcionalidades del producto y no alrededor de las tecnologías utilizadas para almacenar los datos.
