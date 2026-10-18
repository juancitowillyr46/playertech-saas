---

description: "Lista de tareas para desplegar el entorno de pruebas (T-02)"
---

# Tareas: Despliegue del entorno de pruebas

**Input**: Documentos de diseño de `/specs/008-deployment/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Solo la prueba del script de configuración. El resto se verifica con `check:bundle` en cada compilación y con el quickstart en la nube (FR-011).

**Organización**: Por historia de la spec. Cada tarea indica quién la hace: 🤖 agente (repositorio) o 🧑 responsable de producto (cuentas, paneles y secretos). El agente nunca recibe la contraseña de la base de datos, la clave `service_role` ni tokens.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: Puede ejecutarse en paralelo (archivo distinto y sin dependencias pendientes).
- **[Story]**: Historia de la spec (US1 a US4).

## Convenciones

- Rutas relativas a la raíz del repositorio.
- Antes de empezar se leen los documentos de «Documentación de referencia obligatoria» de `plan.md` (principio XI).
- `supabase/config.toml` y `frontend/src/environments/*.ts` del repositorio no cambian.
- Pruebas: solo las de esta spec. `lint` y `build` se corren una vez.

## Fase 1: Configuración

- [X] T001 🤖 Añadir el script `"db:push": "supabase db push"` en package.json (raíz) y documentarlo en AGENTS.md (sección Comandos: «aplica las migraciones al proyecto enlazado en la nube, sin el seed»)

---

## Fase 2: Fundaciones (bloqueantes)

- [X] T002 🤖 Crear frontend/scripts/write-environment.mjs según `contracts/deployment.md`:
  - lee `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`;
  - falla con código 1 y un mensaje en español si falta alguna, si la URL no empieza por `https://` o si la clave parece privilegiada (empieza por `sb_secret_`, o es un JWT con `role` `service_role`);
  - escribe frontend/src/environments/environment.ts con `production: true`, ambos valores y `sessionInactivityMinutes: 60`;
  - exporta la validación como función para probarla.
- [X] T003 [P] 🤖 Prueba frontend/scripts/write-environment.test.mjs con `node:test`, sobre la función de validación (no escribe archivos):
  - valores válidos;
  - falta la URL;
  - falta la clave;
  - URL `http://`;
  - clave `sb_secret_…`;
  - JWT `service_role`.

  Ejecutarla con `node --test frontend/scripts/write-environment.test.mjs`.
- [X] T004 🤖 Añadir `"build:vercel": "node scripts/write-environment.mjs && ng build && node scripts/check-bundle.mjs"` en frontend/package.json y comprobar que frontend/vercel.json (heredado de SakaiNG) ya reescribe las rutas a `/index.html` (research R3)
- [X] T005 🤖 Verificar en local, sin dejar cambios:
  - `npm run build:vercel` sin variables falla con el mensaje;
  - con variables de ejemplo (`https://ejemplo.supabase.co`, `sb_publishable_ejemplo`) compila y pasa `check:bundle`.

  Restaurar después frontend/src/environments/environment.ts con `git checkout` y confirmar que `git status` no lo muestra modificado.

**Punto de control**: el repositorio está listo para Vercel.

---

## Fase 3: Historia 1 — Backend en la nube (Prioridad: P1)

**Objetivo**: CA-001 de T-02.

- [X] T006 [US1] 🧑 Crear el proyecto en supabase.com (plan Free; región recomendada São Paulo) y pasar al agente solo el `ref`, la URL y la clave publicable
- [X] T007 [US1] 🧑 En la raíz del repositorio: `npx supabase login`, `npx supabase link --project-ref <ref>` (contraseña de la base de datos en el terminal) y `npm run db:push`. Luego `npx supabase migration list`: las 11 migraciones, en local y en remoto
- [X] T008 [US1] 🧑 Ejecutar en el editor SQL del panel la consulta de verificación de docs/engineering/deployment.md: 0 usuarios y 0 academias; 3 planes; 2 documentos legales vigentes; 2 buckets
- [X] T009 [US1] 🧑 Configurar la autenticación en el panel según `contracts/deployment.md` (confirmar correo activo, contraseña mínima 8, Site URL y Redirect URLs tras T011) e invitar al equipo del proyecto con los correos que probarán

---

## Fase 4: Historia 2 — Frontend publicado (Prioridad: P1)

**Objetivo**: CA-002, CA-003 y CA-005 de T-02.

- [X] T010 [US2] 🤖 Hacer el commit de la rama, subirla y abrir el PR, para que Vercel tenga `vercel.json` y `build:vercel`. Hacer el merge cuando el responsable lo apruebe
- [X] T011 [US2] 🧑 Importar el repositorio en vercel.com con los ajustes de `contracts/deployment.md` y las variables `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` (Production y Preview). Pasar al agente la URL de producción y el patrón de las vistas previas
- [X] T012 [US2] 🤖 Verificar desde el PC:
  - la URL pública responde con HTTPS;
  - `/auth/register` y `/settings/venues` cargan al abrirse directamente (CA-003);
  - los archivos JS publicados no contienen claves privilegiadas: se descargan y se pasa la misma comprobación de `check:bundle` (CA-005).

---

## Fase 5: Historia 3 — Cuenta de punta a punta (Prioridad: P1)

**Objetivo**: CA-004 de T-02.

- [X] T013 [US3] 🧑 En el celular: registrarse con un correo del equipo, abrir el enlace de verificación en el mismo navegador, iniciar sesión, editar el perfil, subir un logo, crear una sede y recuperar la contraseña. Medir el tiempo del registro (SC-001)
- [ ] T014 (pendiente: se confirma con el próximo PR) [US3] 🧑 Abrir un PR de prueba y comprobar su vista previa y que el enlace del correo vuelve a ella. Hacer merge de un cambio y medir la publicación (SC-003)

---

## Fase 6: Historia 4 — Local intacto y guía (Prioridad: P2)

**Objetivo**: CA-006 de T-02 y FR-011, FR-012.

- [X] T015 [P] [US4] 🤖 Escribir docs/engineering/deployment.md (research R7):
  - quién hace qué;
  - comandos de Supabase;
  - ajustes de Vercel y de autenticación;
  - consulta de verificación;
  - cómo aplicar migraciones nuevas (`npm run db:push` tras el merge de una spec con migraciones);
  - limitaciones del entorno de pruebas (correo solo para el equipo, sin copias de seguridad propias, documentos legales provisionales, Vercel Hobby no comercial).

  Enlazarla desde docs/engineering/README.md.
- [X] T016 [P] [US4] 🤖 Actualizar docs/architecture/decisions.md (ADR-016: frontend en Vercel Hobby, configuración por variables, entorno de pruebas y Vercel Pro u otro alojamiento como requisito del piloto con academias que paguen) y docs/architecture/supabase-environments.md (el entorno de pruebas existe; enlace a la guía). Añadir «Vercel Pro u otro alojamiento comercial» a «Antes del piloto» en docs/product/roadmap.md
- [X] T017 [US4] 🤖 Verificar el entorno local (CA-006): `npm run db:test` desde la raíz y `npm start` contra Supabase local

---

## Fase 7: Pulido y cierre

- [X] T018 🤖 `npm run lint` y `npm run build` una vez desde frontend/
- [X] T019 [P] 🤖 Completar «Resultados» en specs/008-deployment/quickstart.md y marcar T-02 como «Terminado (entorno de pruebas)» con su tabla de avance en docs/backlog/enablers/T-02-deployment.md

---

## Dependencias y orden de ejecución

- Fase 1 y 2 (🤖) y T015 y T016 (guía y documentos) → T010 (PR y merge): todo entra en el mismo PR (análisis I1).
- US1 (🧑) puede empezar en paralelo con las fases 1 y 2. T009 necesita la URL de T011 para las redirecciones.
- T011 requiere el merge de T010 y la URL y la clave de T006.
- US3 requiere US1 y US2 completas.
- US4 en paralelo con las demás; T017 al final.

## Oportunidades de paralelismo

- T003 con T002 (tras escribir la firma de la validación).
- T006 a T008 (🧑) mientras el agente hace T001 a T005.
- T015 y T016.

## Estrategia de implementación

### MVP primero

T001 a T005 y T010: el repositorio queda listo y subido. Con eso, el responsable puede crear los proyectos y publicar.

### Entrega incremental

Backend (US1) → frontend (US2) → prueba de punta a punta (US3) → guía y cierre. La documentación (US4) entra en el mismo PR que T001 a T005.

## Notas

- Si un paso del responsable falla, el agente revisa el mensaje sin pedir secretos. Puede consultar `npx supabase migration list` si el responsable inició sesión en este equipo.
- `supabase/config.toml` no se usa para la nube: la configuración de Auth en la nube vive en el panel.
