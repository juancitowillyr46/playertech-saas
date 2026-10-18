---

description: "Lista de tareas para implementar la gestión de sedes (EP-12)"
---

# Tareas: Gestión de sedes

**Input**: Documentos de diseño de `/specs/004-venues-management/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Se incluyen tareas de prueba porque la spec las exige (SC-007: cada criterio de aceptación con una prueba o un paso de validación) y el plan las define (research R8).

**Organización**: Las tareas se agrupan por historia de la spec. La capa de errores, el modelo, el repositorio y el servicio los necesitan todas las historias, por eso están en la Fase 2. Orden: US1 y US2 (P1), US6 (verificación de la consulta, P1), US3 y US4 (P2) y US5 (P3).

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: Puede ejecutarse en paralelo (archivo distinto y sin dependencias pendientes).
- **[Story]**: Historia de la spec (US1 a US6).

## Convenciones

- Rutas relativas a la raíz del repositorio; código en `frontend/src/app/`.
- Antes de empezar se leen todos los documentos de la sección "Documentación de referencia obligatoria" de `plan.md` (principio XI).
- Capas: la pantalla usa `VenuesService`, que usa `VenueRepository`; solo `supabase-venue.repository.ts` usa el SDK (regla de ESLint).
- Estilos solo por preset, Tailwind y layout; `npm run check:styles` y `npm run lint` en verde. Sistema visual: `DESIGN.md`.
- Textos en español de Colombia, con tuteo y el glosario; mensajes de `contracts/app-errors.md` y `contracts/ui-contracts.md`.
- Pruebas `*.spec.ts` junto al archivo, con Vitest y dobles (ninguna llama a Supabase real); pantallas con Angular Testing Library, por rol y etiqueta. Se ejecutan con `npm run test:ci` desde `frontend/`.
- Sin migraciones (research R1). Si alguna tarea descubre que falta una regla en la base de datos, se detiene y se vuelve al plan.

---

## Fase 1: Configuración

**Propósito**: Partir de un entorno conocido.

- [X] T001 Comprobar, **sin borrar datos**, que Supabase local está arriba y que `npm run db:test` (raíz) y `npm run test:ci` (`frontend/`) están en verde antes de cambiar nada. `npm run db:reset` borra las cuentas y academias de prueba del responsable de producto: solo se ejecuta con su autorización (T026)

---

## Fase 2: Fundaciones (bloqueantes)

**Propósito**: Errores, modelo, repositorio y servicio que usan todas las historias.

- [X] T002 [P] Ampliar `frontend/src/app/core/errors/supabase-error.mapper.spec.ts` con los casos `23505 → duplicate`, `23514 → rule_violation` y `PGRST116 → not_found` (`contracts/app-errors.md`)
- [X] T003 Añadir los códigos `duplicate`, `rule_violation` y `not_found` a `frontend/src/app/core/errors/app-error.ts`, sus mensajes genéricos a `error-messages.ts` y su traducción a `supabase-error.mapper.ts`, hasta que pase T002
- [X] T004 [P] Añadir a `specs/002-frontend-foundation/contracts/app-errors.md` una nota con los tres códigos nuevos que remite a `specs/004-venues-management/contracts/app-errors.md`
- [X] T005 [P] Mover `frontend/src/app/features/auth/forms/field-a11y.ts` a `frontend/src/app/shared/forms/field-a11y.ts`, porque Sedes es la segunda feature que lo usa (principio IV; `docs/architecture/frontend.md`), y actualizar las importaciones de las pantallas de acceso; las pruebas de acceso siguen en verde
- [X] T006 Ampliar `frontend/src/app/features/venues/models/venue.models.ts`: campos `address` y `directions` (`string | null`) en `Venue` y el tipo `VenueInput` (`name`, `type`, `address`, `city`, `directions`) según `data-model.md`
- [X] T007 Ampliar `frontend/src/app/features/venues/data/supabase-venue.repository.spec.ts`. Debe cubrir:
  - `listVenues` lee también `address` y `directions`;
  - `createVenue` inserta con `academy_id` del contexto y los campos de `VenueInput`, **sin** `created_by`, `is_primary` ni `is_active`, y devuelve la sede creada; sin academia en el contexto rechaza con `forbidden` sin llamar a Supabase;
  - `updateVenue`, `setActive` y `deleteVenue` filtran por `id` y `deleted_at is null` y envían solo sus columnas (`deleted_at` como fecha ISO);
  - `setPrimary` llama a `rpc('set_primary_venue', { p_venue_id })` y traduce su `42501` (sede no encontrada) a `not_found`;
  - traducción de `23505`, `23514` y `PGRST116`.
- [X] T008 Ampliar `frontend/src/app/features/venues/data/venue.repository.ts` y `supabase-venue.repository.ts` según `contracts/repositories.md` (inyecta `AcademyContextService` para la academia, research R2), hasta que pase T007
- [X] T009 Ampliar `frontend/src/app/features/venues/services/venues.service.spec.ts`. Debe cubrir:
  - `create` y `update` recortan espacios y guardan los opcionales vacíos como `null`;
  - `isNameTaken` sin distinguir mayúsculas ni espacios, excluyendo la sede indicada;
  - tras cada operación (`create`, `update`, `setActive`, `remove`, `setPrimary`) se relee el listado **sin** pasar a `loading` y se conservan `query` y `statusFilter`;
  - `busy` es `true` durante la operación y una segunda llamada simultánea se ignora;
  - los errores se propagan como `AppError`.
- [X] T010 Implementar las operaciones, `isNameTaken`, `busy` y el refresco silencioso en `frontend/src/app/features/venues/services/venues.service.ts` (`contracts/repositories.md`, research R5 y R6), hasta que pase T009

**Checkpoint**: `npm run test:ci` en verde; la escritura funciona sin interfaz.

---

## Fase 3: Historia 1 — Registrar una sede (Prioridad: P1) 🎯 MVP

**Objetivo**: El owner registra sedes con validaciones (CA-001 a CA-004 de HU-029).

**Prueba independiente**: Sección 2 de `quickstart.md`.

- [X] T011 [US1] Actualizar `frontend/src/app/features/venues/pages/venues-page/venues-page.spec.ts` para la creación real. Debe cubrir:
  - «Guardar» activo; con un nombre válido llama a `createVenue` con el tipo por defecto «Lugar de entrenamiento», cierra el formulario y muestra «Sede creada.»;
  - nombre vacío o solo espacios: «Ingresa el nombre de la sede.» bajo el campo, con `aria-invalid`, sin llamar al repositorio;
  - nombre de una sede existente con otras mayúsculas: «Ya existe una sede con ese nombre.» sin llamar al repositorio;
  - error `duplicate` del servidor: el mismo mensaje junto al campo; error de red: `p-message` en el formulario y lo escrito se conserva;
  - doble clic en Guardar crea una sola vez.

  Retirar las pruebas de la maqueta (Guardar deshabilitado y «Disponible próximamente»). Las de la confirmación al cerrar con cambios (FR-007) se conservan y siguen en verde.
- [X] T012 [US1] Implementar en `venues-page.ts` la creación real según `contracts/ui-contracts.md`: validadores (obligatorio tras recortar y duplicado con `isNameTaken`), errores de campo accesibles con `fieldA11y`, estado de carga en Guardar, error general en `p-message` y aviso con `MessageService`. Debe pasar T011

**Checkpoint**: Registro de sedes completo en el celular y en escritorio.

---

## Fase 4: Historia 2 — Editar una sede (Prioridad: P1)

**Objetivo**: Editar cualquier sede, incluida la principal (CA-001 de HU-031).

**Prueba independiente**: Sección 3 de `quickstart.md`.

- [X] T013 [US2] Añadir a `venues-page.spec.ts`: «Editar» abre el formulario con **todos** los datos actuales (incluidos dirección e indicaciones); guardar llama a `updateVenue` y muestra «Cambios guardados.»; conservar el propio nombre no es duplicado; el nombre de otra sede sí; error `not_found` muestra el mensaje genérico y refresca el listado
- [X] T014 [US2] Implementar en `venues-page.ts` la edición real (precarga completa desde `Venue`, `update` del servicio, exclusión de la propia sede en `isNameTaken`, tratamiento de `not_found`), hasta que pase T013

**Checkpoint**: El owner puede poner su nombre real a la sede principal.

---

## Fase 5: Historia 6 — Consultar las sedes (Prioridad: P1)

**Objetivo**: Verificar formalmente HU-030 sobre la versión de lectura de la spec 003.

**Prueba independiente**: Sección 6 de `quickstart.md`.

- [X] T015 [US6] Comprobar que las pruebas existentes cubren CA-001 a CA-004 de HU-030 (`supabase-venue.repository.spec.ts`: filtro de eliminadas; `venues-page.spec.ts`: principal, activas e inactivas) y añadir los casos que falten
- [X] T016 [US6] Validar CA-005 de HU-030 (aislamiento) con los owners A y B según la sección 6 de `quickstart.md`, apoyándose en las pgTAP de aislamiento existentes (`supabase/tests/database/030-isolation.test.sql`)

---

## Fase 6: Historia 3 — Cambiar la sede principal (Prioridad: P2)

**Objetivo**: Marcar como principal una sede activa (CA-006 y CA-007 de HU-031).

**Prueba independiente**: Sección 4 de `quickstart.md`.

- [X] T017 [US3] Añadir a `venues-page.spec.ts`: en una sede activa no principal, «Marcar como principal» llama a `setPrimary` y muestra ««{nombre}» es ahora la sede principal.»; en la principal aparece deshabilitada con «(ya es la principal)»; en una inactiva, deshabilitada con «(reactívala primero)»; un error `rule_violation` muestra su mensaje específico
- [X] T018 [US3] Convertir `rowMenuItems` de `venues-page.ts` en un menú por sede según la matriz de `contracts/ui-contracts.md` (acción «Marcar como principal» con sus motivos) y conectar `setPrimary` con su aviso, hasta que pase T017

---

## Fase 7: Historia 4 — Desactivar y reactivar (Prioridad: P2)

**Objetivo**: Retirar una sede de forma reversible (CA-002, CA-003 y CA-005 de HU-031).

**Prueba independiente**: Sección 5 de `quickstart.md`.

- [X] T019 [US4] Añadir a `venues-page.spec.ts`: «Desactivar» en una sede activa no principal llama a `setActive(false)` sin confirmación y muestra «Sede desactivada.»; en una inactiva aparece «Reactivar», que llama a `setActive(true)` y muestra «Sede reactivada.»; en la principal, «Desactivar» deshabilitada con «(marca otra como principal)»
- [X] T020 [US4] Implementar la acción Desactivar/Reactivar en el menú de `venues-page.ts`, hasta que pase T019

---

## Fase 8: Historia 5 — Eliminar una sede (Prioridad: P3)

**Objetivo**: Eliminar con confirmación explícita (CA-004 y CA-005 de HU-031).

**Prueba independiente**: Sección 5 de `quickstart.md`.

- [X] T021 [US5] Añadir a `venues-page.spec.ts`: «Eliminar» abre la confirmación «¿Eliminar «{nombre}»?» con el texto de `contracts/ui-contracts.md`; «Cancelar» no llama al repositorio; «Eliminar» llama a `deleteVenue` y muestra «Sede eliminada.»; en la principal, «Eliminar» deshabilitada con «(marca otra como principal)»
- [X] T022 [US5] Implementar la eliminación con `ConfirmationService` (botón de peligro) en `venues-page.ts`, hasta que pase T021

**Checkpoint**: Gestión completa de sedes.

---

## Fase 9: Pulido y cierre

- [X] T023 Revisar `venues-page.ts` tras las fases 3 a 8: bloqueo de acciones mientras `busy`, sin la maqueta ni sus textos, textos frente al glosario y sin comentarios de la spec 003 que hablen de maqueta
- [X] T024 Pasar `/impeccable audit` y `/impeccable polish` sobre la pantalla de Sedes y su formulario a 360 y 1280 px, en ambos modos, con el detector de Impeccable y las mediciones de áreas táctiles y desbordamiento; corregir los hallazgos (FR-019, SC-006)
- [X] T025 Ejecutar los controles automáticos de la sección 1 de `quickstart.md` (`lint`, `check:styles`, `test:ci`, `build`, `check:bundle` y `db:test`)
- [X] T026 Pedir autorización al responsable de producto antes de `npm run db:reset` (borra sus datos de prueba) o, si no la da, trabajar sobre los datos existentes; recorrer las secciones 2 a 7 de `quickstart.md` con las academias A y B (incluidos los casos límite de dos pestañas, sin conexión y doble toque) y anotar los resultados en su sección «Resultados»
- [X] T027 Actualizar el backlog: `docs/backlog/user-stories/HU-029`, `HU-030` y `HU-031` con estado y spec implementada, y retirar de HU-030 la nota de «versión de lectura disponible»; actualizar en `docs/architecture/ui.md` la referencia a la pantalla de sedes (ya no es maqueta de escritura) y en `docs/architecture/frontend.md` la lista de elementos de `shared/` (`forms/field-a11y.ts`)
- [X] T028 Marcar las tareas completadas en este archivo y preparar el resumen para el PR

---

## Dependencias y orden de ejecución

- **Fase 1**: sin dependencias.
- **Fase 2**: depende de la Fase 1; bloquea todas las historias. T003 tras T002; T008 tras T006 y T007; T010 tras T008 y T009.
- **Fase 3 (US1)** y **Fase 4 (US2)**: dependen de la Fase 2; US2 reutiliza el formulario de US1 (mismo archivo), por eso van en secuencia.
- **Fase 5 (US6)**: depende de la Fase 2; puede hacerse en paralelo con las Fases 3 y 4 (solo pruebas y validación).
- **Fases 6, 7 y 8 (US3, US4, US5)**: dependen de la Fase 2 y comparten el menú de `venues-page.ts`, por eso van en secuencia.
- **Fase 9**: depende de todas.

Dentro de cada historia: primero las pruebas (deben fallar), después la implementación, y al final `npm run test:ci`, `npm run lint` y `npm run check:styles`.

## Oportunidades de paralelismo

- Fase 2: T002, T004, T005 y T006; después T007 y T009 (archivos distintos).
- Fase 5 (US6) en paralelo con las Fases 3 y 4.

## Estrategia de implementación

### MVP primero

1. Fases 1 y 2.
2. Fase 3 (US1): registrar sedes.
3. **Detenerse y validar** la sección 2 de `quickstart.md`.

### Entrega incremental

1. **Etapa 1**: Fases 1 a 5 (registrar, editar y verificar la consulta).
2. **Etapa 2**: Fases 6 a 8 (principal, desactivar y eliminar).
3. **Etapa 3**: Fase 9 (revisión, validación de punta a punta y cierre).

## Notas

- `[P]` = archivos distintos y sin dependencias pendientes.
- La integración real con Supabase se valida con `quickstart.md`; las pruebas unitarias usan dobles.
- Ante una contradicción entre las tareas, el plan, la Constitución o los ADR, detenerse y resolverla con el flujo de Spec Kit.
