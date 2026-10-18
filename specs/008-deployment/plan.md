# Plan de implementación: Despliegue del entorno de pruebas

**Branch**: `008-deployment` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Especificación de `/specs/008-deployment/spec.md` (habilitador T-02)

## Resumen

Publicar PlayerTech como entorno de pruebas. Hay poco código: lo principal es configuración y una guía. El trabajo se reparte entre el agente (repositorio) y el responsable de producto (cuentas y paneles).

- **Backend** (R1, R4): el responsable crea el proyecto de Supabase en la nube y aplica las migraciones con `supabase link` y `supabase db push` desde su terminal, con su sesión y su contraseña (nunca en el chat). `db push` no aplica el seed. La autenticación se configura en el panel: URL del sitio, redirecciones con comodín para las vistas previas y contraseña mínima de 8.
- **Configuración del frontend** (R2): la URL y la clave publicable llegan como **variables de entorno de Vercel**. `frontend/scripts/write-environment.mjs` genera `environment.ts` al compilar en Vercel y falla si faltan, así que nunca se publica una versión rota. En el repositorio, `environment.ts` sigue vacío: el código no lleva valores de ningún entorno (`supabase-environments.md`).
- **Vercel** (R3): proyecto conectado a GitHub con raíz en `frontend/`; `npm run build:vercel` (genera la configuración, compila y ejecuta `check:bundle`); salida `dist/playertech/browser`; `vercel.json` con la reescritura de rutas a `index.html`.
- **Guía y documentación** (R6, R7): `docs/engineering/deployment.md`; actualización de ADR-016 (Vercel y su límite de uso no comercial en el plan gratuito) y de `supabase-environments.md`; script `db:push` en la raíz.

## Contexto técnico

**Lenguaje/versión**: TypeScript 5.9 y Node 24 LTS (`engines` en `frontend/package.json`)

**Dependencias principales**: Angular 21.2 (compilación de producción ya existente), Supabase CLI (raíz del repositorio), Vercel (integración con GitHub). **Sin dependencias nuevas.**

**Almacenamiento**: proyecto de Supabase en la nube (plan Free, ADR-016) con las 11 migraciones; Storage con los buckets de las migraciones

**Pruebas**: script de verificación de la configuración con su prueba; `check:bundle` en cada compilación de Vercel; validación de punta a punta en la nube según `quickstart.md`; `npm run db:test` local (CA-006)

**Plataforma objetivo**: navegadores modernos, móvil primero; HTTPS de Vercel

**Tipo de proyecto**: SPA estática en Vercel sobre BaaS

**Objetivos de rendimiento**: publicación automática en menos de 10 min tras el merge (SC-003)

**Restricciones**:
- Solo valores públicos en el cliente (ADR-015, FE-03; principio VIII).
- Secretos nunca en el chat ni en el repositorio (decisión del 2026-10-18).
- `supabase/config.toml` sigue siendo solo para el entorno local.
- Sin cambios en el esquema (ADR-017 intacta).

**Escala/alcance**: 1 script, 1 archivo de Vercel, 2 scripts de npm, 1 guía y actualizaciones de documentos

## Documentación de referencia obligatoria

La implementación DEBE leer estos documentos antes de empezar y aplicarlos junto con este plan. Ante un conflicto, se aplica la precedencia de `AGENTS.md` y se detiene la implementación hasta resolverlo.

| Documento | Qué se toma de él (y qué no aplica) |
|---|---|
| `.specify/memory/constitution.md` | Principios I (habilitador), II, VIII (secretos), X (documentación) |
| `AGENTS.md` | Comandos, reglas de secretos, Git |
| `docs/backlog/enablers/T-02-deployment.md` | Criterios CA-001 a CA-006 y alcance. **No aplica**: lo marcado como «No incluye» |
| `docs/architecture/decisions.md` | ADR-014 (autenticación), ADR-015 (FE-03), ADR-016 (plan y requisitos del piloto), ADR-017 |
| `docs/architecture/supabase-environments.md` | Configuración por variables de entorno; migraciones reproducibles; seed solo en desarrollo |
| `docs/architecture/supabase-migrations-guide.md` | Cómo se aplican las migraciones |
| `docs/engineering/security.md` | Secretos y riesgos aceptados |
| `docs/product/roadmap.md` | «Antes del piloto»: lo que este despliegue no cubre |
| `specs/002-frontend-foundation/` | Validación de la configuración al arrancar (FR-007) y `check:bundle` |

## Verificación de la Constitución

*Puerta: debe cumplirse antes de la Fase 0 y revisarse tras la Fase 1.*

| Principio | Estado | Evidencia |
|---|---|---|
| I. SDD | ✅ Cumple | Habilitador T-02 con criterios de aceptación técnicos y esta spec |
| II. Simplicidad | ✅ Cumple | Un script de configuración y un `vercel.json`; Vercel y Supabase hacen el resto |
| III. Separación de responsabilidades | ✅ Cumple | Sin cambios en las capas; la configuración llega por `APP_CONFIG` como hasta ahora |
| V. Base tecnológica | ✅ Cumple | Compilación de producción de Angular existente |
| VI. Multi-tenant | ✅ Cumple | Mismas migraciones y RLS que en local |
| VIII. Seguridad | ✅ Cumple | Solo valores públicos; `check:bundle` en cada compilación; secretos solo en el terminal y los paneles del responsable |
| IX. Calidad verificable | ✅ Cumple | Prueba del script, `check:bundle` automático y quickstart en la nube |
| X. Documentación | ✅ Cumple | Guía de despliegue; ADR-016 y `supabase-environments.md` actualizados |
| XI. Spec Kit | ✅ Cumple | Documentación de referencia listada |
| XII. Excepciones | ✅ Sin excepciones | — |
| XIII. Experiencia de usuario | ✅ Cumple | Sin pantallas nuevas; la verificación en la nube se hace desde el celular |

**Revisión tras la Fase 1**: sin violaciones.

## Estructura del proyecto

### Documentación (esta funcionalidad)

```text
specs/008-deployment/
├── plan.md
├── research.md                 # R1 a R7
├── data-model.md               # Configuración por entorno
├── quickstart.md               # Pasos de despliegue y verificación (quién hace qué)
├── contracts/deployment.md     # Variables, comandos, Vercel y Auth
├── checklists/requirements.md
└── tasks.md
```

### Código y configuración

```text
package.json                              # db:push (raíz)
frontend/
├── package.json                          # build:vercel
├── vercel.json                           # Ya existente: reescritura de rutas de la SPA
└── scripts/
    ├── write-environment.mjs             # Genera environment.ts desde las variables de Vercel
    └── write-environment.test.mjs        # Prueba del script (node --test)
docs/engineering/deployment.md            # Guía
docs/architecture/decisions.md            # ADR-016 actualizado
docs/architecture/supabase-environments.md
docs/backlog/enablers/T-02-deployment.md  # Estado al cerrar
```

**Decisión de estructura**: todo lo de Vercel vive en `frontend/`, la raíz del proyecto en Vercel. Lo de Supabase sigue en la raíz.

## Complejidad

Sin violaciones de la Constitución que justificar.
