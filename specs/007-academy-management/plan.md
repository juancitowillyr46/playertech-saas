# Plan de implementación: Gestión de la academia

**Branch**: `007-academy-management` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Especificación de `/specs/007-academy-management/spec.md` (EP-09: HU-032 y HU-017)

## Resumen

Completar la última épica de la Fase 1. **No hay migraciones** (R1): la spec 001 ya concede al owner la actualización de los campos de la academia (`name`, `logo_file_id`, `contact_email`, `contact_phone`, `address`, `city`), el bucket `public-assets` limita a JPG/PNG de 1 MB en el servidor, `files` tiene borrado lógico y `FileStorageRepository` (ADR-013) sube, publica y retira archivos.

- **Perfil** (R2 a R5): feature nueva `features/academy-profile/` con modelo, repositorio abstracto e implementación Supabase, servicio y pantalla en `/settings/academy`.
  - Formulario con validaciones y confirmación al salir con cambios.
  - Logo: validar (tipo, contenido, hasta 5 MB) → redimensionar y comprimir → subir → asignar → borrar la imagen anterior conservando su registro (decisión del 2026-10-18).
- **Contexto de academia** (R6): actualización en el sitio del nombre y el logo tras guardar, sin recargar el contexto.
- **Inicio** (R7): las cuatro tareas con estado y progreso «n de 4», calculadas a partir de la academia y la sede principal; la tarjeta se oculta con todo completo.
- **Revisión** de experiencia y accesibilidad (R8).

## Contexto técnico

**Lenguaje/versión**: TypeScript 5.9 (estricto) sobre Node 24 LTS

**Dependencias principales**: Angular 21.2, PrimeNG 21.1 (preset PlayerTech), Tailwind CSS 4, `@supabase/supabase-js` 2.117.2. **Sin dependencias nuevas.**

**Almacenamiento**: Supabase local (spec 001): `academies`, `files`, `subscriptions`, `venues` y Storage (`public-assets`). Sin migraciones.

**Pruebas**: Vitest 4.1 con Angular Testing Library; pgTAP existentes (aislamiento y storage); validación de punta a punta según `quickstart.md`. Durante el desarrollo solo las zonas tocadas; el conjunto completo una vez antes del commit.

**Plataforma objetivo**: navegadores modernos, móvil primero desde 360 px

**Tipo de proyecto**: SPA Angular sobre BaaS

**Objetivos de rendimiento**: confirmación visible en menos de 1 s tras guardar en local; el perfil se carga bajo demanda (sin crecimiento del bundle inicial)

**Restricciones**: capas página → servicio → repositorio abstracto → implementación Supabase (ADR-002, ADR-009); la academia sale del contexto, nunca del usuario; estilos solo por preset, Tailwind y layout; ADR-017 (sin usos nuevos de `auth.uid()` ni referencias nuevas al esquema `auth`)

**Escala/alcance**: 1 pantalla nueva (perfil), 1 pantalla ampliada (inicio), 1 feature nueva

## Documentación de referencia obligatoria

La implementación DEBE leer estos documentos antes de empezar y aplicarlos junto con este plan. Ante un conflicto, se aplica la precedencia de `AGENTS.md` y se detiene la implementación hasta resolverlo.

| Documento | Qué se toma de él (y qué no aplica) |
|---|---|
| `.specify/memory/constitution.md` | Principios II, III, IV, VI, VIII, IX y XIII |
| `AGENTS.md` y `CLAUDE.md` | Arquitectura, estilos, portabilidad (ADR-017), revisión con Impeccable, Git |
| `docs/backlog/user-stories/HU-017` y `HU-032` | Criterios y reglas; tareas de HU-032 actualizadas el 2026-10-18. **No aplica**: fuera de alcance de cada HU |
| `docs/architecture/decisions.md` | ADR-009, ADR-012 (DEC-07, DEC-15, DEC-17, DEC-21, DEC-22, DEC-27), ADR-013, ADR-015 (FE-13, FE-14) y ADR-017 |
| `docs/architecture/frontend.md` | Estructura de features, acceso a datos, errores |
| `docs/architecture/ui.md` y `DESIGN.md` | Página de configuración, formulario, mensajes, confirmaciones, inicio |
| `docs/architecture/database-schema.md` | Columnas de `academies` y `files` |
| `specs/001-database-foundation/contracts/` | Acceso por tabla y Storage |
| `specs/003-design-system/` | Pantalla modelo del inicio y su repositorio |
| `specs/004-venues-management/` | Patrón de formulario, validaciones, avisos y refresco (se reutiliza) |
| `docs/engineering/testing.md`, `coding-standards.md` y `security.md` | Pruebas, convención de nombres, validación en el servidor |
| `docs/product/glossary.md` | Vocabulario |

## Verificación de la Constitución

*Puerta: debe cumplirse antes de la Fase 0 y revisarse tras la Fase 1.*

| Principio | Estado | Evidencia |
|---|---|---|
| I. SDD | ✅ Cumple | Cubre HU-017 y HU-032 de EP-09; la decisión de la tarea de la sede está en HU-032 |
| II. Simplicidad | ✅ Cumple | Sin migraciones; el progreso se calcula en el cliente con datos ya legibles; reutiliza `FileStorageRepository` |
| III. Separación de responsabilidades | ✅ Cumple | Pantalla → `AcademyProfileService` → `AcademyProfileRepository` → implementación Supabase |
| IV. Reutilización controlada | ✅ Cumple | Validación de archivos de imagen en `shared/` solo si la usa más de un sitio; hoy vive en la feature |
| V. Base tecnológica | ✅ Cumple | PrimeNG (formulario, `FileUpload` o input nativo, confirmación, aviso) con el preset |
| VI. Multi-tenant | ✅ Cumple | La academia sale del contexto; RLS valida al owner |
| VII. Trazabilidad | ✅ Cumple | Matriz en `contracts/acceptance-coverage.md` |
| VIII. Seguridad | ✅ Cumple | Tipo y tamaño también en el bucket; escritura solo del owner por RLS |
| IX. Calidad verificable | ✅ Cumple | Pruebas de repositorio, servicio, pantallas y cálculo de tareas; quickstart |
| X. Documentación | ✅ Cumple | HU y épica cerradas al terminar |
| XI. Spec Kit | ✅ Cumple | Documentación de referencia listada |
| XII. Excepciones | ✅ Sin excepciones | — |
| XIII. Experiencia de usuario | ✅ Cumple | Móvil primero, confirmación solo donde hace falta, revisión de ambas pantallas |

**Revisión tras la Fase 1**: sin violaciones. Complejidad vacía.

## Estructura del proyecto

### Documentación (esta funcionalidad)

```text
specs/007-academy-management/
├── plan.md
├── research.md                  # R1 a R8
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── profile-contracts.md     # Repositorio, servicio, pantalla y validación del logo
│   └── acceptance-coverage.md
├── checklists/requirements.md
└── tasks.md
```

### Código fuente

```text
frontend/src/app/
├── core/academy-context/academy-context.service.ts   # applyAcademyChanges (R6)
├── core/storage/data/                                 # purge(file): borra la imagen y marca deleted_at (R4)
├── features/academy-profile/                         # Nueva (R2 a R5)
│   ├── academy-profile.routes.ts
│   ├── models/academy-profile.models.ts
│   ├── data/academy-profile.repository.ts
│   ├── data/supabase-academy-profile.repository.ts
│   ├── services/academy-profile.service.ts
│   ├── validators/logo-file.ts                       # Tipo, contenido y tamaño (hasta 5 MB)
│   ├── data/logo-image.ts                            # Redimensionar y comprimir en el navegador
│   └── pages/academy-profile-page/academy-profile-page.ts
├── features/settings/settings.routes.ts              # /settings/academy → la feature nueva
└── features/home/                                    # Tareas con estado y progreso (R7)
    ├── models/home-summary.models.ts
    ├── data/supabase-home-summary.repository.ts
    ├── services/home-summary.service.ts
    └── pages/home-page/home-page.ts
docs/backlog/user-stories/HU-017, HU-032, docs/backlog/epics/EP-09   # Estado al cerrar
```

**Decisión de estructura**: el perfil es una feature propia (`academy-profile`), como `venues`; `settings` solo agrupa las rutas.

## Complejidad

Sin violaciones de la Constitución que justificar.
