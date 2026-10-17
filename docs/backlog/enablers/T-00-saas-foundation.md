# T-00 — Fundación técnica del SaaS

**Tipo:** Habilitador técnico (*enabler*) · **Fase:** 1 — Fundación SaaS · **Prioridad:** MVP · **Estado:** Terminada (entorno local) · el entorno en la nube queda en "Antes del piloto" (ADR-016)
**Specs:** [`specs/001-database-foundation/`](../../../specs/001-database-foundation/spec.md) (áreas 1 a 6, **implementada**) · [`specs/002-frontend-foundation/`](../../../specs/002-frontend-foundation/spec.md) (áreas 7 y 8, **implementada**)

## Avance

| Área | Estado | Evidencia |
|---|---|---|
| 1. Proyecto y entornos de Supabase | ✅ Local · ➡️ Producción y SMTP | `supabase/config.toml`. El entorno en la nube, el SMTP y el dominio pasan a los requisitos "Antes del piloto" de `docs/product/roadmap.md` (ADR-016) |
| 2. Modelo de datos | ✅ | 11 migraciones en `supabase/migrations/` |
| 3. Seguridad y aislamiento | ✅ | RLS, privilegios por columna y políticas de Storage |
| 4. Registro atómico | ✅ | Trigger `handle_new_user` |
| 5. Datos de prueba | ✅ | `supabase/seed.sql` (academias A y B) |
| 6. Pruebas de aislamiento | ✅ | 144 pruebas pgTAP en `supabase/tests/database/` |
| 7. Base del frontend | ✅ | Spec 002: tooling (ESLint, Vitest, Testing Library), cliente PKCE, repositorios de autenticación, contexto de academia, archivos y documentos legales, errores, `es-CO`, preset de tema |
| 8. Esqueleto de la aplicación | ✅ | Spec 002: layout adoptado, menú, guards, pantallas de acceso básicas, `/auth/callback`, páginas de estado, demos solo en desarrollo. Validación en `frontend/README.md` |

| Criterio | Estado |
|---|---|
| CA-001 a CA-006 | ✅ Verificados (pgTAP y validación de Auth y Storage, ver `supabase/README.md`) |
| CA-007 | ✅ Repositorio y frontend: solo la clave publicable; `npm run check:bundle` verifica la compilación de producción |
| CA-008 | ✅ Sin sesión, las rutas privadas llevan al inicio de sesión; las demos no existen en producción |
| CA-009 | ✅ `build` y `lint` sin errores; 106 pruebas con Vitest y 144 con pgTAP |

**Limitación conocida:** el trigger de registro se ejecuta en toda alta de `auth.users` y exige los metadatos del registro de una academia; las altas de otros tipos (invitaciones, futuros roles) fallarán hasta rediseñarlo. Detalle en `supabase/README.md`.

## Propósito

Preparar la base técnica multi-tenant sobre la que se construyen todas las historias de usuario de la Fase 1 y, después, las de negocio de la Fase 2.

No entrega funcionalidad visible para el usuario final. Su valor es que cada HU posterior pueda implementarse sin resolver de nuevo la infraestructura, la seguridad ni el aislamiento entre academias.

## Necesidad del equipo

> Como **equipo de desarrollo**, necesitamos una base técnica multi-tenant verificada (base de datos, seguridad, entornos y estructura del frontend), para implementar las historias de usuario con el aislamiento entre academias garantizado desde el inicio.

## Habilita

HU-014, HU-001, HU-015, HU-016, HU-017, HU-029, HU-030 y HU-031, además de todas las HU de la Fase 2.

## Alcance

### 1. Proyecto y entornos de Supabase

- Inicialización del proyecto Supabase en el repositorio (`supabase/`, `config.toml`).
- Entornos de desarrollo local y producción.
- Confirmación de correo activada también en local.
- Longitud mínima de contraseña (8) configurada en Supabase Auth.
- JWT de 1 hora.
- SMTP propio configurado en los entornos con usuarios reales.
- URLs de redirección permitidas para verificación y recuperación, por entorno.

### 2. Modelo de datos de la Fase 1

Migraciones versionadas de las tablas definidas en `docs/architecture/database-schema.md` (Fase 1): `plans`, `legal_documents`, `profiles`, `academies`, `subscriptions`, `academy_members`, `venues`, `files` y `legal_acceptances`, con sus claves, restricciones, índices y triggers de `updated_at`.

### 3. Seguridad y aislamiento

- Funciones de autorización: `is_academy_member`, `current_academy_id` y `has_academy_role`.
- RLS habilitado y políticas para todas las tablas de la Fase 1.
- Buckets `public-assets` y `private-files`, con sus reglas de acceso, tipos permitidos y tamaño máximo.

### 4. Registro atómico

- Función `handle_new_user()`, que crea en una sola transacción: perfil, academia, membresía de owner, suscripción Free, sede principal y aceptaciones legales.
- Carga inicial de los planes (Free, Pro y Advanced) y de las versiones vigentes de los documentos legales.

### 5. Datos de prueba

Seed reproducible con dos academias (A y B), cada una con su owner, su sede principal y su suscripción, sin identificadores ni datos reales.

### 6. Pruebas automáticas de aislamiento

Pruebas de base de datos que verifiquen, para cada tabla protegida, que:
- el usuario de la academia A puede leer y modificar lo que le corresponde en A;
- el usuario de la academia A **no puede** leer, crear, modificar ni eliminar datos de la academia B;
- un usuario sin membresía activa o de una academia suspendida no accede a datos de ninguna academia;
- las tablas creadas por el registro no aceptan inserciones directas del cliente.

### 7. Base del frontend

- Cliente de Supabase (flujo PKCE) con configuración pública por entorno (`environment.ts`), sin secretos en el código.
- Tipos de base de datos generados, usados solo en los repositorios Supabase.
- Repositorio de autenticación (`AuthRepository`) y su implementación con Supabase.
- Contexto de academia resuelto desde la membresía.
- Repositorio de archivos (`FileStorageRepository`) y su implementación con Supabase (ADR-013).
- Estructura `core/`, `shared/`, `features/` y `layout/` según `docs/architecture/frontend.md`.
- Mapeo de errores y `ErrorHandler` global.
- Idioma `es-CO` y traducciones de PrimeNG al español.
- Tooling: ESLint con `angular-eslint` y script `lint`, Vitest en lugar de Karma, eliminación de `frontend/.gitmodules` huérfano y renombrado del proyecto `sakai-ng` a PlayerTech.

### 8. Esqueleto de la aplicación PlayerTech

- Layout de SakaiNG adoptado (ADR-015): menú definido en `core/navigation`, marca PlayerTech, menú de usuario con cerrar sesión, botón claro/oscuro y configurador oculto.
- Tema Aura con color primario `rgb(59, 130, 246)` y menú estático.
- Layout de autenticación compartido (sin pantallas funcionales, que corresponden a sus HU).
- Rutas públicas y privadas según `frontend.md`, con `authGuard`, `membershipGuard` y `guestGuard`.
- Demos de SakaiNG solo en desarrollo, bajo `/dev`; página 404 propia.

## Criterios de aceptación técnicos

### CA-001 — Migraciones reproducibles

**Dado** una base de datos vacía,
**cuando** se aplican todas las migraciones y el seed,
**entonces** el esquema de la Fase 1 queda creado sin errores y con los datos iniciales cargados.

### CA-002 — Aislamiento entre academias

**Dado** el seed con las academias A y B,
**cuando** se ejecutan las pruebas de aislamiento,
**entonces** todas pasan y ningún usuario accede a datos de otra academia en ninguna tabla.

### CA-003 — Academia suspendida

**Dado** que la academia A está suspendida,
**cuando** su owner intenta leer o modificar datos,
**entonces** la base de datos se lo impide.

### CA-004 — Registro atómico

**Dado** un registro de prueba,
**cuando** se completa correctamente,
**entonces** quedan creados el perfil, la academia, la membresía, la suscripción Free, la sede principal y las dos aceptaciones legales;
**y cuando** falla en cualquier paso, no queda ningún dato creado.

### CA-005 — Escritura restringida

**Dado** un usuario autenticado,
**cuando** intenta insertar directamente en `academies`, `academy_members`, `subscriptions` o `legal_acceptances`,
**entonces** la base de datos lo rechaza.

### CA-006 — Almacenamiento aislado

**Dado** el owner de la academia A,
**cuando** intenta subir un archivo bajo el prefijo de la academia B, o un archivo con tipo o tamaño no permitido,
**entonces** el almacenamiento lo rechaza.

### CA-007 — Configuración sin secretos

**Dado** el código del frontend,
**cuando** se revisa,
**entonces** solo contiene valores públicos de configuración y ninguna clave privilegiada (por ejemplo, la `service role key`).

### CA-008 — Esqueleto funcional

**Dado** que la aplicación está en ejecución,
**cuando** una persona sin sesión intenta abrir una ruta privada,
**entonces** es dirigida al inicio de sesión;
**y** en producción las demos de SakaiNG no son accesibles.

### CA-009 — Build, lint y pruebas

**Dado** el repositorio,
**cuando** se ejecutan el build, el lint y las pruebas (Vitest y pgTAP),
**entonces** terminan sin errores.

## Fuera de alcance

- Pantallas funcionales de registro, inicio de sesión, perfil o sedes (corresponden a sus HU).
- Pipeline de CI/CD automatizado *(a evaluar en el plan técnico)*.
- Tablas de la Fase 2.
- Tareas programadas de limpieza (MVP+).

## Decisiones pendientes para el plan técnico

- Proveedor de SMTP (DEC-29).
- ~~Captura de IP en las aceptaciones legales~~: resuelta en DEC-29 (no se captura en el MVP).
- Plataforma de despliegue del frontend.

## Decisiones relacionadas

ADR-012, ADR-013, ADR-014 y ADR-015 (`docs/architecture/decisions.md`).
