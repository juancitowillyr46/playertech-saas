---

description: "Lista de tareas para la gestión de la academia (EP-09)"
---

# Tareas: Gestión de la academia

**Input**: Documentos de diseño de `/specs/007-academy-management/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Se incluyen porque la spec las exige (SC-007, FR-019). Matriz en `contracts/acceptance-coverage.md`.

**Organización**: Por historia de la spec. El modelo, el repositorio, el servicio, `purge` y el contexto los comparten US1 y US2, por eso están en la Fase 2. Orden: US1 (perfil), US2 (logo), US3 (inicio), US4 (revisión).

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: Puede ejecutarse en paralelo (archivo distinto y sin dependencias pendientes).
- **[Story]**: Historia de la spec (US1 a US4).

## Convenciones

- Rutas relativas a la raíz del repositorio; código en `frontend/src/app/`.
- Antes de empezar se leen los documentos de «Documentación de referencia obligatoria» de `plan.md` (principio XI).
- Capas: la pantalla usa `AcademyProfileService` → `AcademyProfileRepository`; solo `supabase-academy-profile.repository.ts` y `supabase-file-storage.repository.ts` usan el SDK. La academia sale de `AcademyContextService`.
- Patrón de la spec 004 (Sedes) para el formulario, las validaciones, los avisos, `busy` y `cleanInput`.
- ADR-017: sin usos nuevos de `auth.uid()` ni referencias nuevas al esquema `auth`.
- Pruebas `*.spec.ts` junto al archivo. **Durante el desarrollo, solo las de la zona tocada** (`npx ng test --watch=false --include <ruta>` desde `frontend/`); el conjunto completo una sola vez, en T024. Si una prueba falla de forma intermitente, se guarda el error completo y se informa.
- Sin migraciones (research R1).

## Fase 1: Configuración

- [X] T001 Crear la estructura de frontend/src/app/features/academy-profile/ (`models/`, `data/`, `services/`, `validators/`, `pages/academy-profile-page/`) con academy-profile.routes.ts. En frontend/src/app/features/settings/settings.routes.ts, cambiar la ruta `academy` del `PlaceholderPage` a `loadChildren` de la feature nueva (título «Academia · PlayerTech»). Registrar `{ provide: AcademyProfileRepository, useClass: SupabaseAcademyProfileRepository }` en frontend/src/app.config.ts

---

## Fase 2: Fundaciones (bloqueantes)

- [X] T002 [P] Modelos en frontend/src/app/features/academy-profile/models/academy-profile.models.ts según `data-model.md`: `AcademyProfile { id, name, contactEmail, contactPhone, address, city, planName, logo: StoredFile | null, logoUrl: string | null }` y `AcademyProfileInput { name, contactEmail, contactPhone, address, city }` (opcionales `string | null`)
- [X] T003 Repositorio abstracto en frontend/src/app/features/academy-profile/data/academy-profile.repository.ts e implementación en frontend/src/app/features/academy-profile/data/supabase-academy-profile.repository.ts (`contracts/profile-contracts.md`, research R3):
  - **`getProfile()`**: `academies` (los cinco campos y `logo_file_id`), `subscriptions` activa → `plans(name)` y el archivo vigente del logo en `files` (`deleted_at` nulo). La URL sale de `FileStorageRepository.getUrl`.
  - **`updateProfile(input)`**: `update` de `name`, `contact_email`, `contact_phone`, `address` y `city` sobre la academia del contexto, con `select` de vuelta. Sin fila afectada → `not_found`.
  - **`setLogo(fileId)`**: `update logo_file_id`.
  - Sin academia en el contexto → `forbidden`. Errores con `mapSupabaseError`. Traducción snake_case ↔ camelCase solo aquí.
- [X] T004 [P] Pruebas en frontend/src/app/features/academy-profile/data/supabase-academy-profile.repository.spec.ts:
  - traduce las filas al modelo;
  - `updateProfile` solo envía los cinco campos y solo sobre `academies` (CA-005);
  - sin fila → `not_found`;
  - sin academia → `forbidden`;
  - `setLogo` con un id y con `null`.
- [X] T005 Añadir `abstract purge(file: StoredFile): Promise<void>` en frontend/src/app/core/storage/data/file-storage.repository.ts e implementarlo en frontend/src/app/core/storage/data/supabase-file-storage.repository.ts: primero `update files set deleted_at` y después `storage.from(bucket).remove([storageKey])`; errores con `mapSupabaseError` (research R4). Pruebas en frontend/src/app/core/storage/data/supabase-file-storage.repository.spec.ts (crear o ampliar): orden marcar → borrar; error al marcar no borra la imagen
- [X] T006 [P] `applyAcademyChanges(changes: Partial<Pick<CurrentAcademy, 'name' | 'logoFileId'>>)` en frontend/src/app/core/academy-context/academy-context.service.ts: actualiza la academia actual sin cambiar `status` (research R6), con su prueba en frontend/src/app/core/academy-context/academy-context.service.spec.ts

**Punto de control**: repositorio, `purge` y contexto listos.

---

## Fase 3: Historia 1 — Editar el perfil (Prioridad: P1) 🎯 MVP

**Objetivo**: HU-017 CA-001 a CA-005 y CA-009.

**Prueba independiente**: quickstart secciones 1 y 3.

- [X] T007 [US1] `AcademyProfileService` en frontend/src/app/features/academy-profile/services/academy-profile.service.ts:
  - señales `profile`, `status` (`loading` | `ready` | `error`) y `busy`;
  - `load()`;
  - `save(input)`: `cleanInput` (recorta; opcionales vacíos → `null`), guarda, actualiza `profile` y llama a `applyAcademyChanges({ name })`;
  - ignora llamadas con `busy`; recarga ante `not_found`.
- [X] T008 [P] [US1] Pruebas del servicio en frontend/src/app/features/academy-profile/services/academy-profile.service.spec.ts: carga, guardado con limpieza, actualización del contexto, doble llamada ignorada, recarga ante `not_found`
- [X] T009 [US1] Pantalla en frontend/src/app/features/academy-profile/pages/academy-profile-page/academy-profile-page.ts según `contracts/profile-contracts.md` y `ui.md`:
  - cabecera «Academia» con el plan de solo lectura;
  - formulario con nombre (obligatorio), teléfono (`type=tel`), correo de contacto (`Validators.email`, ayuda «No cambia el correo con el que inicias sesión.»), dirección (ayuda «Dirección de contacto de la academia. Las de tus sedes se editan en Sedes.», con enlace a Sedes; FR-007a) y ciudad;
  - errores junto al campo con `fieldA11y` de `shared/forms`;
  - «Guardar» con carga y aviso «Cambios guardados.»;
  - estados de carga y error con reintento.

  Móvil primero; estilos solo por preset y Tailwind.
- [X] T010 [US1] Confirmación al navegar dentro de la app con cambios sin guardar (cerrar o recargar la pestaña no la pide): guard `canDeactivate` en frontend/src/app/features/academy-profile/academy-profile.routes.ts que consulta a la pantalla. Si el formulario está modificado, `ConfirmationService` muestra «Tienes cambios sin guardar» con «Descartar» y «Seguir editando»
- [X] T011 [US1] Pruebas de la pantalla en frontend/src/app/features/academy-profile/pages/academy-profile-page/academy-profile-page.spec.ts:
  - muestra los datos y el plan (CA-001);
  - guarda y avisa (CA-002);
  - nombre vacío o con espacios (CA-003);
  - correo inválido (CA-004);
  - confirmación al salir con cambios.

  Correr solo la zona: `npx ng test --watch=false --include src/app/features/academy-profile --include src/app/core`

**Punto de control**: perfil editable y probado.

---

## Fase 4: Historia 2 — Logo (Prioridad: P1)

**Objetivo**: HU-017 CA-006 a CA-008 y la regla del logo (DEC-22, 2026-10-18).

**Prueba independiente**: quickstart sección 2.

- [X] T012 [P] [US2] `validateLogoFile(file): Promise<'type' | 'size' | null>` en frontend/src/app/features/academy-profile/validators/logo-file.ts: tipo «`image/jpeg`, `image/png`», primeros bytes (PNG `89 50 4E 47`, JPEG `FF D8 FF`) y tamaño «hasta 5 242 880 bytes (5 MB)». Pruebas en logo-file.spec.ts: PNG y JPEG válidos, tipo incorrecto, `.png` con contenido de texto, más de 5 MB
- [X] T013 [P] [US2] `prepareLogoImage(file): Promise<File>` en frontend/src/app/features/academy-profile/data/logo-image.ts (research R5b):
  - función pura `fitWithin(width, height, 512)`: el lado mayor como máximo 512 px, sin agrandar;
  - dibujo en `canvas` y exportación en el mismo formato (JPEG con calidad 0,85; PNG);
  - reintento si supera 1 048 576 bytes.

  Pruebas de `fitWithin` en logo-image.spec.ts (el `canvas` se valida en el quickstart 2.4).
- [X] T014 [US2] En `AcademyProfileService`:
  - **`replaceLogo(file)`**: valida → prepara → `FileStorageRepository.upload({ bucket: 'public-assets', module: 'academy', entityId: academyId })` → `setLogo(nuevo.id)` → `purge(anterior)` (research R4).
    - Si falla `setLogo`, purga el nuevo y conserva el anterior.
    - Si falla el `purge` del anterior, no lo muestra.
  - **`removeLogo()`**: `setLogo(null)` → `purge(anterior)`.
  - Ambas actualizan `profile` (con la nueva URL) y `applyAcademyChanges({ logoFileId })`. El error de validación se devuelve para mostrarlo junto al logo.
- [X] T015 [P] [US2] Pruebas en academy-profile.service.spec.ts:
  - orden preparar → subir → asignar → purgar;
  - fallo al asignar: purga el nuevo y conserva el anterior;
  - archivo inválido: no sube nada;
  - retirar: asigna `null` y purga.
- [X] T016 [US2] Sección del logo en la pantalla:
  - imagen actual (`logoUrl`) o iniciales;
  - selector de archivo accesible (input nativo `accept="image/jpeg,image/png"` con un botón de al menos 44 px): «Subir logo» o «Cambiar logo»;
  - «Retirar logo» con confirmación;
  - ayuda «JPG o PNG, hasta 5 MB.»;
  - error junto al logo («Usa una imagen JPG o PNG.» / «La imagen pesa más de 5 MB.»);
  - estado de carga.

  Pruebas en academy-profile-page.spec.ts: error de archivo, confirmación de retiro.

---

## Fase 5: Historia 3 — «Completa tu academia» (Prioridad: P1)

**Objetivo**: HU-032 CA-001 a CA-004 con las tareas del 2026-10-18.

**Prueba independiente**: quickstart sección 4.

- [X] T017 [US3] Ampliar el inicio:
  - frontend/src/app/features/home/models/home-summary.models.ts: `primaryVenue.address`, `HomeTask { key, label, done, route | null }`, `tasks` y `completedCount` en `HomeSummary`; retirar `RECOMMENDED_TASKS`.
  - frontend/src/app/features/home/data/supabase-home-summary.repository.ts: leer `address` de la sede principal y `contact_phone` y `address` de la academia.
  - frontend/src/app/features/home/services/home-summary.service.ts: calcular las tareas con la tabla de `data-model.md` («Academia creada» siempre; «Dirección de la sede principal» con dirección de la sede no vacía; «Logo de la academia» con logo vigente; «Teléfono y dirección de la academia» con ambos no vacíos).
- [X] T018 [US3] En frontend/src/app/features/home/pages/home-page/home-page.ts:
  - contador «n de 4»;
  - cada tarea con su estado en texto («Completa» o «Pendiente») e icono decorativo;
  - las pendientes enlazan con su ruta;
  - sin tarjeta con 4 de 4.

  Actualizar la documentación del componente (ya no es una maqueta).
- [X] T019 [P] [US3] Pruebas en frontend/src/app/features/home/services/home-summary.service.spec.ts (cálculo con cada tarea completa o pendiente, incluida la sede con ciudad y sin dirección) y frontend/src/app/features/home/pages/home-page/home-page.spec.ts (sustituir la prueba de la maqueta: estado y «n de 4», enlaces de las pendientes, sin tarjeta con 4 de 4). Correr solo `--include src/app/features/home`

---

## Fase 6: Historia 4 — Pantallas revisadas (Prioridad: P2)

- [X] T020 [US4] Recorrer el quickstart 1 a 4 contra Supabase local, midiendo el tiempo de SC-001 y el peso de los logos de SC-003a. Registrar antes los datos de la academia A y restaurarlos al terminar. Generar las imágenes de prueba con un script en el scratchpad
- [X] T021 [US4] Detector de Impeccable (`IMPECCABLE_NO_TELEMETRY=1 DO_NOT_TRACK=1`) sobre frontend/src/app/features/academy-profile y frontend/src/app/features/home. Medición a 360 px en claro y oscuro (desbordamiento, controles de al menos 44 px) y revisión visual del perfil (con y sin logo, con errores) y de la tarjeta (1 de 4, 3 de 4)
- [X] T022 [US4] Corregir los hallazgos críticos y altos solo en el preset, en Tailwind o en el layout, y correr las pruebas de las zonas tocadas

---

## Fase 7: Pulido y cierre

- [X] T023 Verificar la regla de portabilidad (ADR-017): `grep` de `auth.uid` y `auth.users` sin apariciones nuevas en el código y las migraciones de esta spec
- [X] T024 (Ajustada por el owner el 2026-10-18: solo las pruebas de la spec, más lint, check:styles y build) Ejecutar **una vez** desde frontend/: `npm run test:ci`, `npm run lint`, `npm run check:styles`, `npm run build` y `npm run check:bundle`; y `npm run db:test` desde la raíz
- [X] T025 [P] Completar «Resultados» en specs/007-academy-management/quickstart.md y la cobertura en specs/007-academy-management/contracts/acceptance-coverage.md
- [X] T026 [P] Marcar HU-017 y HU-032 como «Terminada (entorno local) · spec 007» en docs/backlog/user-stories/ y actualizar la tabla de docs/backlog/epics/EP-09-academy-management.md (HU-018 sigue Pendiente, MVP+)

---

## Dependencias y orden de ejecución

- T001 → Fase 2 (T002 y T006 en paralelo; T003 → T004; T005 independiente).
- US1: T007 → T008 y T009 → T010 → T011.
- US2: T012 y T013 en paralelo; T014 requiere T005, T007, T012 y T013; T015 tras T014; T016 tras T009 y T014.
- US3: independiente del perfil salvo la ruta destino; T017 → T018 → T019.
- US4 tras US1 a US3. Cierre al final.

## Oportunidades de paralelismo

- T002, T005 y T006.
- T012 y T013.
- US3 (T017 a T019) en paralelo con US2.
- T025 y T026.

## Estrategia de implementación

### MVP primero

T001 a T011: el owner ya puede completar los datos de contacto.

### Entrega incremental

US2 (logo) → US3 (tarjeta con progreso) → revisión → cierre. Un solo PR de la spec 007.

## Notas

- Si una tarea descubre que falta una regla en la base de datos, se detiene y se vuelve al plan.
- La validación de punta a punta la hace el agente contra Supabase local. La prueba en el celular queda a criterio del owner (modo local por defecto).
