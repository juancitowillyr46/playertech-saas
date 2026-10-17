---

description: "Lista de tareas para implementar el sistema de diseño PlayerTech (T-01)"
---

# Tareas: Sistema de diseño PlayerTech

**Input**: Documentos de diseño de `/specs/003-design-system/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Se incluyen tareas de prueba porque la spec las exige (SC-005, FR-006) y el plan las define (research R11 y R13).

**Organización**: Las tareas se agrupan por historia de la spec. El orden es secuencial en lo visual, porque cada paso depende de una decisión del responsable de producto: US1 (brief) → US2 (dirección) → US3 (tokens) → US4 (chasis) → US5 (pantallas modelo) → US6 (patrones móviles) → US7 (correos). La capa de datos de solo lectura de US5 no depende del diseño y puede avanzar en paralelo desde la Fase 2.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: Puede ejecutarse en paralelo (archivo distinto y sin dependencias pendientes).
- **[Story]**: Historia de la spec (US1 a US7).
- **⏸ Decisión**: la tarea se detiene hasta obtener la respuesta del responsable de producto.

## Convenciones

**Rutas y lectura previa**
- Raíz del frontend: `frontend/`. Las rutas de las tareas son relativas a la raíz del repositorio.
- Antes de empezar se leen todos los documentos de la sección "Documentación de referencia obligatoria" de `plan.md` (principio XI).

**Componentes y textos**
- Componentes standalone con signals y `ChangeDetectionStrategy.OnPush`, con prefijo `app-` y sin repetir los selectores de las demos.
- Textos en español de Colombia con el vocabulario de `docs/product/glossary.md`.

**Estilos**
- Solo en los tres sitios de `AGENTS.md`: el preset (`core/theme/`), las utilidades de Tailwind y el SCSS existente del layout.
- Prohibido: `style` en línea, `!important`, selectores `.p-*` y colores hexadecimales en plantillas.
- Las demos (`frontend/src/app/pages/`, `frontend/src/assets/demo/`) no se modifican. Nada de PlayerTech bajo `/dev`.

**Impeccable**
- Una vez por sesión: `.claude/skills/impeccable/scripts/impeccable.cmd context`, con cwd en la raíz.
- Antes de cualquier edición de interfaz se lee `.claude/skills/impeccable/reference/craft-floor.md`.
- Los comandos `bolder`, `overdrive`, `delight` y `animate` no se usan sin petición expresa. Hooks y telemetría siguen desactivados.

**Pruebas**
- Archivos `*.spec.ts` junto al archivo probado, con Vitest y dobles de los contratos (ninguna prueba llama a Supabase real).
- Pantallas con Angular Testing Library, buscando por rol y etiqueta. Servicios y repositorios con `TestBed`.
- Se ejecutan con `npm run test:ci` desde `frontend/`.

**Verificación visual**
- Scripts de puppeteer-core en el scratchpad de la sesión (research R12), no en el repositorio.

---

## Fase 1: Configuración

**Propósito**: Preparar la sesión de diseño y las comprobaciones automáticas de estilo.

- [X] T001 Ejecutar `.claude/skills/impeccable/scripts/impeccable.cmd context` desde la raíz y anotar sus directivas. Confirmar que `.impeccable/config.json` mantiene `"telemetry": false` y que los hooks siguen desactivados (`/impeccable hooks status`)
- [X] T002 Añadir a `.gitignore`, dentro del bloque de Impeccable, las rutas de muestras de dirección que aún no estén ignoradas (`**/.impeccable/mocks/`, research R2)
- [X] T003 [P] Crear `frontend/scripts/check-styles.mjs` (research R11). Debe fallar con un mensaje por cada caso:
  - `!important` en `frontend/src/app/**` o en `frontend/src/assets/layout/**`;
  - selectores de clases `.p-` en archivos `.scss` del layout o en `styles` de componentes;
  - colores hexadecimales en plantillas (`template:` de los `.ts` y `.html`).

  Excluye `frontend/src/app/pages/**` y `frontend/src/assets/demo/**`.
- [X] T004 Añadir el script `"check:styles": "node scripts/check-styles.mjs"` a `frontend/package.json` y la sección correspondiente a `frontend/README.md` ("Validación")
- [X] T005 [P] Activar `@angular-eslint/template/no-inline-styles` en `frontend/eslint.config.js` para las plantillas de PlayerTech, excluyendo las demos como ya hace la configuración
- [X] T006 Ejecutar `npm run lint` y `npm run check:styles` en `frontend/` y corregir lo que aparezca en el código existente. Probar un caso negativo temporal (añadir y quitar un `!important` en `_core.scss`). *Resultado: 6 incumplimientos heredados de Sakai corregidos: `!important` innecesarios en `_responsive.scss`, clases de animación del menú renombradas de `p-submenu-*` a `layout-submenu-*`, ajuste `.p-toast` eliminado de `_utils.scss` (la posición del aviso se revisa en T040) y excepción de lint documentada para el configurador de temas, que solo usan las demos.*

---

## Fase 2: Fundaciones (bloqueantes)

**Propósito**: Capa de datos de solo lectura que necesitan las pantallas modelo. No depende del diseño, así que puede avanzar en paralelo con las Fases 3 y 4.

- [X] T007 [P] Crear `frontend/src/app/features/venues/models/venue.models.ts` con `Venue` y `VenueType` según `data-model.md`
- [X] T008 [P] Crear `frontend/src/app/features/home/models/home-summary.models.ts` con `HomeSummary` y la lista estática `RECOMMENDED_TASKS` (tres tareas con destino), según `data-model.md`
- [X] T009 [P] Escribir `frontend/src/app/features/venues/data/supabase-venue.repository.spec.ts`. Debe cubrir:
  - la consulta usa `deleted_at is null` y no filtra por `academy_id`;
  - el mapeo a `Venue`;
  - el orden (principal primero, después por nombre con `es-CO`);
  - los errores se traducen con `mapSupabaseError`.
- [X] T010 [P] Escribir `frontend/src/app/features/home/data/supabase-home-summary.repository.spec.ts`. Debe cubrir:
  - plan activo y sin suscripción (`planName: null`);
  - sede principal y sin sede principal;
  - logo: con `logoFileId` lee la fila de `files` y devuelve un `StoredFile`; sin `logoFileId` no consulta `files`;
  - mapeo de errores.
- [X] T011 Crear `frontend/src/app/features/venues/data/venue.repository.ts` (abstracto) y `supabase-venue.repository.ts` según `contracts/repositories.md`, hasta que pase T009
- [X] T012 Crear `frontend/src/app/features/home/data/home-summary.repository.ts` (abstracto) y `supabase-home-summary.repository.ts` según `contracts/repositories.md`, hasta que pase T010
- [X] T013 Registrar `VenueRepository` y `HomeSummaryRepository` con sus implementaciones en `frontend/src/app.config.ts`
- [X] T014 [P] Escribir `frontend/src/app/features/venues/venues.service.spec.ts` y crear `venues.service.ts`. El servicio expone:
  - las señales `venues`, `status`, `query`, `statusFilter` y `visibleVenues`;
  - búsqueda por nombre y ciudad, sin distinguir mayúsculas ni tildes;
  - filtro `all`, `active` o `inactive`;
  - estados `loading`, `ready`, `empty` y `error`, con reintento.
- [X] T015 [P] Escribir `frontend/src/app/features/home/home-summary.service.spec.ts` y crear `home-summary.service.ts`. El servicio:
  - combina `AcademyContextService` (nombre y `logoFileId`), `HomeSummaryRepository` y `FileStorageRepository.getUrl()`;
  - sin logo, o si falla su URL, usa iniciales de máximo 2 letras, sin poner la página en error;
  - expone los estados `loading`, `ready` y `error`.

**Checkpoint**: `npm run test:ci` en verde; la capa de datos está lista sin interfaz.

---

## Fase 3: Historia 1 — Brief de producto aprobado (Prioridad: P1) 🎯 MVP

**Objetivo**: `PRODUCT.md` aprobado por el responsable de producto (CA-001 de T-01).

**Prueba independiente**: El responsable de producto revisa `PRODUCT.md` frente al brief de T-01 y lo aprueba.

- [X] T016 [US1] Leer `.claude/skills/impeccable/reference/init.md` y explorar las fuentes del proyecto: `docs/product/vision.md`, `scope.md`, `glossary.md`, el brief de T-01 y las rutas y pantallas existentes. Anotar lo ya resuelto para no preguntarlo
- [X] T017 [US1] ⏸ Decisión: entrevista de `init` con la herramienta de preguntas estructuradas. Como máximo tres preguntas por ronda, solo sobre vacíos reales: usuario y situación, mecanismo diferencial, restricciones duraderas. No se pregunta por estética, colores ni tipografía
- [X] T018 [US1] Escribir `PRODUCT.md` en la raíz con el esquema de Impeccable (`impeccable:product-schema 1`, plataforma `web`, sin sección Stack). Debe enlazar a `docs/product/vision.md` en lugar de repetirla y marcar como abiertas las decisiones no confirmadas
- [X] T019 [US1] ⏸ Decisión: presentar `PRODUCT.md` al responsable de producto, aplicar sus ajustes (máximo dos rondas, SC-001) y registrar la aprobación con su fecha al final del archivo

**Checkpoint**: `PRODUCT.md` aprobado.

---

## Fase 4: Historia 2 — Dirección visual elegida (Prioridad: P1)

**Objetivo**: El responsable de producto elige una de 2 o 3 direcciones visuales, mostradas sobre pantallas reales (CA-002 de T-01).

**Prueba independiente**: La página de decisión muestra las direcciones, comparables entre sí, y la elección queda registrada.

- [X] T020 [US2] Leer `.claude/skills/impeccable/reference/new-work.md` (sección "Create or replace the visual world"). Preparar el material de los pasos 1 a 3: el mecanismo del producto, la escena del owner (celular, en la cancha o en la oficina), su mundo cultural (fútbol de academias en Colombia) y el "rut" de la categoría. Partir de las referencias del brief de T-01
- [X] T021 [US2] Ejecutar `.claude/skills/impeccable/scripts/impeccable.cmd concept-seed --scope direction --mode operate` y seguir lo que imprime (MODE RULES, DIRECTIONS). No escribir muestras antes de este paso
- [X] T022 [US2] Construir, por cada dirección (2 o 3) y para la salida "estándar de la categoría", muestras HTML code-led en `.impeccable/mocks/decision/` (ignorada por T002):
  - el inicio de sesión y la pantalla de sedes con datos de ejemplo;
  - a 360 y a 1280 px, en modo claro y oscuro;
  - solo con lo que la base adoptada permite construir (FR-004).

  Comprobar el contraste AA de cada paleta antes de presentarla.
- [X] T023 [US2] Servir la página de decisión de Impeccable, con tarjetas de igual peso, el *steer* y el *re-roll*, y presentarla al responsable de producto
- [X] T024 [US2] ⏸ Decisión: el responsable de producto elige una dirección, o una combinación explícita (máximo dos rondas, SC-001)
- [X] T025 [US2] Guardar el contrato de dirección (seis bloques y la referencia del *seed*) con `impeccable.cmd surface-brief write`, verificarlo con `surface-brief read` y comprobar que no se copia a ningún archivo servido al navegador

**Checkpoint**: dirección elegida y contrato guardado.

---

## Fase 5: Historia 3 — Identidad aplicada por tokens (Prioridad: P1)

**Objetivo**: Toda la aplicación adopta la dirección elegida desde el preset, en ambos modos (CA-003 y CA-006 de T-01).

**Prueba independiente**: Recorrido de todas las pantallas en ambos modos. `check:styles` y `lint` en verde.

- [X] T026 [P] [US3] Escribir en `frontend/src/app/layout/service/layout.service.spec.ts` los casos de preferencia del sistema: sin valor guardado sigue `prefers-color-scheme`; con valor guardado prevalece la elección (research R5)
- [X] T027 [US3] Ajustar `frontend/src/app/layout/service/layout.service.ts` para que el modo inicial siga la preferencia del sistema cuando no hay valor en `playertech.darkTheme`, hasta que pase T026
- [X] T028 [US3] Reescribir `frontend/src/app/core/theme/playertech-preset.ts` con la dirección elegida, según `contracts/ui-contracts.md` (tokens obligatorios):
  - primitivos de marca;
  - `primary` con color de acción AA por modo;
  - `colorScheme.light` y `colorScheme.dark` (superficies, texto, `formField`);
  - `focusRing`, radios, densidad y `transitionDuration`;
  - ajustes de los componentes usados.

  Un comentario breve por decisión no evidente.
- [X] T029 [P] [US3] Alojar la tipografía elegida: archivos `woff2` del subconjunto latino, con los pesos usados, en `frontend/public/fonts/` junto a su licencia, con un total máximo de 60 KB (research R4)
- [X] T030 [US3] Configurar la carga de la fuente:
  - `@font-face` con `font-display: swap` en `frontend/src/assets/styles.scss`;
  - familia y pila de respaldo en la variable de `frontend/src/assets/layout/_core.scss` y en el bloque `@theme` de `frontend/src/assets/tailwind.css`;
  - `preload` del peso principal en `frontend/src/index.html`, del que se elimina el enlace a `fonts.cdnfonts.com`.
- [X] T031 [US3] Revisar `frontend/src/assets/layout/_core.scss` y `_typography.scss`: tamaño base y escala de la dirección, con campos de formulario de al menos 16 px en móvil. Añadir el bloque `@media (prefers-reduced-motion: reduce)` que pone a cero `--p-transition-duration` y las transiciones del layout (research R6)
- [X] T032 [US3] Ajustar `frontend/src/assets/layout/variables/_light.scss`, `_dark.scss` y `_common.scss` solo donde el layout no lea ya los tokens `--p-*` (fondo del layout, sombras, bordes del chasis)
- [X] T033 [P] [US3] Crear `frontend/src/app/shared/components/brand-mark/brand-mark.ts` (marca tipográfica de la dirección, entrada `size`) con su `brand-mark.spec.ts` (texto accesible "PlayerTech")
- [X] T034 [US3] Verificar los contrastes de los pares de tokens de `contracts/ui-contracts.md` en ambos modos con un script del scratchpad. Ajustar el tono (no la dirección) si alguno no cumple y anotar el ajuste para `DESIGN.md`
- [X] T035 [US3] Ejecutar `npm run lint`, `npm run check:styles`, `npm run test:ci` y `npm run build` y recorrer las pantallas existentes en ambos modos con capturas a 360 y 1280 px. Comprobar además el escenario 3 de la Historia 3: montar en una página temporal, que no se versiona, componentes aún no usados (`p-datepicker`, `p-select`, `p-fileupload`, `p-dialog`) y verificar que adoptan la identidad sin ajustes. Después se borra la página

**Checkpoint**: identidad aplicada a toda la aplicación por tokens.

---

## Fase 6: Historia 4 — Chasis cómodo en el celular (Prioridad: P2)

**Objetivo**: Topbar, menú, menú de usuario y encabezado de página con la identidad y cómodos a 360 px (CA-004 de T-01).

**Prueba independiente**: Navegación completa a 360 px con controles de al menos 44 px y sin desplazamiento horizontal.

- [X] T036 [P] [US4] Escribir `frontend/src/app/shared/components/page-header/page-header.spec.ts`: un solo `<h1>` con el título, descripción opcional y acción proyectada `[pageHeaderAction]`
- [X] T037 [US4] Crear `frontend/src/app/shared/components/page-header/page-header.ts` según `contracts/ui-contracts.md`, con la acción siempre al alcance en el celular, hasta que pase T036
- [X] T038 [US4] *(Rehecha tras la aclaración del 2026-10-17: chasis de app en el celular, FR-012a; ver T038a.)* Rediseñar `frontend/src/app/layout/component/app.topbar.ts` y `frontend/src/assets/layout/_topbar.scss`:
  - `BrandMark` en escritorio y nombre de la academia legible en el celular;
  - cambio de modo y menú de usuario de 44 px o más, con la identidad.
- [X] T039 [US4] Rediseñar el menú lateral en `frontend/src/app/layout/component/app.menu.ts`, `app.menuitem.ts`, `app.sidebar.ts`, `frontend/src/assets/layout/_menu.scss` y `_responsive.scss`:
  - indicación clara de la sección actual (no solo por color);
  - cierre al navegar en el celular;
  - máscara y apertura cómodas con una mano.
- [X] T040 [US4] Ajustar `frontend/src/assets/layout/_main.scss` y `frontend/src/app/layout/component/app.layout.ts` (márgenes del contenedor a 360 px y a escritorio) y `app.footer.ts` si la dirección lo pide. Revisar también la posición de `p-toast` respecto del topbar, con su entrada `position` o con tokens, sin CSS sobre `.p-toast`
- [X] T041 [US4] Usar `PageHeader` en la página de `/settings/academy` (`frontend/src/app/shared/components/placeholder-page/placeholder-page.ts`), que conserva su contenido provisional (HU-017)
- [X] T038a [US4] Chasis de app en el celular (FR-012a, `contracts/ui-contracts.md`): barra superior compacta con las iniciales y el nombre de la academia y el menú de usuario (que incluye el cambio de modo) en `frontend/src/app/layout/component/app.topbar.ts` y `_topbar.scss`; nuevo `frontend/src/app/layout/component/app.bottomnav.ts` con los destinos de `APP_NAVIGATION` y su prueba; sin hamburguesa ni menú lateral por debajo de 992 px; `PageHeader` con la acción flotante sobre la barra; márgenes de `_main.scss` y pie oculto en el celular
- [X] T042 [US4] Pasar `/impeccable critique`, `/impeccable audit` y `/impeccable polish` sobre el chasis. Medir a 360 px las áreas táctiles y el desplazamiento horizontal en ambos modos y corregir los hallazgos

**Checkpoint**: chasis terminado y revisado.

---

## Fase 7: Historia 5 — Pantallas modelo como referencia de patrones (Prioridad: P2)

**Objetivo**: Inicio de sesión, registro, sedes e inicio terminados como patrones (CA-004 y CA-005 de T-01), y el resto de pantallas de acceso y de estado con la identidad (FR-016).

**Prueba independiente**: Cada pantalla modelo pasa crítica, auditoría y pulido, sin hallazgos críticos, a 360 y 1280 px en ambos modos.

### Acceso

- [X] T043 [US5] ⏸ Decisión: pedir al responsable de producto, con la herramienta de preguntas estructuradas, las observaciones de experiencia que anotó al probar el flujo completo (research R14) y registrarlas en el *surface brief* de autenticación
- [X] T044 [US5] Rediseñar `frontend/src/app/features/auth/auth-layout/auth-layout.ts` según el patrón de layout de autenticación de `ui.md`:
  - panel de marca con `BrandMark` y la propuesta de valor, oculto en el celular;
  - formulario siempre visible.
- [X] T045 [US5] Rediseñar `frontend/src/app/features/auth/login/login.ts` con las observaciones y `/impeccable clarify` para los textos, conservando el comportamiento. Actualizar `login.spec.ts` solo en los textos consultados, sin quitar casos
- [X] T046 [US5] Rediseñar `frontend/src/app/features/auth/register/register.ts` (orden de campos, agrupación, mensajes y aceptación legal) con las observaciones, conservando validaciones y comportamiento. Actualizar `register.spec.ts` solo en los textos consultados
- [X] T047 [P] [US5] Aplicar la identidad y revisar los textos de `verify-email`, `forgot-password`, `reset-password`, `callback`, `access-denied` y `suspended` en `frontend/src/app/features/auth/`, ajustando sus `*.spec.ts` solo en textos
- [X] T048 [P] [US5] Aplicar la identidad a `frontend/src/app/features/errors/not-found/not-found.ts` y `context-error/context-error.ts`
- [X] T049 [US5] Pasar `/impeccable critique`, `/impeccable audit` y `/impeccable polish` sobre el inicio de sesión y el registro, y corregir los hallazgos
- [X] T050 [US5] Pasar `/impeccable audit` y `/impeccable polish` sobre las 8 pantallas de T047 y T048, a 360 px en ambos modos, y corregir los hallazgos (principio XIII)
- [X] T051 [US5] ⏸ Decisión: validar SC-006 con una persona que no haya visto la pantalla (el responsable de producto u otra persona que designe), en su celular y sin ayuda, cronometrando desde que abre `/auth/register` hasta que llega al inicio, verificación por Mailpit incluida. Anotar el tiempo en los resultados de `quickstart.md`. *Resultado (2026-10-17): 20 s, sin trabas, hecha por el responsable de producto; se repetirá con otra persona.*

### Sedes

- [X] T052 [P] [US5] Escribir `frontend/src/app/features/venues/venues-page/venues-page.spec.ts`. Debe cubrir:
  - encabezado con "Nueva sede";
  - las dos vistas (lista de tarjetas y tabla) con los datos del servicio;
  - la marca "Principal" y el estado "Activa"/"Inactiva";
  - búsqueda y filtro;
  - estado vacío y de error con reintento;
  - drawer con "Guardar" deshabilitado y "Disponible próximamente";
  - al cerrar el drawer con cambios, confirmación "¿Descartar los cambios?"; sin cambios, se cierra sin preguntar;
  - "Desactivar" y "Eliminar" deshabilitados.
- [X] T053 [US5] Crear `frontend/src/app/features/venues/venues-page/venues-page.ts` según `contracts/ui-contracts.md`:
  - `PageHeader`, buscador y filtro;
  - `p-table` (ordenamiento y paginación de 10) visible desde `md`, y lista de tarjetas por debajo;
  - `p-tag` y `p-menu` por fila;
  - estados de carga, vacío y error.
- [X] T054 [US5] Añadir a `venues-page.ts` el drawer de maqueta (FR-018a): `p-drawer` con los campos de HU-029 (vacíos al crear, con los valores actuales al editar), "Cancelar" activo, "Guardar" deshabilitado y `p-message` "Disponible próximamente". Al cerrarlo con cambios sin guardar, `p-confirmdialog` "¿Descartar los cambios?" (`contracts/ui-contracts.md`). Ninguna llamada de escritura. Debe pasar T052
- [X] T055 [US5] Crear `frontend/src/app/features/venues/venues.routes.ts` y montarlo desde `frontend/src/app/features/settings/settings.routes.ts` en `venues`, sustituyendo el placeholder (título "Sedes · PlayerTech")

### Inicio

- [X] T056 [P] [US5] Escribir `frontend/src/app/features/home/home-page/home-page.spec.ts`: nombre de la academia, iniciales sin logo, plan, sede principal, estado vacío sin sede principal, estado de error con reintento, y tarjeta "Completa tu academia" con tres enlaces y sin contador
- [X] T057 [US5] Crear `frontend/src/app/features/home/home-page/home-page.ts` según el patrón de inicio con tareas pendientes de `ui.md`, con `PageHeader`, resumen real y la tarjeta de maqueta, hasta que pase T056
- [X] T058 [US5] Sustituir el placeholder en `frontend/src/app/features/home/home.routes.ts` por `HomePage` (título "Inicio · PlayerTech")

**Checkpoint**: las cuatro pantallas modelo funcionan con datos reales en el celular.

---

## Fase 8: Historia 6 — Patrones móviles para listados y formularios laterales (Prioridad: P2)

**Objetivo**: Tarjetas y drawer a pantalla completa en el celular, tabla en escritorio (FR-019).

**Prueba independiente**: En sedes, a 360 px, listado sin desplazamiento horizontal y drawer a pantalla completa con las acciones visibles.

- [X] T059 [US6] Ligar `[fullScreen]` del drawer de `venues-page.ts` a una señal de `BreakpointObserver` (`@angular/cdk/layout`) por debajo de `md`. Dejar el pie de acciones siempre visible y añadir el caso al `venues-page.spec.ts` con el observador simulado (research R8)
- [X] T060 [US6] Comprobar en las tarjetas los textos largos (recorte con el texto completo accesible), el botón de acciones de 44 px y la ausencia de desplazamiento horizontal. Validar con una sede de 60 caracteres renombrada en local
- [X] T061 [US6] Pasar `/impeccable critique`, `/impeccable audit` y `/impeccable polish` sobre sedes e inicio a 360 y 1280 px en ambos modos, y corregir los hallazgos (FR-021)

**Checkpoint**: patrones móviles validados.

---

## Fase 9: Historia 7 — Correos de autenticación (Prioridad: P3)

**Objetivo**: Correos de confirmación y recuperación en español, con la marca y un botón (CA-007 de T-01).

**Prueba independiente**: Registro y recuperación en local, con los dos correos revisados en Mailpit y su botón completando el proceso.

- [ ] T062 [P] [US7] Crear `supabase/templates/confirmation.html` según `contracts/email-templates.md`: maquetación con tablas y estilos en línea, marca en texto, botón y enlace en texto con `{{ .ConfirmationURL }}`, vigencia, y colores tomados de los tokens elegidos
- [ ] T063 [P] [US7] Crear `supabase/templates/recovery.html` con la misma estructura y el texto para quien no solicitó el cambio
- [ ] T064 [US7] Registrar las dos plantillas con sus asuntos en `supabase/config.toml` (`[auth.email.template.confirmation]` y `[auth.email.template.recovery]`). Revisar los textos con `/impeccable clarify`
- [ ] T065 [US7] Reiniciar Supabase local (`npm run db:stop` y `npm run db:start`) y validar los dos correos en Mailpit según la sección 6 de `quickstart.md`: vista móvil, vista sin imágenes y el botón completando la verificación y la recuperación (SC-007)

**Checkpoint**: correos validados en local.

---

## Fase 10: Documentación, pulido y cierre

**Propósito**: Documentar el sistema desde lo construido, validar de punta a punta y cerrar T-01.

- [ ] T066 Generar `DESIGN.md` en la raíz con el documentador de Impeccable (`/impeccable document` o el agente `impeccable-documenter`) a partir de la aplicación construida. Revisar que incluya:
  - tokens, tipografía, color, marca, estados y reglas de uso;
  - los ajustes de contraste de T034;
  - la correspondencia con el preset;
  - la nota sobre el HTML de correo (research R10).
- [ ] T067 [P] Actualizar `docs/architecture/ui.md`:
  - la sección "Tema" pasa a enlazar a `DESIGN.md`;
  - añadir el encabezado de página, la variante móvil del patrón de gestión, la maqueta de escritura y las pantallas modelo como referencia.
- [ ] T068 [P] Actualizar `docs/architecture/decisions.md`:
  - enmendar FE-06 (preset definitivo, tipografía alojada en el proyecto, preferencia del sistema);
  - añadir a ADR-003 la nota de T-01 (la calidad visual no es *gold plating*).
- [ ] T069 [P] Actualizar `docs/architecture/frontend.md`: `features/venues/` y `features/home/data/`, `shared/components/page-header` y `brand-mark`, y la nota sobre la carga de la tipografía
- [ ] T070 [P] Actualizar el backlog:
  - `docs/backlog/enablers/T-01-design-system.md`: estado Terminado y evidencia por criterio;
  - `HU-030` y `HU-032`: nota "Versión de lectura disponible" con lo que falta.
- [ ] T071 Ejecutar todos los controles automáticos de la sección 1 de `quickstart.md` (`lint`, `check:styles`, `test:ci`, `build` y `check:bundle`) y comprobar que el bundle inicial no crece más de 50 KB
- [ ] T072 Recorrer las secciones 3 a 6 de `quickstart.md` con los scripts del scratchpad (capturas, áreas táctiles, desplazamiento y contraste) y anotar los resultados en la sección "Resultados". Incluir dos comprobaciones manuales explícitas:
  - movimiento reducido emulado (FR-011), porque no tiene prueba automática;
  - revisión de todos los textos de la interfaz y de los correos frente a `docs/product/glossary.md` (FR-022).
- [ ] T073 ⏸ Decisión: revisión final de las pantallas modelo con el responsable de producto, en su celular, y aplicación de los ajustes acordados
- [ ] T074 Marcar las tareas completadas en este archivo y preparar el resumen para el PR

---

## Dependencias y orden de ejecución

### Por fase

- **Fase 1 (Configuración)**: sin dependencias.
- **Fase 2 (Fundaciones)**: depende de la Fase 1. Es independiente del diseño y puede avanzar en paralelo con las Fases 3 y 4.
- **Fase 3 (US1)**: depende de la Fase 1.
- **Fase 4 (US2)**: depende de la Fase 3 (brief aprobado).
- **Fase 5 (US3)**: depende de la Fase 4 (dirección elegida).
- **Fase 6 (US4)**: depende de la Fase 5.
- **Fase 7 (US5)**: depende de las Fases 2 y 6.
- **Fase 8 (US6)**: depende de la Fase 7 (página de sedes).
- **Fase 9 (US7)**: depende de la Fase 5 (colores elegidos); puede avanzar en paralelo con las Fases 6 a 8.
- **Fase 10**: depende de todas.

### Dentro de cada historia

Primero las pruebas, que deben fallar; después la implementación; por último `npm run test:ci`, `npm run lint` y `npm run check:styles`.

## Oportunidades de paralelismo

- Fase 1: T003 y T005.
- Fase 2: T007 a T010; después T014 y T015.
- Fase 5: T026, T029 y T033.
- Fase 7: T047 y T048; T052 y T056.
- Fase 9: T062 y T063, en paralelo con las Fases 6 a 8.
- Fase 10: T067 a T070.

### Ejemplo de paralelismo en la Fase 2

```text
T009 supabase-venue.repository.spec.ts
T010 supabase-home-summary.repository.spec.ts
T007 venue.models.ts
T008 home-summary.models.ts
```

## Estrategia de implementación

### MVP primero

1. Fase 1 y Fase 3 (US1): `PRODUCT.md` aprobado.
2. Fase 4 (US2): dirección elegida.
3. Fase 5 (US3): identidad aplicada a toda la aplicación.
4. **Detenerse y validar**: recorrido en ambos modos y controles automáticos en verde.

### Entrega incremental (etapas con revisión del responsable)

1. **Etapa 1**: Fases 1 a 4, más la capa de datos de la Fase 2 en paralelo. Termina con el brief aprobado y la dirección elegida.
2. **Etapa 2**: Fases 5 y 6. Al cerrarla, toda la aplicación tiene la nueva identidad y el chasis está revisado; el responsable lo prueba en su celular.
3. **Etapa 3**: Fases 7 a 9. Pantallas modelo, patrones móviles y correos.
4. **Etapa 4**: Fase 10. Documentación, validación de punta a punta y cierre de T-01.

## Notas

- `[P]` = archivos distintos y sin dependencias pendientes.
- SC-008 es un criterio cualitativo posterior a la entrega (se comprobará en la primera gestión de la Fase 2) y no tiene tarea propia.
- Las tareas con ⏸ detienen la implementación hasta tener la respuesta del responsable de producto; no se suponen respuestas.
- La integración real con Supabase y la verificación visual se validan con `quickstart.md`; las pruebas unitarias usan dobles.
- Ante una contradicción entre las tareas, el plan, la Constitución o los ADR, detenerse y resolverla con el flujo de Spec Kit.
