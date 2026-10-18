---

description: "Lista de tareas para completar el alta de academia (EP-00)"
---

# Tareas: Alta de academia

**Input**: Documentos de diseño de `/specs/006-academy-registration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Se incluyen porque la spec las exige (SC-007, FR-013). Matriz en `contracts/acceptance-coverage.md`.

**Organización**: Por historia de la spec. El reenvío (US3) es lo único nuevo y necesita la operación del repositorio, que está en la Fase 2. Orden: US3 (P1, la única con código nuevo), US1 y US2 (P1, verificación), US4 y US5 (P2).

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: Puede ejecutarse en paralelo (archivo distinto y sin dependencias pendientes).
- **[Story]**: Historia de la spec (US1 a US5).

## Convenciones

- Rutas relativas a la raíz del repositorio; código en `frontend/src/app/`.
- Antes de empezar se leen los documentos de «Documentación de referencia obligatoria» de `plan.md` (principio XI).
- Capas: la pantalla usa `RegistrationService` → `AuthService` → `AuthRepository`; solo `supabase-auth.repository.ts` usa el SDK.
- Pruebas `*.spec.ts` junto al archivo, con Vitest y dobles. **Durante el desarrollo solo las de la zona tocada** (`npx ng test --watch=false --include src/app/features/auth --include src/app/core/auth`); el conjunto completo una sola vez, en T014. Si una prueba falla de forma intermitente, se guarda el error completo y se informa.
- Sin migraciones (research R1).

## Fase 1: Configuración

Sin tareas: no hay dependencias ni configuración nuevas.

---

## Fase 2: Fundaciones (bloqueantes)

- [ ] T001 Añadir `abstract resendVerification(email: string): Promise<void>` en frontend/src/app/core/auth/data/auth.repository.ts e implementarlo en frontend/src/app/core/auth/data/supabase-auth.repository.ts según `contracts/resend-contracts.md`: `auth.resend({ type: 'signup', email, options: { emailRedirectTo: \`${location.origin}${CALLBACK_PATH}\` } })`. Mapear el error con `mapSupabaseError` y lanzarlo solo si su código está en el mismo conjunto visible que la recuperación (`rate_limited`, `network`), reutilizando la constante existente
- [ ] T002 Añadir `resendVerification(email)` en frontend/src/app/core/auth/auth.service.ts (delega en el repositorio) y en frontend/src/app/features/auth/services/registration.service.ts (delega en `AuthService`)
- [ ] T003 [P] Pruebas en frontend/src/app/core/auth/data/supabase-auth.repository.spec.ts (añadir `resend` al doble de `auth`):
  - llama a `resend` con `type: 'signup'`, el correo y el retorno a `/auth/callback`;
  - resuelve sin error ante un error que revelaría la cuenta (DEC-12);
  - lanza `rate_limited` ante `over_email_send_rate_limit`.

**Punto de control**: la operación de reenvío existe y está probada.

---

## Fase 3: Historia 3 — Reenviar el correo de verificación (Prioridad: P1) 🎯 MVP

**Objetivo**: FR-007 a FR-010 (regla de HU-014 del 2026-10-17).

**Prueba independiente**: quickstart sección 3.

- [ ] T004 [US3] Ampliar frontend/src/app/features/auth/verify-email/verify-email.ts según `contracts/resend-contracts.md` y `data-model.md`:
  - **Campo «Correo»** solo sin parámetro `email` (obligatorio, formato de correo, errores junto al campo con `fieldA11y` de `shared/forms`).
  - **Botón «Reenviar correo»** (`outlined`, ancho completo, estado de carga mientras envía, ignora toques repetidos).
  - **Espera**: `secondsLeft` vale 60 al llegar con `email` y tras cada envío correcto, y baja cada segundo con un intervalo que se limpia al destruir la pantalla. Con valor mayor que 0, el botón está deshabilitado y su etiqueta es «Reenviar en m:ss».
  - **Confirmación** (`p-message` info): «Si tu cuenta está pendiente de verificar, te enviamos un enlace nuevo. Ábrelo desde este mismo navegador.»
  - **Error** (`p-message` error): mensaje del catálogo para `rate_limited` o `network`.
  - Se conservan el texto y el enlace existentes.
- [ ] T005 [US3] Crear frontend/src/app/features/auth/verify-email/verify-email.spec.ts con Testing Library y reloj simulado:
  - muestra el correo recibido;
  - al llegar con `email` el botón espera 60 s («Reenviar en 1:00» → habilitado tras 60 s);
  - reenviar llama al servicio con el correo, muestra la confirmación y reinicia la espera;
  - un doble toque envía una sola vez;
  - `rate_limited` muestra su mensaje;
  - sin `email` muestra el campo, valida el formato y reenvía al correo escrito.
- [ ] T005a [US3] Caminos al reenvío (FR-010a):
  - **Inicio de sesión**: en frontend/src/app/features/auth/login/login.ts, cuando el error es `email_not_confirmed`, añadir bajo el mensaje el enlace «Reenviar el correo de verificación» a `/auth/verify-email?email=<correo escrito>`.
  - **Retorno de enlaces**: en frontend/src/app/features/auth/callback/callback.ts, en la pantalla de enlace no válido, añadir el enlace «Reenviar el correo de verificación» a `/auth/verify-email`, junto a los existentes. El rótulo «Solicitar un enlace nuevo» pasa a «Recuperar mi contraseña», porque lleva a recuperar contraseña.
  - Pruebas en frontend/src/app/features/auth/login/login.spec.ts (con `email_not_confirmed` aparece el enlace con el correo) y frontend/src/app/features/auth/callback/callback.spec.ts (la pantalla de enlace no válido ofrece el reenvío).
- [ ] T006 [US3] Correr solo las pruebas de la zona: `npx ng test --watch=false --include src/app/features/auth --include src/app/core/auth` desde frontend/

**Punto de control**: el reenvío funciona y está probado.

---

## Fase 4: Historias 1 y 2 — Registro, verificación y academia lista (Prioridad: P1)

**Objetivo**: verificar CA-001 a CA-007 de HU-014.

**Prueba independiente**: quickstart secciones 1 a 3.

- [ ] T007 [US1] Recorrer el quickstart 1 (registro, correo ya registrado y su variante en mayúsculas) contra Supabase local. Comprobar si frontend/src/app/features/auth/register/register.spec.ts cubre el doble toque en «Crear cuenta» (un solo registro); si no, añadir la prueba. Corregir lo que no cumpla en frontend/src/app/features/auth/register/ con su prueba
- [ ] T008 [US2] Recorrer el quickstart 2 (verificación desde Mailpit en el mismo navegador y SQL de la academia creada: nombre, plan Free, «Sede principal» de tipo lugar de entrenamiento y correo de contacto)
- [ ] T009 [US3] Recorrer el quickstart 3 (reenvío de punta a punta, incluido un correo no registrado y uno ya verificado)

---

## Fase 5: Historia 4 — Registro sin datos a medias (Prioridad: P2)

- [ ] T010 [US4] Recorrer el quickstart 4: registro directo contra Auth local con metadatos inválidos y comprobación por SQL de que no queda ningún dato. Confirmar que `register.spec` «muestra el error del registro» cubre el mensaje y que el formulario conserva lo escrito; si no lo comprueba, añadir esa aserción en frontend/src/app/features/auth/register/register.spec.ts

---

## Fase 6: Historia 5 — Pantallas revisadas (Prioridad: P2)

- [ ] T011 [US5] Detector de Impeccable (con `IMPECCABLE_NO_TELEMETRY=1 DO_NOT_TRACK=1`) sobre frontend/src/app/features/auth/register y frontend/src/app/features/auth/verify-email. Medición a 360 px en claro y oscuro (desbordamiento y controles de al menos 44 px) y revisión visual de la cuenta regresiva y los mensajes
- [ ] T012 [US5] Corregir los hallazgos críticos y altos solo en el preset, en Tailwind o en el layout, y correr las pruebas de frontend/src/app/features/auth

---

## Fase 7: Pulido y cierre

- [ ] T013 Eliminar solo las cuentas `qa.*@playertech.test` creadas en la validación y comprobar que las academias A y B siguen `active`
- [ ] T014 Ejecutar **una vez** desde frontend/: `npm run test:ci`, `npm run lint`, `npm run check:styles`, `npm run build` y `npm run check:bundle`; y `npm run db:test` desde la raíz
- [ ] T015 [P] Completar «Resultados» en specs/006-academy-registration/quickstart.md, con los tiempos medidos de SC-001 (registro en menos de 3 min) y SC-005 (correo nuevo en menos de 2 min), y la cobertura en specs/006-academy-registration/contracts/acceptance-coverage.md
- [ ] T016 [P] Marcar HU-014 como «Terminada (entorno local) · spec 006» en docs/backlog/user-stories/HU-014-academy-registration.md y actualizar la tabla de docs/backlog/epics/EP-00-academy-onboarding.md

---

## Dependencias y orden de ejecución

- Fase 2 (T001 → T002; T003 en paralelo tras T001) bloquea US3.
- US3: T004 → T005 → T005a → T006.
- T007 a T010 requieren el servidor de desarrollo y Supabase local; T009 requiere US3.
- US5 después de T004 (incluye la pantalla ampliada).
- Cierre al final.

## Oportunidades de paralelismo

- T003 con T002.
- T007, T008 y T010 entre sí (cuentas distintas).
- T015 y T016.

## Estrategia de implementación

### MVP primero

Fase 2 y US3 (T001 a T006): el reenvío es lo único nuevo y desbloquea al owner cuyo correo no llegó.

### Entrega incremental

Verificación (T007 a T010) → revisión (T011, T012) → cierre. Un solo PR de la spec 006.

## Notas

- Si una verificación descubre algo que exige cambios en la base de datos, se detiene y se vuelve al plan.
- `supabase/config.toml` no se incluye en el commit.
