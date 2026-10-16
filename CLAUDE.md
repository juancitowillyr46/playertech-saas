# PlayerTech — Guía para Claude

PlayerTech es un SaaS multi-tenant para academias deportivas (inicialmente fútbol, en Colombia). Cada academia es un tenant aislado. El proyecto se desarrolla con Spec-Driven Development (SDD) usando GitHub Spec Kit.

## Idioma

- Conversación y documentación: **español**.
- Código, nombres de archivos, rutas (URLs), commits y ramas: **inglés**.
- Textos de la interfaz: **español (Colombia)**, con el vocabulario de `docs/product/glossary.md`.

## Fuentes de verdad y precedencia

Ante un conflicto, prevalece el documento que aparece primero:

1. **Constitución** — `.specify/memory/constitution.md`
2. **Decisiones de arquitectura (ADR)** — `docs/architecture/decisions.md`
3. **Documentación de arquitectura e ingeniería** — `docs/architecture/`, `docs/engineering/`
4. **Diseño** — `DESIGN.md` (sistema visual y tokens) y `docs/architecture/ui.md` (patrones y navegación)
5. **Backlog y specs** — `docs/backlog/`, `specs/`
6. **Skills** (Impeccable, frontend-design, Spec Kit): se aplican **dentro** de los límites anteriores, nunca por encima

| Carpeta | Contenido |
|---|---|
| `docs/product/` | Visión, alcance, roadmap y glosario |
| `docs/backlog/` | Épicas (`epics/`), historias de usuario (`user-stories/`) y habilitadores técnicos (`enablers/`) |
| `docs/architecture/` | ADR, modelo de datos, frontend, UI, Supabase |
| `docs/engineering/` | Estándares de código, Git, pruebas, seguridad, SDD, actualización de SakaiNG |
| `specs/` | Specs de Spec Kit por funcionalidad (`spec.md`, `plan.md`, `tasks.md`) |
| `frontend/` | Aplicación Angular |
| `supabase/` | Migraciones, seed y pruebas de base de datos (pendiente de crear en T-00) |

No dupliques conocimiento entre documentos: enlaza a la fuente correspondiente (principio X de la Constitución).

## Flujo de trabajo (SDD + Spec Kit)

```text
HU / habilitador (Definida) → /speckit-specify → /speckit-clarify → /speckit-plan
→ /speckit-tasks → /speckit-analyze → /speckit-implement → pruebas → DoD
```

- Una spec cubre una o varias HU de la misma épica y **referencia** sus criterios de aceptación (por ejemplo, "CA-002 de HU-014") en lugar de copiarlos.
- Definition of Ready, Definition of Done y estados de las HU: `docs/backlog/README.md`.
- Estado actual: **Fase 1 — Fundación SaaS** (T-00, T-01, EP-00, EP-01, EP-09, EP-12). La Fase 2 (negocio) está pendiente de ideación.

## Reglas de arquitectura que no se negocian

- **Multi-tenant:** toda tabla de negocio lleva `academy_id`; la autorización se valida con RLS y las funciones `is_academy_member`, `has_academy_role` y `current_academy_id`. Nunca `academy_id = auth.uid()`, nunca confiar en un `academy_id` enviado por el cliente.
- **Capas en el frontend:** página/componente → service → repositorio (clase abstracta) → implementación Supabase. Ningún componente usa el SDK de Supabase.
- **Sin secretos en el cliente:** solo valores públicos de Supabase; nunca la `service role key`.
- **Borrado lógico** (`deleted_at`) en las tablas de negocio.
- Detalle: ADR-012 a ADR-015 y `docs/architecture/frontend.md`.

## Diseño y estilos

PlayerTech usa **PrimeNG** para los componentes, **SakaiNG** como estructura de layout (adoptado como código propio, ADR-015) y **Tailwind CSS** para composición. El objetivo es una identidad propia y de calidad (T-01) **sin abandonar esa base**.

### Dónde se escriben los estilos

Todo cambio visual entra **solo** por estos sitios, en este orden de preferencia:

| # | Sitio | Para qué |
|---|---|---|
| 1 | **Preset de tokens** — `frontend/src/app/core/theme/` (`definePreset` sobre Aura, registrado en `providePrimeNG`) | Color, superficies, tipografía, radios, foco, densidad y ajustes por componente de PrimeNG. Se propaga también al layout de Sakai, cuyas variables (`src/assets/layout/variables/_common.scss`) leen los tokens `--p-*` |
| 2 | **Utilidades de Tailwind** en las plantillas | Composición, espaciado y responsive. Usar los colores ligados a tokens (`primary`, `surface`, `text-color`…) de `tailwindcss-primeui` |
| 3 | **SCSS del layout de Sakai** — `frontend/src/assets/layout/` | Chasis: topbar, menú, contenedor principal, tipografía base (`_core.scss`, `_typography.scss`). Se modifican los parciales existentes respetando su estructura; no se crea una hoja de layout paralela |

### Prohibido

- CSS que sobrescriba clases internas de PrimeNG (`.p-button`, `.p-datatable…`) o que use `!important`. Si un componente necesita otro aspecto, se ajustan sus tokens en el preset.
- Colores, tamaños o sombras en valores fijos (hex, px sueltos) en plantillas o componentes cuando exista un token o una utilidad.
- Atributos `style` en línea y hojas de estilo por componente con reglas globales.
- Nuevas librerías de CSS o de componentes.
- Modificar las demos de `frontend/src/app/pages/` para implementar producto (solo son referencia).

### Skills de diseño

- **Impeccable:** `PRODUCT.md` es su brief de producto y marca (enlaza a `docs/product/vision.md`); `DESIGN.md` es el sistema visual. Al aplicar cualquier comando, traducir sus propuestas a los tres sitios anteriores. Los comandos de estética fuerte (`bolder`, `overdrive`, `delight`, `animate`) solo se usan si se piden expresamente. Sus hooks automáticos no están activados.
- **frontend-design:** se aplica para el proceso y los textos de la interfaz; la dirección visual la fijan `DESIGN.md` y T-01, no la skill.
- Cada pantalla pasa por `/impeccable critique`, `/impeccable audit` y `/impeccable polish` antes de darse por terminada.
- Diseño **primero para móvil**: el usuario principal trabaja desde el celular.

## Comandos

Desde `frontend/`:

```bash
npm install
npm start          # servidor de desarrollo en http://localhost:4200
npm run build
npm test
```

## Git

- No hacer commit ni push sin que se pida.
- Ramas: `<nnn>-<nombre>` para specs (la que crea Spec Kit), `docs/<tema>`, `chore/<tema>`, `fix/<tema>`.
- Commits con Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`), en inglés.
- Detalle: `docs/engineering/git.md`.
