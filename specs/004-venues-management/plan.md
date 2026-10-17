# Plan de implementación: Gestión de sedes

**Branch**: `004-venues-management` | **Date**: 2026-10-17 | **Spec**: [spec.md](./spec.md)

**Input**: Especificación de `/specs/004-venues-management/spec.md` (EP-12: HU-029, HU-030 y HU-031)

## Resumen

Convertir la pantalla modelo de Sedes de la spec 003 en la gestión completa:
- registrar y editar con validaciones;
- marcar la sede principal;
- desactivar, reactivar y eliminar con confirmación.

Todo descansa en las reglas que la base de datos de la spec 001 ya impone (políticas por owner, índices únicos, `check` de la principal, `set_primary_venue` y borrado lógico), así que **no hay migraciones** (R1). El trabajo es de frontend:
- ampliar `VenueRepository` y su implementación Supabase (R3);
- añadir tres códigos de error genéricos (R4);
- dar a `VenuesService` las operaciones, la normalización y el refresco silencioso (R5, R6);
- sustituir la maqueta del drawer y del menú por acciones reales con sus motivos (R7).

## Contexto técnico

**Lenguaje/versión**: TypeScript 5.9 (estricto) sobre Node 24 LTS

**Dependencias principales**: Angular 21.2, PrimeNG 21.1 (preset PlayerTech), Tailwind CSS 4, `@supabase/supabase-js` 2.117.2. **Sin dependencias nuevas.**

**Almacenamiento**: Supabase local de la spec 001: tabla `venues` con RLS y función `set_primary_venue`. Sin migraciones (R1).

**Pruebas**: Vitest 4.1 con Angular Testing Library; las pgTAP existentes cubren las reglas de la base de datos; validación de punta a punta según `quickstart.md`.

**Plataforma objetivo**: navegadores modernos, móvil primero desde 360 px

**Tipo de proyecto**: SPA Angular sobre BaaS

**Objetivos de rendimiento**: aviso visible en menos de 1 s tras confirmar una operación en local (medido en la sección 2 de `quickstart.md`); bundle inicial sin crecimiento apreciable (la feature se carga bajo demanda)

**Restricciones**:
- Capas página → servicio → repositorio abstracto → implementación Supabase (ADR-002, ADR-009).
- La interfaz no elige la academia; RLS la valida (R2).
- Estilos solo por preset, Tailwind y el layout (`AGENTS.md`); `DESIGN.md`.
- Textos en español de Colombia.

**Escala/alcance**: 1 pantalla (Sedes), 5 operaciones de escritura, 3 códigos de error nuevos

## Documentación de referencia obligatoria

La implementación DEBE leer estos documentos antes de empezar y aplicarlos junto con este plan. Ante un conflicto, se aplica la precedencia de `AGENTS.md` y se detiene la implementación hasta resolverlo.

| Documento | Qué se toma de él (y qué no aplica) |
|---|---|
| `.specify/memory/constitution.md` | Principios III (capas), VI (multi-tenant), VIII (seguridad en la base de datos, no en el frontend), IX (pruebas) y XIII (móvil primero, accesibilidad y revisión de cada pantalla) |
| `AGENTS.md` y `CLAUDE.md` | Reglas de arquitectura y de estilos; revisión con Impeccable; Git |
| `docs/backlog/user-stories/HU-029`, `HU-030` y `HU-031` | Criterios de aceptación y reglas de negocio. **No aplica**: lo marcado como fuera de alcance (restaurar, mapas, horarios, Fase 2) |
| `docs/architecture/decisions.md` | ADR-002 y ADR-009 (repositorios y capas), ADR-012: DEC-04, DEC-05, DEC-07 y DEC-23 a DEC-27 |
| `docs/architecture/frontend.md` | Estructura de la feature (`pages/`, `services/`, `data/`, `models/`), acceso a datos y manejo de errores |
| `docs/architecture/ui.md` | Patrón de página de gestión (drawer, menú de fila, confirmación de acciones destructivas, avisos) y variante móvil |
| `DESIGN.md` | Sistema visual Planilla: botones, campos, sellos, filas regladas, estados y maqueta (que aquí se sustituye por funciones reales) |
| `docs/architecture/database-schema.md` | Columnas de `venues` y su semántica |
| `specs/001-database-foundation/contracts/database-api.md` | Acceso por tabla y firma de `set_primary_venue` |
| `specs/002-frontend-foundation/contracts/app-errors.md` | Catálogo de errores que se amplía (R4) |
| `specs/003-design-system/` | Pantalla modelo de Sedes, contratos de interfaz y repositorio de lectura de los que se parte |
| `docs/engineering/testing.md`, `coding-standards.md` y `security.md` | Pruebas, organización y validación en el servidor |
| `docs/product/glossary.md` | Vocabulario (sede, sede principal, oficina, lugar de entrenamiento) |

## Verificación de la Constitución

*Puerta: debe cumplirse antes de la Fase 0 y revisarse tras la Fase 1.*

| Principio | Estado | Evidencia |
|---|---|---|
| I. SDD | ✅ Cumple | La spec cubre HU-029, HU-030 y HU-031 de EP-12 y referencia sus criterios |
| II. Simplicidad | ✅ Cumple | Sin migraciones ni dependencias; se relee el listado tras cada operación en lugar de gestionar estado optimista (R6) |
| III. Separación de responsabilidades | ✅ Cumple | La pantalla usa `VenuesService`, que usa `VenueRepository`; solo `supabase-venue.repository.ts` conoce Supabase |
| IV. Reutilización controlada | ✅ Cumple | Códigos de error genéricos reutilizables en la Fase 2 (R4); sin componentes nuevos compartidos |
| V. Base tecnológica | ✅ Cumple | Componentes de PrimeNG (drawer, menú, confirmación, aviso) con el preset existente |
| VI. Multi-tenant | ✅ Cumple | La academia sale del contexto y la valida RLS; nunca la elige el usuario (R2) |
| VII. Trazabilidad | ✅ Cumple | Cada criterio de las tres HU tiene escenario, requisito y prueba o paso de validación |
| VIII. Seguridad | ✅ Cumple | Las reglas viven en la base de datos (políticas, índices, `check`, función); el frontend solo anticipa mensajes |
| IX. Calidad verificable | ✅ Cumple | Pruebas de repositorio, servicio y pantalla (R8); pgTAP existentes; quickstart |
| X. Documentación | ✅ Cumple | Se amplía el catálogo de errores enlazando; HU actualizadas al cerrar |
| XI. Spec Kit | ✅ Cumple | Documentación de referencia listada con su alcance |
| XII. Excepciones | ✅ Sin excepciones | — |
| XIII. Experiencia de usuario | ✅ Cumple | Móvil primero, motivos visibles en acciones no disponibles, confirmación solo donde es irreversible, revisión con Impeccable |

**Revisión tras la Fase 1**: el diseño no introduce violaciones. La sección de complejidad queda vacía.

## Estructura del proyecto

### Documentación (esta funcionalidad)

```text
specs/004-venues-management/
├── plan.md
├── research.md          # R1 a R8
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── repositories.md  # VenueRepository ampliado
│   ├── ui-contracts.md  # Formulario, menú de fila, confirmación y avisos
│   └── app-errors.md    # Códigos duplicate, rule_violation y not_found
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Código fuente

```text
frontend/src/app/
├── core/errors/
│   ├── app-error.ts                 # Códigos nuevos (R4)
│   ├── error-messages.ts            # Mensajes genéricos
│   └── supabase-error.mapper.ts     # 23505, 23514, PGRST116
├── shared/forms/field-a11y.ts       # Movido desde features/auth (segundo uso, principio IV)
└── features/venues/
    ├── models/venue.models.ts       # address, directions y VenueInput
    ├── data/
    │   ├── venue.repository.ts          # Contrato ampliado (R3)
    │   └── supabase-venue.repository.ts
    ├── services/venues.service.ts   # Operaciones, normalización, refresco silencioso, busy
    └── pages/venues-page/venues-page.ts   # Formulario real, menú con motivos, confirmación, avisos
specs/002-frontend-foundation/contracts/app-errors.md   # Nota que remite a esta spec
docs/backlog/user-stories/HU-029, HU-030, HU-031        # Estado al cerrar
```

**Decisión de estructura**: Se mantiene la feature `features/venues/` tal como la dejó la spec 003. No hay cambios en la base de datos.

## Complejidad

Sin violaciones de la Constitución que justificar.
