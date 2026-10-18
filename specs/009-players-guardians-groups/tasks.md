---

description: "Lista de tareas para jugadores, acudientes y grupos (Fase 2, spec 1)"
---

# Tareas: Jugadores, acudientes y grupos

**Input**: Documentos de diseño de `/specs/009-players-guardians-groups/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md, mockups/ (aprobadas)

**Tests**: Se incluyen porque la spec las exige (FR-018, SC-007) y el plan las define (research R8). Se ejecutan **solo las pruebas de la spec** (decisión del responsable): pgTAP completo, porque la migración puede afectar a las existentes, y Vitest de `features/players`, `features/groups`, `shared/forms`, `core/errors` y `core/navigation`.

**Organización**:

- La migración, los tipos, los modelos, los repositorios y la navegación los necesitan todas las historias, por eso están en la Fase 2.
- Orden: US1 a US4 (P1), US5 y US6 (P2).

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: Puede ejecutarse en paralelo (archivo distinto y sin dependencias pendientes).
- **[Story]**: Historia de la spec (US1 a US6).

## Convenciones

- **Antes de empezar**, leer todos los documentos de la sección "Documentación de referencia obligatoria" de `plan.md` (principio XI). Las pantallas siguen `mockups/` y `contracts/ui-contracts.md`.
- **Capas**:
  - páginas → servicios → repositorios abstractos;
  - solo `supabase-*.repository.ts` usa el SDK (regla de ESLint);
  - patrón de Sedes: `frontend/src/app/features/venues/`.
- **Base de datos**:
  - sin usos nuevos de `auth.uid()`: se usa `current_user_id()` (ADR-017);
  - `npm run db:reset` **solo con autorización** del responsable; la migración se aplica con `npx supabase migration up`.
- **Estilos**: solo preset, Tailwind y layout; `npm run check:styles` y `npm run lint` en verde. Formularios en `p-drawer`, como en Sedes.
- **Textos**: español de Colombia, con tuteo y el glosario.
- **Pruebas `*.spec.ts`**: junto al archivo, con Vitest y dobles; las pantallas, con Angular Testing Library, por rol y etiqueta.

---

## Fase 1: Configuración

- [ ] T001 Comprobar, **sin borrar datos**, que Supabase local está arriba y que `npm run db:test` está en verde (144/144) antes de cambiar nada

---

## Fase 2: Fundaciones (bloqueantes)

**Propósito**: base de datos, tipos, modelos, repositorios y navegación que usan todas las historias.

### Base de datos

- [ ] T002 Escribir `supabase/tests/database/070-players-groups-guardians.test.sql` (patrón de `030-isolation.test.sql` y `tests.academy_of`). Debe cubrir (research R8):
  - las cinco tablas con RLS activo, y sin permiso `delete` para `authenticated` salvo en `group_members`;
  - `current_user_id()` devuelve el usuario simulado;
  - `normalize_name(' Sámuel  VARGAS ') = 'samuel vargas'`;
  - el jugador duplicado (tildes, mayúsculas, espacios dobles) falla con `23505`, y uno eliminado no bloquea;
  - el celular `2001234567` falla con `23514`; el nulo se acepta en `players`;
  - la fecha futura y la de hace más de 100 años fallan;
  - el nombre de grupo repetido, sin distinguir mayúsculas, falla; el de un grupo eliminado se reutiliza;
  - un jugador de la academia B no entra en un grupo de la A (clave compuesta);
  - eliminar un grupo (`deleted_at`) borra sus integrantes (trigger `groups_remove_members`);
  - `add_player_guardian`:
    - sin autorización falla con `22023`, y con `self` o un parentesco inválido, con `23514`;
    - con un celular existente reutiliza la persona (`guardian_existed = true`);
    - guarda `consent_document_id` = la Política vigente y `consent_at`;
    - el vínculo repetido falla con `23505`;
  - `find_player_by_identity` encuentra al jugador normalizado y no devuelve los de otra academia;
  - aislamiento: el owner B no lee ni modifica nada de la A;
  - un miembro no owner no escribe: la prueba lo crea en su propia transacción, porque el seed no lo tiene.
- [ ] T003 Crear `supabase/migrations/20261018100000_players_groups_guardians.sql` según `data-model.md` y `contracts/database.md`, hasta que pase T002:
  - **Funciones**:
    - `current_user_id()`;
    - `normalize_name(text)` (`immutable`, `extensions.unaccent` con diccionario explícito);
    - el trigger de la fecha de nacimiento;
    - el trigger `groups_remove_members`.
  - **Tablas**: `players`, `groups`, `group_members`, `guardians` y `guardian_links`.
    - `created_by default public.current_user_id()`, triggers `set_updated_at`, `unique (academy_id, id)` y claves foráneas compuestas;
    - checks: `^3[0-9]{9}$`, 1 a 80 en nombres, 1 a 40 en apodo, 1 a 60 en grupo, 1 a 120 en acudiente;
    - índices únicos parciales `where deleted_at is null`.
  - **RLS, políticas y GRANT por columna**: los de `contracts/database.md`.
  - **Funciones de negocio**: `find_player_by_identity` y `add_player_guardian`, ambas `security invoker`, con `set search_path = ''`, sin `execute` para `anon` y con comentarios en español.
- [ ] T004 Aplicar la migración con `npx supabase migration up` (sin reset) y ejecutar `npm run db:test`: 070 en verde y las existentes también. Si `010-schema` cuenta las tablas o las funciones, actualizar su conteo en `supabase/tests/database/010-schema.test.sql`
- [ ] T005 Regenerar `frontend/src/app/core/supabase/database.types.ts` con `npm run db:types`
- [ ] T006 [P] Documentar las tablas y funciones nuevas en `docs/architecture/database-schema.md`, siguiendo el formato existente

### Frontend común

- [ ] T007 [P] Ampliar `frontend/src/app/core/errors/supabase-error.mapper.spec.ts` y `supabase-error.mapper.ts` con `22023 → rule_violation` (`contracts/database.md`)
- [ ] T008 [P] Crear `frontend/src/app/shared/forms/phone.validator.ts` y su `.spec.ts`:
  - `normalizePhone` quita espacios, guiones y paréntesis;
  - `phoneValidator` exige `^3\d{9}$` sobre el valor normalizado y acepta el vacío (lo obligatorio va con `Validators.required`).
- [ ] T009 [P] Crear `frontend/src/app/features/players/models/player.models.ts` (`PlayerInput`, `PlayerSummary`, `Guardian`, `GuardianInput`, `Relationship` y las etiquetas de parentesco en español) y `frontend/src/app/features/groups/models/group.models.ts` (`GroupSummary`, `GroupDetail`, `GroupMember`), según `contracts/repositories.md`
- [ ] T010 [P] Crear `frontend/src/app/shared/text/search-text.ts` y su `.spec.ts`: `searchKey(text)` en minúsculas y sin tildes (NFD), y `ageOn(birthDate, today)`; la fecha de hoy es la de Colombia (`America/Bogota`)
- [ ] T011 Escribir `frontend/src/app/features/players/data/supabase-player.repository.spec.ts`. Debe cubrir:
  - `listPlayers` usa una sola consulta con grupos embebidos y el conteo de vínculos validados y no eliminados, filtra `deleted_at is null` y traduce a camelCase;
  - `findByIdentity` llama a `rpc('find_player_by_identity', ...)` y devuelve `null` si no hay filas;
  - `createPlayer` inserta con `academy_id` del contexto (sin `created_by`) y luego las filas de `group_members`; sin academia rechaza con `forbidden`;
  - `updatePlayer` actualiza y sincroniza grupos (inserta los nuevos y borra los quitados);
  - si la sincronización de grupos falla tras guardar el jugador, rechaza con un error propio (`groups_not_saved`): el servicio relee y la página avisa «El jugador se guardó, pero no sus grupos» (aceptado en el MVP, sin otra función SQL);
  - `setActive` y `deletePlayer` (con `deleted_at` en ISO) filtran por `id` y `deleted_at is null`;
  - traducción de `23505`, `23514` y `PGRST116`.
- [ ] T012 Crear `frontend/src/app/features/players/data/player.repository.ts` (abstracto) y `supabase-player.repository.ts` según `contracts/repositories.md`, hasta que pase T011
- [ ] T013 [P] Escribir `frontend/src/app/features/groups/data/supabase-group.repository.spec.ts`:
  - `listGroups` con el conteo de integrantes `is_active and deleted_at is null`;
  - `getGroup` con los integrantes no eliminados, con su `isActive`;
  - `createGroup`, `renameGroup` y `deleteGroup` (solo `deleted_at`: el trigger borra los integrantes);
  - `addMembers` (inserción múltiple) y `removeMember`;
  - errores.
- [ ] T014 [P] Crear `frontend/src/app/features/groups/data/group.repository.ts` y `supabase-group.repository.ts`, hasta que pase T013
- [ ] T015 Crear `frontend/src/app/features/players/players.routes.ts` según `contracts/ui-contracts.md`, con `groups` antes de `:id`, y registrarla en `frontend/src/app.routes.ts` como `players`, bajo el layout y el guard de academia, como `settings`. Proveer los repositorios en la ruta, como Sedes
- [ ] T016 Crear `frontend/src/app/features/players/pages/players-shell/players-shell.ts`: las pestañas «Jugadores» y «Grupos» con `p-tabs` enlazadas a `/players` y `/players/groups`, y `router-outlet`. Con su `.spec.ts`: la pestaña activa sigue a la ruta y se navega con el teclado
- [ ] T017 Añadir «Jugadores» (`pi pi-fw pi-users`, `/players`) al grupo General de `frontend/src/app/core/navigation/navigation.ts` y ajustar `app.bottomnav.spec.ts`. Destinos: Inicio · Jugadores · Academia · Sedes. Actualizar el esquema de navegación de `docs/architecture/ui.md` (opción B: Grupos como pestaña de Jugadores)

**Punto de control**: migración aplicada, pgTAP en verde, tipos regenerados, repositorios probados, y Jugadores en la navegación con sus dos pestañas vacías.

---

## Fase 3: US1 — Registrar jugadores (P1) 🎯 MVP

**Objetivo**: HU-002. **Prueba independiente**: quickstart 1.

- [ ] T018 [US1] Escribir `frontend/src/app/features/players/services/players.service.spec.ts` (parte de registro):
  - `save` recorta los textos, guarda el apodo y el celular vacíos como `null` y normaliza el celular;
  - antes de crear consulta `findByIdentity`: si existe, devuelve `{ duplicate }` sin crear;
  - `save(input, existingId)` actualiza y, si estaba inactivo, también reactiva;
  - `23505` en la inserción (carrera) se traduce también en `{ duplicate }` tras consultar `findByIdentity`;
  - tras guardar se relee el listado sin pasar a `loading`;
  - `busy` ignora llamadas repetidas.
- [ ] T019 [US1] Crear `frontend/src/app/features/players/services/players.service.ts` (señales `status`, `players`, `busy`; patrón de `VenuesService`), hasta que pase T018
- [ ] T020 [US1] Crear `frontend/src/app/features/players/components/player-form-drawer/player-form-drawer.ts`. Es un `p-drawer` a la derecha (unos 480 px, pantalla completa en móvil con `BreakpointObserver`, como en Sedes) con:
  - campos: nombres*, apellidos*, apodo, fecha de nacimiento* (`p-datepicker`, sin fechas futuras ni de más de 100 años), celular (`phoneValidator`) y grupos (`p-multiselect` con los grupos de la academia);
  - errores junto al campo con `field-a11y`;
  - el aviso de jugador ya registrado (`p-message`, con sus datos y las acciones «Actualizar sus datos» o «Reactivarlo y actualizar», y «Cancelar», `mockups/PlayerForm.dc.html`);
  - confirmación al cerrar con cambios sin guardar;
  - en modo edición, los valores del jugador.
- [ ] T021 [US1] Escribir `frontend/src/app/features/players/components/player-form-drawer/player-form-drawer.spec.ts`:
  - obligatorios (CA-002) y fecha inválida (CA-003);
  - celular inválido (CA-007);
  - registro con opcionales y grupos (CA-001, CA-004, CA-005);
  - el aviso de duplicado y sus dos variantes, que actualiza al existente (CA-006);
  - la confirmación al salir;
  - el error de red conserva lo escrito y muestra el mensaje en español.
- [ ] T022 [US1] Crear `frontend/src/app/features/players/pages/players-page/players-page.ts` con la acción principal «Registrar jugador», que abre el drawer, y el aviso de confirmación (`p-toast`). El listado se completa en US2

**Punto de control**: se registra un jugador con grupos y el duplicado se detecta y ofrece actualizar (quickstart 1.1 a 1.4).

---

## Fase 4: US2 — Encontrar jugadores (P1)

**Objetivo**: HU-003. **Prueba independiente**: quickstart 2.

- [ ] T023 [US2] Ampliar `players.service.spec.ts` y `players.service.ts` con `query`, `groupFilter`, `statusFilter` (activos por defecto) y `visiblePlayers`: busca por nombres, apellidos o apodo con `searchKey` y ordena por nombre
- [ ] T024 [US2] Completar `players-page.ts` según `contracts/ui-contracts.md` y `mockups/Main.dc.html`:
  - buscador, filtros por grupo y estado, y el conteo de lo visible;
  - en móvil, una lista de filas con «Nombre I. · Apodo», edad, grupos, acudientes y el sello «Inactivo»; en escritorio, la tabla del patrón;
  - estados de carga, error y vacío (CA-005), y la fila enlazada a la ficha.
- [ ] T025 [US2] Escribir `frontend/src/app/features/players/pages/players-page/players-page.spec.ts`: listado y datos de la fila (CA-001, CA-004), búsqueda sin tildes (CA-002), filtros (CA-003) y vacío con su acción (CA-005)

**Punto de control**: con jugadores en dos grupos y uno inactivo, la búsqueda y los filtros funcionan (quickstart 2).

---

## Fase 5: US3 — Mantener al día un jugador (P1)

**Objetivo**: HU-033. **Prueba independiente**: quickstart 3.

- [ ] T026 [US3] Escribir `frontend/src/app/features/players/services/player-detail.service.spec.ts` y crear `player-detail.service.ts`:
  - carga el jugador y sus acudientes;
  - `update` usa el `save` de `PlayersService` con el id;
  - `setActive`;
  - `remove` deja el estado `deleted`;
  - `not_found` → estado `not_found`.
- [ ] T027 [US3] Crear `frontend/src/app/features/players/pages/player-page/player-page.ts` según `mockups/PlayerProfile.dc.html`:
  - datos, grupos y estado;
  - Editar (el mismo drawer de T020) y Desactivar o Activar sin confirmación;
  - en ⋮ (`p-menu`), Eliminar con `p-confirmdialog` que nombra al jugador, y luego vuelve a `/players` con un aviso;
  - la sección Acudientes se completa en US5.
- [ ] T028 [US3] Escribir `frontend/src/app/features/players/pages/player-page/player-page.spec.ts`: ficha (CA-001), editar grupos (CA-002), desactivar y reactivar (CA-003), eliminar con confirmación (CA-004), salir con cambios sin guardar (CA-005) y jugador inexistente

**Punto de control**: quickstart 3.

---

## Fase 6: US4 — Organizar grupos (P1)

**Objetivo**: HU-004. **Prueba independiente**: quickstart 4.

- [ ] T029 [US4] Escribir `frontend/src/app/features/groups/services/groups.service.spec.ts` y crear `groups.service.ts`:
  - listado;
  - `isNameTaken` sin distinguir mayúsculas ni espacios;
  - `create`, `rename` y `remove`;
  - detalle con `addMembers` y `removeMember`;
  - refresco tras cada operación y `not_found`.
- [ ] T030 [US4] Crear `frontend/src/app/features/groups/components/group-name-drawer/group-name-drawer.ts` (crear o renombrar, nombre* de 1 a 60 caracteres, error de nombre repetido junto al campo) y `add-members-drawer/add-members-drawer.ts` (buscador de jugadores activos que no están en el grupo, casillas y el botón «Agregar N jugadores»), con sus `.spec.ts`
- [ ] T031 [US4] Crear `frontend/src/app/features/groups/pages/groups-page/groups-page.ts` (pestaña Grupos: nombre y número de jugadores activos, «Crear grupo», estado vacío; `mockups/Groups.dc.html`) y `group-page/group-page.ts` (integrantes con «Quitar» y el sello «Inactivo» en los inactivos; ⋮ con Renombrar y Eliminar, con confirmación de que los jugadores siguen registrados; «Agregar jugadores»; `mockups/Group.dc.html`)
- [ ] T032 [US4] Escribir `groups-page.spec.ts` y `group-page.spec.ts`: crear y renombrar (CA-001, CA-002), listado (CA-003), integrantes (CA-004), nombre repetido (CA-005), eliminar sin afectar a los jugadores (CA-006), vacío (CA-007) y el integrante inactivo

**Punto de control**: quickstart 4, incluido el tiempo de SC-004.

---

## Fase 7: US5 — Registrar acudientes (P2)

**Objetivo**: HU-034. **Prueba independiente**: quickstart 5.

- [ ] T033 [US5] Escribir `frontend/src/app/features/players/data/supabase-guardian.repository.spec.ts`:
  - `listByPlayer` lee los vínculos no eliminados con la persona y los otros jugadores que acompaña (`is_active and deleted_at is null`);
  - `addToPlayer` llama a `rpc('add_player_guardian', ...)` con `p_consent: true` y traduce su respuesta;
  - `updateGuardian`, `updateRelationship` y `removeFromPlayer` (con `deleted_at`);
  - `findByPhone` lee el acudiente no eliminado con ese celular, para el aviso anticipado;
  - errores.
- [ ] T034 [US5] Crear `frontend/src/app/features/players/data/guardian.repository.ts` y `supabase-guardian.repository.ts` según `contracts/repositories.md`, hasta que pase T033
- [ ] T035 [US5] Ampliar `player-detail.service.spec.ts` y `player-detail.service.ts` con las operaciones de acudientes, que refrescan la ficha
- [ ] T036 [US5] Crear `frontend/src/app/features/players/components/guardian-drawer/guardian-drawer.ts` según `mockups/AddGuardian.dc.html`:
  - celular* (`phoneValidator`); al ser válido, consulta `findByPhone` y, si existe, muestra «Este celular es de [nombre], ya registrado» y deja el nombre de solo lectura;
  - en edición, el celular de otro acudiente muestra «Ese celular ya es de otro acudiente» junto al campo;
  - nombre completo* (1 a 120) y parentesco* con botones (Mamá, Papá, Abuelo o abuela, Otro);
  - al agregar, la casilla obligatoria de autorización con el enlace a la Política vigente (como en el registro de academia);
  - en modo edición, nombre, celular y parentesco, sin casilla.
- [ ] T037 [US5] Completar la sección Acudientes de `player-page.ts`: lista con nombre, parentesco, celular y «También de [jugador]»; ⋮ con Editar y Retirar (con confirmación); «Agregar acudiente»
- [ ] T038 [US5] Escribir `guardian-drawer.spec.ts` y ampliar `player-page.spec.ts`:
  - agregar (CA-001) y validaciones (CA-002);
  - celular existente (CA-003) y varios acudientes (CA-004);
  - editar y retirar (CA-005);
  - sin la casilla no se puede guardar (CA-006).

**Punto de control**: quickstart 5, con la verificación por SQL de una sola persona y dos vínculos.

---

## Fase 8: US6 — Pantallas revisadas y aprobadas (P2)

**Objetivo**: FR-016, FR-017, SC-006.

- [ ] T039 [US6] Revisar a 360 px y en escritorio, en claro y oscuro, el listado, la ficha, los cuatro drawers y las páginas de grupos con `/impeccable critique`, `/impeccable audit` y `/impeccable polish`. Verificar:
  - sin desplazamiento horizontal y controles de al menos 44 px;
  - foco visible y etiquetas;
  - nombres de 80 caracteres sin romper el listado, la ficha ni el grupo;
  - coherencia con `mockups/`.
  Corregir los hallazgos solo por preset, Tailwind o layout.

---

## Fase 9: Cierre

- [ ] T040 Ejecutar las pruebas de la spec:
  - `npm run db:test`;
  - desde `frontend/`, `npx ng test --watch=false --include src/app/features/players --include src/app/features/groups --include src/app/shared --include src/app/core/errors --include src/app/core/navigation --include src/app/layout`.
  Luego, una sola vez, `npm run lint`, `npm run check:styles` y `npm run build`.
- [ ] T041 Recorrer `quickstart.md` contra Supabase local con el owner A y el owner B (aislamiento, paso 6) y anotar los resultados en su sección final
- [ ] T042 Restaurar la academia A del seed: eliminar por SQL los jugadores, grupos, integrantes, acudientes y vínculos creados, y confirmar `npm run db:test` en verde con el total actualizado antes de decirlo restaurado
- [ ] T043 [P] Marcar HU-002, HU-003, HU-033, HU-004 y HU-034 como «Implementada» (estados de `docs/backlog/README.md`) y actualizar `contracts/acceptance-coverage.md` con los nombres reales de las pruebas
- [ ] T044 Tras el merge y con autorización del responsable, aplicar la migración en la nube de pruebas con `npm run db:push` (`docs/engineering/deployment.md`). La ejecuta el responsable si requiere su sesión de `supabase login`

---

## Dependencias

- La Fase 2 bloquea todo: T002 → T003 → T004 → T005; T011 → T012; T013 → T014; T015 → T016 → T017.
- US1 (T018 a T022) va antes de US2 (T023 a T025), porque comparten el servicio y la página.
- US3 depende de US1 (reutiliza el drawer).
- US4 solo depende de la Fase 2 y puede hacerse en paralelo con US1 a US3.
- US5 depende de US3 (la ficha).
- US6 va al final de las pantallas. El cierre, al final.

## Paralelo

- **Fase 2**: T006, T007, T008, T009 y T010 en paralelo tras T005; T013 y T014 en paralelo con T011 y T012.
- **Con US1 a US3**: US4 completa.

## Estrategia

1. MVP: Fases 1, 2 y 3. Ya se pueden registrar jugadores sin duplicados.
2. Luego US2 y US3 (encontrar y mantener), US4 (grupos) y US5 (acudientes).
3. Revisión de experiencia (US6) y cierre. El responsable valida desde el celular antes del commit y del PR.
