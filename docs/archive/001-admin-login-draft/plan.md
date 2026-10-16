# Plan de implementación: Admin Login

**Branch**: `001-admin-login` | **Date**: 2026-10-03 | **Spec**: [spec.md](./spec.md)

## Resumen

Implementar el flujo de inicio de sesión del administrador definido en HU-001. La aplicación valida las credenciales, autentica al usuario, determina si existe una membresía activa de academia y protege las rutas privadas.

La autenticación y la autorización de academia permanecen separadas: una sesión válida sin membresía activa se conserva, pero el usuario recibe acceso denegado y no se establece contexto de academia.

## Contexto técnico

**Lenguaje/versión**: TypeScript 5.9 con Angular 21

**Dependencias principales**: Angular Router y Forms, PrimeNG, RxJS, Supabase JavaScript client

**Persistencia**: Supabase Auth para identidad y sesión; PostgreSQL mediante `academy_members` para la membresía de autorización. Esta funcionalidad no introduce tablas de aplicación nuevas.

**Pruebas**: Pruebas unitarias y de componente con Angular/Karma/Jasmine; validación de integración y RLS de Supabase en un ambiente controlado de desarrollo o pruebas; validación manual de aceptación hasta que el proyecto adopte un framework E2E.

**Plataforma objetivo**: Navegador web responsive

**Tipo de proyecto**: Aplicación web Angular de página única

**Objetivos de rendimiento**: Un usuario con credenciales válidas debe poder llegar a una ruta privada autorizada en menos de un minuto bajo condiciones normales de red, como define SC-004.

**Restricciones**: Solo correo electrónico/contraseña; sin registro público, recuperación de contraseña, proveedores externos, roles avanzados, selección multi-academia, inferencia de tenant ni credenciales privilegiadas en el frontend. La autenticación por sí sola no autoriza el acceso a una academia.

**Escala/alcance**: Una ruta de login, protección de rutas privadas, restauración de sesión, estado de acceso denegado y resolución de membresía para la regla MVP de una membresía de academia por usuario.

## Verificación de la Constitución

| Puerta | Estado | Evidencia |
|---|---|---|
| Trazabilidad guiada por especificaciones | Cumple | Implementa HU-001 mediante [spec.md](./spec.md), este plan, tareas y pruebas. |
| Simplicidad | Cumple | Utiliza las capacidades existentes de Angular, PrimeNG y Supabase; no añade recuperación, registro, UI de roles ni selección multi-academia. |
| Separación de responsabilidades | Cumple | Los componentes de presentación delegan la lógica en servicios de aplicación; el acceso a datos está aislado mediante repositories; la integración con Supabase permanece en la capa de infraestructura/acceso a datos. |
| Reutilización de base tecnológica y visual | Cumple | Utiliza SakaiNG como base tecnológica/visual, junto con PrimeNG y Tailwind CSS, pero la pantalla de login es una implementación propia de PlayerTech y no depende ni modifica la demo de autenticación de SakaiNG. |
| Seguridad multi-tenant | Cumple | La membresía determina la autorización y el contexto de academia; `auth.uid()` representa la identidad del usuario y nunca se trata como `academy_id`; RLS mantiene la frontera final de aislamiento de datos. |
| Calidad verificable | Cumple | Cubre validación de formulario, credenciales inválidas, restauración de sesión, rutas protegidas, acceso denegado sin membresía y aislamiento de autorización. |

## Estructura del proyecto

### Documentación de la funcionalidad

```text
specs/001-admin-login/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── login-flow.md
└── tasks.md                 # Creado por /speckit.tasks
```

### Código fuente

```text
frontend/
└── src/app/
    ├── core/
    │   ├── auth/
    │   │   ├── models/
    │   │   ├── repositories/
    │   │   ├── services/
    │   │   └── guards/
    │   ├── academy-context/
    │   │   └── services/
    │   ├── config/
    │   └── ...
    ├── pages/
    │   └── auth/
    │       ├── login.ts
    │       └── access.ts
    ├── app.routes.ts
    ├── environments/
    └── app/**/*.spec.ts
```

**Decisión de estructura**: utilizar `core/auth` para la autenticación transversal, gestión de sesión y protección de rutas; `core/academy-context` para resolver el contexto de academia derivado de una membresía válida; y `pages/auth` para las pantallas de presentación relacionadas con autenticación y acceso.

La pantalla de inicio de sesión será una implementación propia de PlayerTech. Utilizará SakaiNG, PrimeNG y Tailwind CSS como base tecnológica y visual, pero **no dependerá de la página de autenticación de demostración de SakaiNG ni modificará sus componentes para implementar la funcionalidad de PlayerTech**. La demo de SakaiNG podrá utilizarse únicamente como referencia visual o técnica cuando resulte conveniente.

### Componentes de la interfaz

La pantalla de inicio de sesión deberá contemplar como mínimo:

- Campo de correo electrónico utilizando `p-inputtext` de PrimeNG y los mecanismos de validación del formulario de Angular.
- Campo de contraseña utilizando `p-password` de PrimeNG.
- Acción de inicio de sesión mediante `p-button` de PrimeNG.
- Mensajes de validación de campos y errores funcionales mediante `p-message` de PrimeNG.
- Estado de procesamiento durante la autenticación mediante el estado de carga del botón, evitando solicitudes duplicadas.
- Estado de acceso denegado para una identidad autenticada que no tenga una membresía activa de academia.
- Presentación coherente con la identidad visual de PlayerTech.

Los componentes concretos de PrimeNG representan decisiones de implementación de la interfaz y podrán ajustarse durante la implementación únicamente si existe una razón técnica que lo justifique, manteniendo el comportamiento definido en la especificación.

### Manejo de errores de autenticación

Los errores específicos proporcionados por Supabase no deberán presentarse directamente al usuario.

El flujo deberá mantener la siguiente separación:

```text
Supabase
    ↓
Repository / acceso a infraestructura
    ↓
Error de aplicación normalizado
    ↓
Auth Service
    ↓
Estado de la interfaz
    ↓
p-message
```

La capa de acceso a datos deberá aislar los errores específicos del proveedor y proporcionar al resto de la aplicación errores estables y relevantes para el dominio de autenticación.

El componente de presentación no deberá conocer ni interpretar códigos o mensajes específicos de Supabase.

La interfaz mostrará únicamente mensajes funcionales apropiados para el usuario y no deberá revelar información sensible, incluyendo información que permita determinar si un correo electrónico está registrado.

Por ejemplo, un error técnico equivalente a credenciales inválidas deberá presentarse mediante un mensaje funcional como:

> El correo electrónico o la contraseña no son válidos.

### Separación entre autenticación y contexto de academia

La sesión autenticada representa la identidad del usuario, mientras que la membresía determina si dicho usuario está autorizado a operar dentro de una academia.

El flujo será:

```text
Usuario
  ↓
Supabase Auth
  ↓
Sesión autenticada
  ↓
Consulta de academy_members
  ↓
¿Existe membresía activa?
  ├── Sí → establecer contexto de academia → permitir acceso privado
  └── No → conservar sesión → acceso denegado
```

El frontend no deberá proporcionar ni inferir `academy_id` como mecanismo de autorización.

En el MVP no se implementará selector, cambio o administración de múltiples academias por usuario. La arquitectura mantendrá la relación mediante `academy_members` para permitir evolución futura sin equiparar identidad de usuario con identidad de tenant.

## Fase 0: Investigación

Consultar [research.md](./research.md).

El enfoque seleccionado utiliza:

- un servicio de sesión para gestionar la identidad autenticada;
- un repository de membresía para consultar la autorización de academia;
- guards para controlar el acceso a rutas privadas;
- RLS como frontera final de autorización y aislamiento de datos;
- una implementación propia de la interfaz de login de PlayerTech, independiente de la demo de autenticación de SakaiNG.

No quedan preguntas técnicas de contexto pendientes que bloqueen la implementación.

## Fase 1: Diseño

- [Modelo de datos](./data-model.md): conceptos de sesión y membresía; sin esquema de base de datos propio de la funcionalidad.
- [Contrato de login](./contracts/login-flow.md): comportamiento observable del login, validación, autenticación, redirección y acceso denegado.
- [Quickstart](./quickstart.md): escenarios de validación end-to-end y comandos de prueba.

El diseño deberá mantener las siguientes fronteras:

```text
Component
    ↓
Application/Auth Service
    ↓
Repository
    ↓
Supabase
```

Los componentes de presentación no accederán directamente al cliente de Supabase.

## Verificación de la Constitución posterior al diseño

Todas las puertas siguen en estado **Cumple**.

El diseño:

- mantiene la especificación como fuente del comportamiento requerido;
- utiliza la base tecnológica y visual de SakaiNG sin depender de su implementación de autenticación;
- mantiene la lógica de autenticación fuera de los componentes de presentación;
- separa identidad, membresía y contexto de academia;
- no introduce un modelo de tenant alternativo;
- utiliza membresía y RLS para la autorización;
- evita implementar capacidades multi-academia fuera del alcance del MVP.

## Seguimiento de complejidad

No existen violaciones de la Verificación de la Constitución que requieran justificación.

La solución mantiene una estructura mínima para HU-001 y evita introducir abstracciones adicionales que no sean necesarias para la autenticación, la autorización por membresía y la protección de rutas.