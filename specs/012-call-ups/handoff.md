# Handoff para implementar la spec 012

Para el agente que implementa la spec 012 (por ejemplo, Codex). El diseño está aprobado; aquí solo va **cómo trabajar** y lo aprendido en las specs 009 a 011 que no está en otros documentos.

## 1. Qué leer, en este orden

1. `AGENTS.md`: reglas no negociables, estilos, Git.
2. Los documentos de la sección «Documentación de referencia obligatoria» de `plan.md` (principio XI).
3. Esta spec: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/` y `mockups/` (aprobadas).
4. `tasks.md`: se ejecuta en orden y se marca `[X]` al terminar cada tarea.

Si algo de esta spec contradice un documento de mayor precedencia, **detente y avisa**; no lo resuelvas por tu cuenta.

## 2. Código existente para copiar el patrón

| Necesitas | Mira |
|---|---|
| Migración con RLS, GRANT por columna, triggers y funciones `security invoker`/`definer` | `supabase/migrations/20261018120000_activities_fields.sql` y `20261018110000_guardian_consent_and_assignment.sql` |
| Prueba pgTAP (`tests.academy_of`, `tests.owner_of`, `tests.authenticate_as`, preparar datos «pasados» desactivando un trigger) | `supabase/tests/database/090-activities-fields.test.sql` |
| Repositorio Supabase y su prueba | `features/activities/data/supabase-activity.repository.ts` y `.spec.ts`, con `src/app/testing/supabase-client-mock.ts` (si te falta un método de la cadena, añádelo a `CHAIN_METHODS`) |
| Servicio con `busy`, `run()` y refresco | `features/activities/services/activities.service.ts` |
| Drawer de formulario | `shared/components/form-drawer/form-drawer.ts` y un ejemplo completo en `features/activities/components/activity-form-drawer/` |
| Horas en listas desplegables (sin el selector de hora de PrimeNG), horas de Colombia | `activity-form-drawer.ts` y `shared/text/colombia-time.ts` |
| Detalle de la actividad (donde va la sección Convocatoria) | `features/activities/pages/activity-page/activity-page.ts` |
| Acudientes con su celular | `features/players/data/supabase-guardian.repository.ts` |
| Pruebas de pantalla (menús, confirmaciones, drawers) | `features/activities/pages/activity-page/activity-page.spec.ts` |

## 3. Trampas ya conocidas (no las repitas)

1. **Reinicio del formulario.** Si un drawer reinicia su formulario en un `effect` al abrirse, envuelve el reinicio en `untracked(() => …)`. Si no, las señales internas de PrimeNG vuelven a disparar el `effect` y el formulario se borra al elegir un valor.
2. **Selector de hora.** No uses `p-datepicker` con `timeOnly`: en el iPhone no tiene botón de aceptar. Usa `p-select` con horas cada 15 minutos (ya existe en `activity-form-drawer`). En las fechas, `p-datepicker` con `[showOnFocus]="false"` e `iconDisplay="button"`.
3. **Botones.** No uses `size="small"`, porque quedan por debajo de 44 px. Los textos de botón deben caber en una línea a 360 px.
4. **jsdom.** Para pruebas con `p-select` o `p-tabs` necesitas `matchMedia` y `ResizeObserver` simulados. Ejemplos en `layout/service/layout.service.spec.ts` y `shared/components/route-tabs/route-tabs.spec.ts`. Para el constructor usa `vi.fn(function () {…})`, no una función flecha.
5. **Consultas en pruebas.** `p-selectbutton` se expone como botones, no como radios. Si un nombre aparece en la página y en el diálogo de confirmación, usa `getAllByRole(...).at(-1)`. Usa `findBy…` para lo que llega después de una llamada asíncrona.
6. **pgTAP.** Filtra siempre por `tests.academy_of('academia-a')`. La base local tiene datos de otras academias (la cuenta del responsable) que rompen búsquedas por nombre.
7. **Errores de la base de datos.** Un trigger que valida antes que una clave foránea responde `23514`, no `23503`. Prueba lo que de verdad ocurre.
8. **Lint.** `label` siempre asociado (`[for]`). Sin funciones vacías en las pruebas.

## 4. Pruebas

Sigue el proceso de `docs/engineering/testing.md` (sección «Proceso de pruebas en cada spec»).

- Corre las pruebas de la spec cada vez que lo necesites para verificar lo que implementas. Para el frontend: `npx ng test --watch=false --include src/app/features/call-ups --include src/app/features/activities` (desde `frontend/`). Para la base de datos: `npm run db:test` (desde la raíz). La base actual tiene 220 pruebas pgTAP.
- Para detectar rápido errores de tipos: `npx tsc -p tsconfig.app.json --noEmit`. Para las plantillas: `npx ng build --configuration development`.
- La migración se aplica con `npx supabase migration up`. `npm run db:reset` está **prohibido** sin autorización.

## 5. Entorno

- Windows con Git Bash. Supabase local en Docker (contenedor `supabase_db_playertech-saas`).
- Servidor de desarrollo para la validación del responsable: `npx ng serve --host 0.0.0.0 --port 4200`, desde `frontend/`. El responsable prueba desde su celular en la red local.
- Nunca pidas ni guardes contraseñas de la base de datos, la clave `service_role` ni tokens.

## 6. Git y cierre

- Trabaja en la rama `012-call-ups`. **No hagas commit ni push sin que el responsable lo pida.** Nunca encadenes el commit a una corrida de pruebas.
- Llega hasta **T018**. La revisión de experiencia y accesibilidad (T019) usa Impeccable y la hace Claude Code.
- Al terminar las tareas hasta T018:
  - anota los resultados en `quickstart.md` (sección «Resultados»);
  - deja las tareas marcadas;
  - entrega un resumen con lo hecho, las decisiones que tomaste y lo que no tiene prueba automática.
- El responsable valida desde el celular; después: T021 a T023, el commit y el PR (Conventional Commits en inglés), y T024 (`db:push`) solo con autorización.
- Si tomas una decisión que no está en el plan, anótala en una sección «Notas de implementación» al inicio de `tasks.md`, como en la spec 011.
