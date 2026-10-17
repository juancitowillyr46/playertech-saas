# PlayerTech — Adaptador para Claude Code

La guía operativa común del proyecto está en `AGENTS.md` y se importa aquí. Este archivo solo añade lo específico de Claude Code; no establece principios (principio X de la Constitución).

@AGENTS.md

## Específico de Claude Code

### Spec Kit

- Los comandos se invocan como skills con guion: `/speckit-specify`, `/speckit-clarify`, `/speckit-plan`, `/speckit-tasks`, `/speckit-analyze`, `/speckit-implement`, `/speckit-constitution`.
- Antes de `/speckit-implement`, leer todos los documentos de la sección "Documentación de referencia obligatoria" del `plan.md` (ver `AGENTS.md`).

### Skills de diseño

- **Impeccable:** usa `PRODUCT.md` como brief y `DESIGN.md` como sistema visual. Al aplicar cualquier comando, traducir sus propuestas a los tres sitios de estilos de `AGENTS.md`. Los comandos de estética fuerte (`bolder`, `overdrive`, `delight`, `animate`) solo se usan si se piden expresamente. Sus hooks automáticos no están activados y su telemetría está desactivada.
- **frontend-design:** se aplica para el proceso y los textos de la interfaz; la dirección visual la fijan `DESIGN.md` y T-01, no la skill.
- La revisión de experiencia y accesibilidad (principio XIII) se hace con `/impeccable critique`, `/impeccable audit` y `/impeccable polish` antes de dar una pantalla por terminada.
