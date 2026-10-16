---

description: "Lista de tareas para implementar Admin Login"
---

# Tareas: Admin Login

**Input**: Documentos de diseño de `/specs/001-admin-login/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/login-flow.md y quickstart.md

**Tests**: Se incluyen tareas de pruebas porque la Constitución exige comportamiento verificable y
HU-001 cubre autenticación, autorización y rutas protegidas.

**Organización**: Las tareas se agrupan por historia de usuario para permitir su implementación y
validación independiente.

## Formato: `[ID] [P?] [Historia] Descripción`

- **[P]**: Puede ejecutarse en paralelo, pues modifica archivos distintos y no depende de tareas sin
  completar.
- **[Historia]**: Historia de usuario a la que pertenece la tarea (`US1`, `US2` o `US3`).
- Cada tarea incluye rutas de archivo exactas.

## Convenciones de rutas

- **Aplicación web**: `frontend/src/` para código Angular y `frontend/src/**/*.spec.ts` para pruebas.
- **Persistencia Supabase**: `supabase/migrations/` para cambios versionados de esquema y RLS.
- **Configuración local**: `frontend/src/environments/` para valores públicos por ambiente; ningún
  secreto o `service role key` se registra en el repositorio.

## Fase 1: Configuración

**Propósito**: Preparar dependencias y configuración pública mínima para que la aplicación use el
ambiente de Supabase correspondiente.

- [ ] T001 Agregar `@supabase/supabase-js` a `frontend/package.json` y actualizar `frontend/package-lock.json`
- [ ] T002 [P] Crear `frontend/src/environments/environment.ts` y `frontend/src/environments/environment.development.ts` con la configuración pública de Supabase leída desde el mecanismo de entorno definido para la aplicación, sin incluir secretos ni `service role key`
- [ ] T003 [P] Crear `frontend/src/app/core/config/supabase-client.provider.ts` para construir y exponer el cliente de Supabase usando únicamente la configuración pública del ambiente
- [ ] T004 Actualizar `frontend/angular.json`, `frontend/src/app/app.config.ts` y los archivos requeridos bajo `frontend/src/environments/` para que las configuraciones de desarrollo y producción seleccionen valores públicos de Supabase sin hardcodearlos

---

## Fase 2: Fundaciones bloqueantes

**Propósito**: Crear el modelo de membresía y las abstracciones compartidas que deben existir antes de
implementar las historias de usuario.

**⚠️ CRÍTICO**: Ninguna tarea de historia de usuario debe comenzar antes de completar esta fase.

- [ ] T005 Crear `supabase/migrations/20261003090000_create_academies.sql` con la tabla `academies` que representa el tenant, sin asociar `academy_id` a `auth.uid()`
- [ ] T006 Crear `supabase/migrations/20261003091000_create_academy_members.sql` con `academy_members`, relación a `auth.users` y `academies`, unicidad `(academy_id, user_id)` y el rol inicial de administrador
- [ ] T007 Crear `supabase/migrations/20261003092000_create_academy_members_rls.sql` con RLS y políticas que permitan al usuario autenticado consultar únicamente su propia membresía; no permitir que el cliente cree o asigne libremente membresías
- [ ] T008 [P] Crear `frontend/src/app/core/auth/models/auth-session.model.ts` y `frontend/src/app/core/academy-context/models/academy-membership.model.ts` para representar sesión autenticada, membresía activa y estados de autorización sin exponer tipos del proveedor a las páginas
- [ ] T009 [P] Crear `frontend/src/app/core/auth/repositories/auth.repository.ts` y `frontend/src/app/core/auth/repositories/supabase-auth.repository.ts` para encapsular login, lectura de sesión, restauración de sesión y cierre de sesión mediante Supabase Auth
- [ ] T010 [P] Crear `frontend/src/app/core/academy-context/repositories/academy-membership.repository.ts` y `frontend/src/app/core/academy-context/repositories/supabase-academy-membership.repository.ts` para consultar la membresía activa del usuario autenticado sin aceptar un `academy_id` arbitrario desde UI
- [ ] T011 Crear `frontend/src/app/core/academy-context/services/academy-context.service.ts` para establecer el contexto solo desde una membresía activa y limpiarlo cuando la sesión sea inválida, inexistente o no autorizada
- [ ] T012 Crear `frontend/src/app/core/auth/services/auth.service.ts` para coordinar autenticación, restauración de sesión y resolución de membresía; debe distinguir los estados no autenticado, autenticado autorizado y autenticado sin membresía activa
- [ ] T013 Crear `frontend/src/app/core/auth/guards/private-route.guard.ts` y actualizar `frontend/src/app/app.routes.ts` para redirigir usuarios sin sesión a `/auth/login` y usuarios con sesión sin membresía a `/auth/access`, sin mostrar contenido privado
- [ ] T014 [P] Crear pruebas unitarias para `AuthService` en `frontend/src/app/core/auth/services/auth.service.spec.ts` que cubran sesión válida con membresía, sesión válida sin membresía, credenciales inválidas y sesión expirada
- [ ] T015 [P] Crear pruebas unitarias para `AcademyContextService` en `frontend/src/app/core/academy-context/services/academy-context.service.spec.ts` que verifiquen que el contexto solo se establece desde una membresía activa y nunca infiere un tenant desde `auth.uid()`
- [ ] T016 [P] Crear pruebas de guard en `frontend/src/app/core/auth/guards/private-route.guard.spec.ts` para validar redirección a login sin sesión y a acceso denegado sin membresía activa

**Punto de control**: La fundación está lista cuando las rutas privadas distinguen identidad,
membresía y tenant, y la autorización no depende de filtros del frontend.

---

## Fase 3: Historia de usuario 1 - Acceder a la gestión privada (Prioridad: P1) 🎯 MVP

**Objetivo**: Permitir a un administrador con credenciales válidas y membresía activa iniciar sesión,
restaurar su sesión y acceder a una ruta privada dentro de su contexto de academia.

**Prueba independiente**: Iniciar sesión con un administrador que tiene una membresía activa y
verificar que llega a una ruta privada sin volver a introducir credenciales mientras la sesión siga
vigente.

### Pruebas para Historia de usuario 1

- [ ] T017 [P] [US1] Crear `frontend/src/app/pages/auth/login.spec.ts` con casos de credenciales válidas, estado de envío y navegación a una ruta privada solo tras autenticación y membresía activa
- [ ] T018 [P] [US1] Crear una prueba de integración de sesión y membresía en `frontend/src/app/core/auth/services/auth.service.spec.ts` usando doubles de repository para comprobar que una sesión restaurada con membresía activa establece el contexto de academia

### Implementación para Historia de usuario 1

- [ ] T019 [US1] Actualizar `frontend/src/app/pages/auth/login.ts` para usar un formulario de correo electrónico/contraseña que delegue el inicio de sesión a `AuthService`, muestre estado de envío y no realice llamadas directas a Supabase
- [ ] T020 [US1] Actualizar `frontend/src/app/pages/auth/auth.routes.ts` para mantener `/auth/login` como ruta pública y habilitar la vista de acceso denegado utilizada por el guard
- [ ] T021 [US1] Actualizar `frontend/src/app/app.routes.ts` para identificar las rutas privadas existentes y aplicar `private-route.guard.ts` sin alterar rutas públicas de SakaiNG
- [ ] T022 [US1] Actualizar `frontend/src/app/pages/auth/login.spec.ts` para comprobar restauración de sesión válida, acceso a ruta privada y ausencia de reautenticación mientras la sesión siga vigente

**Punto de control**: Un administrador con sesión válida y membresía activa puede acceder a una ruta
privada; el contexto de academia se resuelve desde membresía y no desde un identificador de UI.

---

## Fase 4: Historia de usuario 2 - Corregir errores de inicio de sesión (Prioridad: P2)

**Objetivo**: Presentar validaciones y errores comprensibles sin revelar información sensible ni
permitir acceso privado después de un fallo.

**Prueba independiente**: Enviar el formulario con campos vacíos, credenciales inválidas y un error
inesperado; verificar mensajes comprensibles, permanencia en login y ausencia de contenido privado.

### Pruebas para Historia de usuario 2

- [ ] T023 [P] [US2] Ampliar `frontend/src/app/pages/auth/login.spec.ts` con validación de correo electrónico y contraseña obligatorios, incluida la omisión del intento de autenticación cuando falte un campo
- [ ] T024 [P] [US2] Ampliar `frontend/src/app/core/auth/services/auth.service.spec.ts` con mapeo de credenciales inválidas y fallos inesperados a resultados seguros que no revelen si el correo existe

### Implementación para Historia de usuario 2

- [ ] T025 [US2] Actualizar `frontend/src/app/pages/auth/login.ts` con validaciones visibles para correo electrónico y contraseña obligatorios, normalización de espacios del correo y bloqueo de envío mientras falte información
- [ ] T026 [US2] Actualizar `frontend/src/app/core/auth/services/auth.service.ts` para mapear errores de autenticación a resultados de aplicación seguros y comprensibles, sin propagar detalles de Supabase a UI
- [ ] T027 [US2] Actualizar `frontend/src/app/pages/auth/login.ts` para mostrar mensajes diferenciados de campos obligatorios, credenciales inválidas y fallo inesperado, sin exponer información de proveedor, tenant o registro del correo
- [ ] T028 [US2] Actualizar `frontend/src/app/pages/auth/login.spec.ts` con escenarios de mensajes, bloqueo de acceso y reintentos repetidos con credenciales inválidas

**Punto de control**: Los fallos de login son comprensibles, no filtran información sensible y nunca
habilitan acceso a una ruta privada.

---

## Fase 5: Historia de usuario 3 - Proteger funcionalidades privadas (Prioridad: P3)

**Objetivo**: Impedir navegación o acciones privadas sin sesión válida y presentar acceso denegado
cuando exista sesión pero no autorización por membresía.

**Prueba independiente**: Intentar abrir una ruta privada sin sesión, con sesión expirada y con una
sesión válida sin membresía; comprobar que el contenido protegido no se muestra en ningún caso.

### Pruebas para Historia de usuario 3

- [ ] T029 [P] [US3] Ampliar `frontend/src/app/core/auth/guards/private-route.guard.spec.ts` con los escenarios de sesión expirada y sesión válida sin membresía activa
- [ ] T030 [P] [US3] Crear `frontend/src/app/pages/auth/access.spec.ts` para verificar el mensaje de acceso denegado y que no asigna ni muestra un tenant

### Implementación para Historia de usuario 3

- [ ] T031 [US3] Actualizar `frontend/src/app/core/auth/guards/private-route.guard.ts` para revalidar el estado antes de cada navegación protegida, limpiar contexto inválido y bloquear continuidad cuando la sesión expire
- [ ] T032 [US3] Actualizar `frontend/src/app/pages/auth/access.ts` para comunicar acceso denegado por falta de membresía activa sin cerrar una sesión válida ni mostrar contenido privado
- [ ] T033 [US3] Actualizar `frontend/src/app/app.routes.ts` y `frontend/src/app/pages/auth/auth.routes.ts` para que el flujo de acceso denegado sea público para usuarios autenticados sin membresía y no permita retorno a rutas privadas
- [ ] T034 [US3] Actualizar `frontend/src/app/core/auth/guards/private-route.guard.spec.ts` y `frontend/src/app/pages/auth/access.spec.ts` con regresiones de navegación directa y de sesión invalidada durante una acción protegida

**Punto de control**: Ninguna ruta privada expone contenido a una persona sin sesión o sin membresía
activa; una persona autenticada sin membresía conserva sesión y recibe acceso denegado sin tenant.

---

## Fase 6: Pulido y validación transversal

**Propósito**: Comprobar trazabilidad, calidad, seguridad y los escenarios de aceptación completos.

- [ ] T035 [P] Revisar `docs/architecture/supabase.md`, `docs/architecture/supabase-migrations-guide.md` y `docs/engineering/security.md` para confirmar que cualquier ajuste de implementación conserva las políticas de membresía y RLS documentadas
- [ ] T036 [P] Actualizar `frontend/README.md` con los prerrequisitos públicos de configuración local y los comandos `npm test` y `npm run build`, sin registrar valores sensibles
- [ ] T037 Ejecutar `npm test` y `npm run build` desde `frontend/`, corregir fallos de regresión relacionados en los archivos modificados y registrar los resultados en la validación de HU-001
- [ ] T038 Validar manualmente todos los escenarios de `specs/001-admin-login/quickstart.md` contra Development o Testing, incluyendo aislamiento Academy A / Academy B y acceso denegado sin membresía
- [ ] T039 Revisar `specs/001-admin-login/spec.md`, `specs/001-admin-login/plan.md` y `specs/001-admin-login/tasks.md` para confirmar trazabilidad HU-001 → spec → plan → tareas → pruebas antes de preparar el commit

---

## Dependencias y orden de ejecución

### Dependencias por fase

- **Configuración (Fase 1)**: Puede comenzar de inmediato.
- **Fundaciones (Fase 2)**: Depende de la Fase 1 y bloquea todas las historias de usuario.
- **Historias de usuario (Fases 3 a 5)**: Dependen de la Fase 2. Se entregan de forma secuencial por
  prioridad, pues comparten el flujo de autenticación y protección de rutas.
- **Pulido (Fase 6)**: Depende de las historias deseadas completadas.

### Dependencias entre historias

- **US1 (P1)**: Comienza tras Fase 2 y entrega el MVP de acceso autorizado.
- **US2 (P2)**: Depende de US1, pues amplía el formulario y los resultados de autenticación.
- **US3 (P3)**: Depende de las fundaciones y se integra con US1 para proteger las rutas privadas y
  manejar la autorización sin membresía.

### Dentro de cada historia

- Las pruebas se escriben antes de la implementación correspondiente y deben fallar inicialmente.
- Los repositories preceden a los services; los services preceden a páginas y guards.
- Cada punto de control debe validarse antes de continuar a la siguiente prioridad.

## Oportunidades de ejecución en paralelo

- T002 y T003 pueden ejecutarse en paralelo.
- T008, T009 y T010 pueden ejecutarse en paralelo después de T001 a T004.
- T014, T015 y T016 pueden ejecutarse en paralelo después de T011 a T013.
- Las pruebas marcadas `[P]` de cada historia pueden ejecutarse en paralelo si no se edita el mismo
  archivo de prueba simultáneamente.

## Ejemplo paralelo: Historia de usuario 1

```text
T017: Crear `frontend/src/app/pages/auth/login.spec.ts` con casos de credenciales válidas.
T018: Crear prueba de integración de sesión y membresía en
      `frontend/src/app/core/auth/services/auth.service.spec.ts`.
```

## Estrategia de implementación

### MVP primero (solo Historia de usuario 1)

1. Completar la Fase 1: Configuración.
2. Completar la Fase 2: Fundaciones.
3. Completar la Fase 3: Historia de usuario 1.
4. Detenerse y validar la historia de forma independiente.

### Entrega incremental

1. Completar Configuración y Fundaciones.
2. Entregar US1 y validar acceso autorizado.
3. Añadir US2 y validar errores seguros.
4. Añadir US3 y validar protección de rutas y acceso denegado.
5. Ejecutar la validación transversal final.

## Notas

- Las tareas `[P]` modifican archivos distintos y no tienen dependencias incompletas.
- La etiqueta de historia mantiene trazabilidad desde cada tarea a la especificación.
- Se debe detener la implementación ante cualquier contradicción entre este plan, la Constitución o
  la arquitectura de seguridad y resolverla mediante el flujo Spec Kit correspondiente.
