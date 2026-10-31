# Plan de implementación: Documentos legales en la aplicación

**Branch**: `016-legal-documents-dialog` | **Date**: 2026-10-25 | **Spec**: [spec.md](./spec.md)

**Input**: Especificación de `/specs/016-legal-documents-dialog/spec.md` (Fase 2, spec 6: HU-043)

## Resumen

- **Texto** (R1 y R6): un HTML estático por documento y versión en `frontend/public/legal/`, con el borrador base para Colombia y marcadores para los datos del responsable.
- **Base de datos** (R2): una migración deja la v1 como historial y publica la `2026-10-v2` como vigente, con la ruta de su archivo; `seed.sql` pasa a la v2.
- **Frontend** (R3 a R5): `LegalTextRepository` y `LegalDocumentService` en `core/legal`, un dialog compartido y su uso en el registro, en la ficha del acudiente y en la respuesta pública.
- **Maqueta** antes de las tareas (R7).

## Contexto técnico

**Lenguaje/versión**: TypeScript 5.9, HTML y SQL (PostgreSQL 17); Node 24 LTS

**Dependencias principales**: Angular 21.2, PrimeNG 21.1 (`p-dialog`), Tailwind CSS 4. **Sin dependencias nuevas.**

**Almacenamiento**: Supabase, solo filas nuevas en `legal_documents`; en la nube con `db:push` tras el merge y con autorización. El texto se publica con el frontend (Vercel)

**Pruebas**: pgTAP nueva (`140-legal-documents-v2.test.sql`); Vitest de `core/legal`, del dialog y de los tres sitios. Solo las de la spec

**Plataforma objetivo**: navegadores modernos, móvil primero desde 360 px, con sesión y sin ella

**Tipo de proyecto**: SPA Angular sobre BaaS

**Objetivos de rendimiento**: el texto se descarga una vez por sesión de la pantalla; documentos de menos de 30 KB

**Restricciones**: capas y estilos del proyecto; ADR-017; un archivo publicado no se modifica (DEC-49)

**Escala/alcance**: 1 migración, 2 documentos, 1 componente compartido y 3 pantallas ajustadas

## Documentación de referencia obligatoria

La implementación DEBE leer estos documentos antes de empezar y aplicarlos junto con este plan. Ante un conflicto, se aplica la precedencia de `AGENTS.md` y se detiene la implementación hasta resolverlo.

| Documento | Qué se toma de él (y qué no aplica) |
|---|---|
| `.specify/memory/constitution.md` | Principios II, III, IV, VIII, IX y XIII |
| `AGENTS.md` y `CLAUDE.md` | Capas, estilos, portabilidad, Impeccable, Git, `db:push` |
| HU-043, HU-014 y EP-00 | Criterios y reglas. **No aplica**: el texto legal definitivo |
| `docs/architecture/decisions.md` | ADR-002, ADR-016, ADR-017 y ADR-018 (DEC-19 y DEC-49) |
| `docs/product/roadmap.md` | «Antes del piloto»: documentos legales definitivos (este es el borrador) |
| `docs/engineering/coding-standards.md` y `testing.md` | Claridad, Prettier, sin `any`; pruebas por spec |
| `docs/architecture/frontend.md`, `ui.md` y `DESIGN.md` | Capas, cuándo usar dialog o drawer, tipografía y colores |
| `specs/001-…`, `003-…`, `006-academy-registration`, `009-…` y `013-responses-tracking` | `legal_documents`, el registro y sus aceptaciones, las plantillas de correo (patrón de HTML aparte), la autorización del acudiente y la respuesta pública |

## Verificación de la Constitución

| Principio | Estado | Evidencia |
|---|---|---|
| I. SDD | ✅ Cumple | HU-043 Definida (DEC-49) |
| II. Simplicidad | ✅ Cumple | Archivos estáticos; sin tabla ni editor |
| III. Separación de responsabilidades | ✅ Cumple | Repositorio y servicio en `core/legal`; dialog compartido |
| IV. Reutilización controlada | ✅ Cumple | Un dialog para los tres sitios; `LegalDocumentsRepository` existente |
| VIII. Seguridad | ✅ Cumple | El texto se sanea al mostrarse; la versión aceptada la sigue validando la base de datos |
| IX. Calidad verificable | ✅ Cumple | pgTAP, Vitest y quickstart |
| XIII. Experiencia de usuario | ✅ Cumple | Maqueta antes de las tareas; pantalla completa en el celular |

Revisión tras el diseño: sin cambios. Sin excepciones.

## Estructura del proyecto

```text
specs/016-legal-documents-dialog/  plan.md · research.md · data-model.md · quickstart.md · contracts/ · mockups/ · tasks.md
supabase/migrations/20261025100000_legal_documents_v2.sql
supabase/tests/database/140-legal-documents-v2.test.sql
supabase/seed.sql                                   # acepta la v2
frontend/public/legal/{terms,privacy_policy}/2026-10-v2.html
frontend/src/app/
├── core/legal/                                     # LegalTextRepository, FetchLegalTextRepository, LegalDocumentService
├── shared/components/legal-document-dialog/        # NUEVO
├── features/auth/register/                         # abre el dialog
├── features/players/components/guardian-drawer/    # abre el dialog
└── features/call-up-response/pages/call-up-response/  # abre el dialog
```
