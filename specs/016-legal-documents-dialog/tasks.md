---

description: "Lista de tareas de los documentos legales en la aplicación (Fase 2, spec 6)"
---

# Tareas: Documentos legales en la aplicación

**Input**: Documentos de diseño de `/specs/016-legal-documents-dialog/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md, mockups/ (aprobadas el 2026-10-25)

**Tests**: se incluyen porque la spec los exige (FR-012). Son solo los de la spec, según `docs/engineering/testing.md`:
- pgTAP: el archivo nuevo y, antes del cierre, el conjunto completo;
- Vitest: `core/legal`, el dialog y los tres sitios.

**Organización**: el texto, la base de datos y el dialog van en la Fase 2. Después siguen las historias:
1. US1: registro.
2. US2: acudiente (ficha y respuesta pública).
3. US3: revisión del texto base.

## Convenciones

- **Antes de empezar:** leer la documentación de referencia de `plan.md` (principio XI). Las pantallas siguen `mockups/` y `contracts/contracts.md`.
- **ADR-017 sin cambios:** el texto no pasa por Supabase. La migración se aplica con `npx supabase migration up`, nunca con `db:reset`; no se borran los datos locales de la academia C.
- **Prettier** solo en los archivos tocados.
- **El botón y la etiqueta de la casilla:** el nombre del documento era un enlace dentro del `<label>` de la casilla. El botón que lo reemplaza va **fuera** de la etiqueta (ver las notas de implementación), así que tocarlo no marca la casilla (CA-002); las pruebas lo comprueban.

## Notas de implementación

- **Botón fuera de la etiqueta**: dentro del `<label>`, el botón también quedaba etiquetado por ella (un botón es un control etiquetable), lo que además es HTML inválido. La etiqueta queda con el texto («Acepto los») y el botón a su lado. La casilla se nombra con los dos mediante `aria-labelledby`: `checkboxPt` admite un tercer argumento opcional y la respuesta pública le pasa su `pt`. El nombre accesible sigue siendo «Acepto los Términos y Condiciones».
- **Dialog sobre un drawer**: `appendTo="body"`, para que no quede recortado dentro del drawer del acudiente.
- **Texto del dialog**: se oculta el `h1` del documento, porque el encabezado del dialog ya lo muestra; la tipografía es la base del layout y las listas usan utilidades sobre el contenedor.
- **Páginas legales (C1 del análisis)**: llevan un `<style>` con colores de `DESIGN.md` porque son documentos aparte, como los correos; `check:styles` revisa `src/app` y `src/assets/layout`, no `public/`.
- **Responsable y contacto** (ajuste del 2026-10-25, antes de publicar la v2): sin razón social aún, el responsable es la persona natural que opera la marca, con nombre, domicilio, correo `playertech.app@gmail.com` y teléfono (artículo 13 del Decreto 1377 de 2013), sin número de cédula. Los marcadores se reemplazaron en la misma v2 porque todavía no estaba publicada. Cuando exista la sociedad, se publica una versión nueva.
- **Pruebas**: la suite del registro usa `{ timeout: 20_000 }`, como otras suites con drawers o dialogs; en el conjunto completo la prueba del dialog superaba los 5 s.
- **Revisión (T013)**: el detector de Impeccable no encontró hallazgos. Se revisó en el código: el foco queda dentro (`p-dialog` modal), Escape cierra, pantalla completa en el celular y nombres accesibles. Queda para la validación en el celular.
- **Resultados**:
  - pgTAP 340/340 (6 nuevas);
  - Vitest de `core/legal`, `shared`, `auth/register`, `players` y `call-up-response`: 134/134;
  - lint, `check:styles` y compilación en verde; la compilación publica `legal/terms/2026-10-v2.html` y `legal/privacy_policy/2026-10-v2.html`.

---

## Fase 1: Configuración

- [X] T001 Comprobar `npm run db:test` en verde (334/334)

---

## Fase 2: Fundaciones (bloqueantes)

- [X] T002 [P] Redactar `frontend/public/legal/privacy_policy/2026-10-v2.html` según R6 de `research.md`:
  - una página propia (`lang="es"`, `<title>`, `<style>` mínimo con los colores de `DESIGN.md`) con el texto en `<main>`;
  - solo `h1`, `h2`, `p`, `ul`, `li` y `strong`, sin clases ni estilos en línea;
  - al inicio, «Borrador sujeto a revisión legal»;
  - marcadores `[NOMBRE O RAZÓN SOCIAL]`, `[NIT O CÉDULA]`, `[DIRECCIÓN]` y `[CIUDAD]`;
  - las secciones de R6, con los artículos citados (Ley 1581 de 2012 y Decreto 1377 de 2013).
- [X] T003 [P] Redactar `frontend/public/legal/terms/2026-10-v2.html` con la misma estructura y las secciones de Términos de R6
- [X] T004 Escribir `supabase/tests/database/140-legal-documents-v2.test.sql` según `contracts/contracts.md`:
  - la v2 es la vigente de los dos tipos, con la URL `/legal/<tipo>/2026-10-v2.html`;
  - la v1 existe y no es vigente;
  - un registro nuevo (`tests.create_user` con `tests.valid_metadata`) acepta la v2;
  - `anon` lee las vigentes.
- [X] T005 Crear `supabase/migrations/20261025100000_legal_documents_v2.sql`:
  - primero `update … set is_current = false` de la v1;
  - después `insert` de las dos v2 con `url` `/legal/<tipo>/2026-10-v2.html`, `published_at '2026-10-25T00:00:00-05:00'` y `is_current = true`;
  - comentario en español.

  En `supabase/seed.sql`, las academias A y B aceptan la `2026-10-v2`
- [X] T006 Aplicar con `npx supabase migration up`, ejecutar `npm run db:test` en verde y luego `npm run db:types`
- [X] T007 En `frontend/src/app/core/legal/`:
  - `LegalDocument` gana `publishedAt`; `SupabaseLegalDocumentsRepository.getCurrent` lo lee (`published_at`) y su `.spec.ts` se ajusta;
  - crear `data/legal-text.repository.ts` (abstracto: `getText(url)`) y `data/fetch-legal-text.repository.ts` con su `.spec.ts`: descarga con `fetch`, devuelve el contenido de `<main>` con `DOMParser` y, si la respuesta no es correcta, lanza `AppError('network')`;
  - crear `services/legal-document.service.ts` (`providedIn: 'root'`) con su `.spec.ts`: `text(document)` guarda en memoria por URL; si falla, no guarda.

  Registrar `LegalTextRepository` en `frontend/src/app.config.ts`
- [X] T008 Crear `frontend/src/app/shared/components/legal-document-dialog/` (`.ts` y `.spec.ts`) según `mockups/Dialog.dc.html` y `Error.dc.html`:
  - `p-dialog` modal, con Escape y el foco dentro; en el celular (menos de 768 px, `BreakpointObserver`) ocupa toda la pantalla y en escritorio 40 rem;
  - título por tipo y «Versión X · publicada el d de mes de aaaa»;
  - mientras carga, un esqueleto; el texto con `[innerHTML]` y desplazamiento propio; los estilos de las listas y del espaciado van como utilidades en el contenedor, sin reglas sobre `.p-dialog`;
  - si falla, el mensaje de `contracts.md` y «Abrir en otra pestaña» (`target="_blank"`, `rel="noopener"`);
  - «Cerrar» emite `closed`.

  Pruebas: el texto, la versión y la fecha, el error con el enlace, y que «Cerrar» emite

---

## Fase 3: US1 — Registro (P1) 🎯 MVP

**Objetivo**: leer los dos documentos sin salir del registro.

**Prueba independiente**: paso 1 de `quickstart.md`.

- [X] T009 [US1] En `frontend/src/app/features/auth/register/register.ts`, cambiar los dos enlaces por botones con aspecto de enlace que abren `app-legal-document-dialog` con el documento ya cargado (`preventDefault()` para no marcar la casilla). Ajustar `register.spec.ts`: abrir cada documento, cerrar sin cambiar la casilla ni lo escrito, y que el registro envíe la versión mostrada (CA-001 a CA-003)

---

## Fase 4: US2 — Acudiente (P1)

**Objetivo**: leer la política al autorizar los datos de un acudiente, con y sin sesión.

**Prueba independiente**: paso 2 de `quickstart.md`.

- [X] T010 [P] [US2] En `frontend/src/app/features/players/services/player-detail.service.ts`, cambiar `privacyPolicyUrl()` por `privacyPolicy(): Promise<LegalDocument | null>`. En `components/guardian-drawer/guardian-drawer.ts`, abrir el dialog con ese documento. Ajustar `player-detail.service.spec.ts`, `player-page.spec.ts` y la prueba del drawer, si la hay
- [X] T011 [P] [US2] En `frontend/src/app/features/call-up-response/pages/call-up-response/call-up-response.ts`, guardar el documento (no solo la URL) y abrir el dialog sin sesión. Ajustar `call-up-response.spec.ts`

---

## Fase 5: US3 — Texto y revisión (P1)

- [X] T012 [US3] Revisar el texto de T002 y T003 contra los escenarios de la Historia 3 y FR-008 a FR-010: secciones, marcadores, aviso de borrador; los dos se leen a 360 px sin desplazamiento horizontal
- [X] T013 [US3] Revisar el dialog con `/impeccable audit` y el detector: 360 px y escritorio, claro y oscuro, foco, Escape y nombres accesibles; aplicar los hallazgos en los tres sitios de estilos

---

## Fase 6: Cierre

- [X] T014 Ejecutar Prettier en los archivos tocados, `npm run lint`, `npm run check:styles`, `npm run build` y las pruebas de la spec (`quickstart.md`); `npm run db:test` completo
- [X] T015 Completar las notas de implementación y los resultados de `quickstart.md`; actualizar el estado en `AGENTS.md`, `docs/backlog/README.md`, HU-043 y EP-00, y en `docs/product/roadmap.md` («Antes del piloto»: borrador publicado y pendiente de revisión legal)
- [X] T016 Validación del responsable en el celular (`quickstart.md`, pasos 1 a 4)
- [ ] T017 Tras el merge y con autorización: `npm run db:push -- --dry-run` y luego `npm run db:push` (el texto llega con el despliegue de Vercel)

---

## Dependencias

- Fase 1 → Fase 2 (T004 → T005 → T006 → T007 → T008) → US1 y US2 → US3 → Cierre.
- [P]: T002 y T003 en paralelo, y con T004; T010 y T011 en paralelo después de T008.
- T017 después del merge: Vercel debe publicar los archivos antes de que la v2 apunte a ellos en la nube.

## Estrategia

MVP = Fases 1 a 3: el registro de Leones ya muestra los documentos. US2 completa los otros dos sitios. El texto se revisa con un abogado antes de cargar datos reales.
