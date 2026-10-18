---

description: "Lista de tareas para completar el acceso y la sesión (EP-01)"
---

# Tareas: Acceso y sesión

**Input**: Documentos de diseño de `/specs/005-access-and-session/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Se incluyen tareas de prueba porque la spec las exige (SC-007, FR-017: cada criterio de aceptación con una prueba o un paso de validación). La matriz está en `contracts/acceptance-coverage.md`.

**Organización**: Las tareas se agrupan por historia de la spec. La configuración y el motivo del cierre los necesitan US1 y US2, por eso están en la Fase 2. Orden: US1, US2 y US3 (P1), US4 y US5 (P2).

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: Puede ejecutarse en paralelo (archivo distinto y sin dependencias pendientes).
- **[Story]**: Historia de la spec (US1 a US5).

## Convenciones

- Rutas relativas a la raíz del repositorio; código en `frontend/src/app/`.
- Antes de empezar se leen todos los documentos de la sección «Documentación de referencia obligatoria» de `plan.md` (principio XI).
- Capas: `InactivityService` y las pantallas usan `AuthService`; solo `supabase-auth.repository.ts` usa el SDK.
- Estilos solo por preset, Tailwind y layout; textos en español de Colombia.
- Pruebas `*.spec.ts` junto al archivo, con Vitest, dobles y reloj simulado (`vi.useFakeTimers`, `vi.setSystemTime`). **Durante el desarrollo solo se corren las de la zona tocada** (`npx ng test --watch=false --include <ruta>` o `npm run test:changed` desde `frontend/`). El conjunto completo se corre una sola vez, en T019. Si una prueba falla de forma intermitente, se informa y no se repite el conjunto.
- Sin migraciones ni cambios en el seed (research R1).

## Fase 1: Configuración

- [X] T001 Añadir `sessionInactivityMinutes` a `AppConfig` y validar en `validateAppConfig` que sea «entero > 0» en frontend/src/app/core/config/app-config.ts. Poner `sessionInactivityMinutes: 60` en frontend/src/environments/environment.ts y en frontend/src/environments/environment.development.ts, con un comentario que indique que se cambia a 2 solo para la validación del quickstart. Actualizar los dobles de `APP_CONFIG` en las pruebas que lo construyan (buscar `APP_CONFIG` en `*.spec.ts`)
- [X] T002 [P] Prueba de la validación nueva (valor 0, negativo o decimal falla; 60 pasa) en frontend/src/app/core/config/app-config.spec.ts (crear si no existe)

---

## Fase 2: Fundaciones (bloqueantes)

- [X] T003 Ampliar `AuthService` en frontend/src/app/core/auth/auth.service.ts según `contracts/session-contracts.md`: tipo `SignOutReason = 'manual' | 'inactivity'`, señal de solo lectura `signOutReason`, `signOut(reason = 'manual')` que guarda el motivo antes de navegar a `/auth/login`. `signIn()` y `completeEmailLink()` borran el motivo. `signOut()` ignora llamadas mientras otra está en curso
- [X] T004 [P] Crear frontend/src/app/core/auth/auth.service.spec.ts:
  - restaurar con y sin sesión;
  - una segunda llamada a `signOut()` mientras la primera está en curso no repite el cierre (doble toque);
  - `signOut()` deja la sesión nula, limpia el contexto de academia y navega a `/auth/login` con motivo `manual`, aunque el repositorio falle;
  - `signOut('inactivity')` guarda ese motivo;
  - `signIn()` borra el motivo.

**Punto de control**: el motivo del cierre existe y está probado; las historias pueden empezar.

---

## Fase 3: Historia 1 — Cierre de sesión por inactividad (Prioridad: P1) 🎯 MVP

**Objetivo**: HU-015 CA-003 y CA-004, HU-001 CA-006 (DEC-28).

**Prueba independiente**: quickstart sección 1 en el celular con `sessionInactivityMinutes: 2`.

- [X] T005 [US1] Crear frontend/src/app/core/auth/inactivity.service.ts según `contracts/session-contracts.md` y research R2 a R5:
  - **Hora guardada**: clave `playertech.lastActivityAt` en `localStorage`, con lecturas y escrituras en `try/catch` y respaldo en memoria.
  - **`isExpired()`**: aplica la tabla de vigencia de `data-model.md`. Sin valor → vigente; `ahora − última > minutos × 60 000` → vencida; `última > ahora + 60 000` → vencida.
  - **`markActivity()`**: guarda la hora actual.
  - **`start(onExpire, isAuthenticated)`**: con un `effect` sobre la señal de sesión recibida. No inyecta `AuthService` (U2 en `contracts/session-contracts.md`).
    - Con sesión: escuchadores pasivos `pointerdown`, `keydown`, `wheel` y `scroll` (captura) que llaman a `markActivity()` como mucho una vez cada 5 s; comprobación cada 30 s, en `visibilitychange` (visible), `focus` y `pageshow`.
    - Sin sesión: retira escuchadores e intervalo y borra la clave.
    - Al vencer, llama a `onExpire()` una sola vez por sesión.
- [X] T006 [US1] Comprobación al arrancar en frontend/src/app/core/auth/auth.service.ts (research R4): en `restore()`, si hay sesión y `InactivityService.isExpired()`, cerrar **sin navegar**: borrar la sesión local con el repositorio (ignorando su error), dejar la sesión nula y guardar el motivo `inactivity`, antes de marcar `ready`. `authGuard` hace la redirección y conserva `returnUrl`. En `signIn()` y `completeEmailLink()`, llamar a `markActivity()`. Añadir un método que arranca la vigilancia con `inactivity.start(() => this.signOut('inactivity'), this.isAuthenticated)`; la dependencia va solo de `AuthService` a `InactivityService`
- [X] T007 [US1] Arrancar la vigilancia en frontend/src/app.config.ts: en el inicializador existente, tras `restore()`, llamar al método de `AuthService` que inicia `InactivityService`. El orden respecto a otros inicializadores no importa porque la vigilancia reacciona a la sesión con un `effect`
- [X] T008 [P] [US1] Mostrar el aviso en frontend/src/app/features/auth/login/login.ts: con `auth.signOutReason() === 'inactivity'`, un `p-message` de severidad `info` arriba del formulario con «Tu sesión se cerró por inactividad. Ingresa de nuevo para continuar.»
- [X] T009 [P] [US1] Crear frontend/src/app/core/auth/inactivity.service.spec.ts con reloj simulado:
  - vence a los 60 min sin interacción;
  - la interacción reinicia el tiempo;
  - eventos repetidos en 5 s escriben una sola vez;
  - al volver de segundo plano (`visibilitychange`) con la hora vencida, cierra;
  - la escritura de otra pestaña en la clave mantiene la sesión;
  - la hora en el futuro cuenta como vencida;
  - sin valor guardado es vigente;
  - sin sesión no escucha y borra la clave;
  - solo llama una vez a `signOut('inactivity')`;
  - con `localStorage` que lanza error, sigue funcionando en memoria.
- [X] T010 [P] [US1] Ampliar las pruebas:
  - frontend/src/app/core/auth/auth.service.spec.ts: `restore()` con sesión vencida deja la sesión nula y el motivo `inactivity` antes de `ready`, **sin navegar**; con sesión vigente la conserva (CA-006).
  - frontend/src/app/features/auth/login/login.spec.ts: aviso con motivo `inactivity`; sin aviso con motivo `manual` o nulo.
- [X] T011 [US1] Correr solo las pruebas de la zona: `npx ng test --watch=false --include src/app/core/auth --include src/app/features/auth/login` desde frontend/

**Punto de control**: el cierre por inactividad funciona y está probado; se puede validar en el celular (quickstart 1).

---

## Fase 4: Historia 2 — Cerrar sesión de forma segura (Prioridad: P1)

**Objetivo**: HU-015 CA-001, CA-002 y la regla de no cerrar otros dispositivos.

**Prueba independiente**: quickstart sección 2.

- [X] T012 [US2] Cerrar sesión solo en este dispositivo en frontend/src/app/core/auth/data/supabase-auth.repository.ts: `this.auth.signOut({ scope: 'local' })` (research R7). Añadir la prueba en frontend/src/app/core/auth/data/supabase-auth.repository.spec.ts que comprueba el alcance `local`
- [X] T013 [US2] Verificar el botón «atrás» (research R8) con el quickstart 2.2 en el celular y en el escritorio. Solo si muestra datos: en `InactivityService`, con `pageshow` y `event.persisted` sin sesión, recargar la página. Anotar el resultado en specs/005-access-and-session/quickstart.md

---

## Fase 5: Historia 3 — Iniciar sesión (Prioridad: P1)

**Objetivo**: verificar CA-001 a CA-008 de HU-001.

**Prueba independiente**: quickstart sección 3.

- [X] T014 [P] [US3] (Ya cubierto por la spec 002: `it.each` de `membership.guard.spec`.) Añadir a frontend/src/app/core/auth/guards/membership.guard.spec.ts:
  - academia `suspended` → `/auth/suspended` (CA-007);
  - sin membresía (`none`) → `/auth/access-denied` (CA-008).
- [X] T015 [US3] Recorrer el quickstart 3 contra Supabase local (estados de 3.4 y 3.5 preparados por SQL y revertidos). Corregir lo que no cumpla en frontend/src/app/features/auth/ y anotarlo en specs/005-access-and-session/quickstart.md

---

## Fase 6: Historia 4 — Recuperar la contraseña (Prioridad: P2)

**Objetivo**: verificar CA-001 a CA-006 de HU-016.

**Prueba independiente**: quickstart sección 4 con Mailpit.

- [X] T016 [US4] Recorrer el quickstart 4, incluido 4.6 (enlace abierto con otra sesión iniciada). Corregir lo que no cumpla en frontend/src/app/features/auth/forgot-password/, reset-password/ o callback/ con su prueba, y eliminar al final solo la cuenta de prueba creada en 3.3

---

## Fase 7: Historia 5 — Pantallas de acceso revisadas (Prioridad: P2)

**Objetivo**: principio XIII en las 7 pantallas de acceso.

**Prueba independiente**: quickstart sección 5.

- [X] T017 [US5] Ejecutar `/impeccable audit` y `/impeccable critique` (con `IMPECCABLE_NO_TELEMETRY=1 DO_NOT_TRACK=1`) y el detector sobre frontend/src/app/features/auth/, a 360 px y en escritorio, en modo claro y oscuro. Incluir el aviso de inactividad
- [X] T018 [US5] Corregir los hallazgos críticos y altos solo en el preset, en Tailwind o en el layout (AGENTS.md), y correr las pruebas de frontend/src/app/features/auth

---

## Fase 8: Pulido y cierre

- [X] T019 Ejecutar **una vez** el conjunto completo desde frontend/: `npm run test:ci`, `npm run lint`, `npm run check:styles`, `npm run build` y `npm run check:bundle`
- [X] T020 Validación en el celular del owner: quickstart 1 con `sessionInactivityMinutes: 2`. Al terminar, **regresar el valor a 60** en frontend/src/environments/environment.development.ts
- [X] T021 [P] Completar «Resultados» en specs/005-access-and-session/quickstart.md y la columna de cobertura de specs/005-access-and-session/contracts/acceptance-coverage.md
- [X] T022 [P] Marcar HU-001, HU-015 y HU-016 como «Terminada (entorno local)» en docs/backlog/user-stories/ y actualizar la tabla de docs/backlog/epics/EP-01-access-and-session.md

---

## Dependencias y orden de ejecución

- **Fase 1 → Fase 2 → historias.** T003 bloquea US1 y US2.
- **US1** (T005 a T011): T005 → T006 → T007; T008, T009 y T010 en paralelo tras T005 y T006. `InactivityService` no depende de `AuthService` (U2).
- **US2** (T012, T013): independiente de US1, salvo T013, que usa `InactivityService` solo si hace falta la corrección.
- **US3, US4**: solo verificación; dependen de la Fase 2.
- **US5**: después de T008 (incluye el aviso nuevo).
- **Fase 8**: al final. T020 requiere que el owner tenga el celular a mano.

## Oportunidades de paralelismo

- T002 y T004 (pruebas de archivos distintos).
- T008, T009 y T010 dentro de US1.
- T012 y T014 son independientes entre sí y de US1.
- T021 y T022.

## Estrategia de implementación

### MVP primero

Fases 1 y 2, y US1 (T001 a T011): con eso el owner ya puede validar el cierre por inactividad en el celular.

### Entrega incremental

US2 (alcance local y botón «atrás») → US3 y US4 (verificación) → US5 (revisión) → cierre. Todo en un solo PR de la spec 005.

## Notas

- Si una verificación (T013, T015, T016) descubre algo que no cumple, se corrige en esta spec con su prueba; si exige cambios en la base de datos, se detiene y se vuelve al plan.
- `supabase/config.toml` no se incluye en el commit (línea de la IP local).
