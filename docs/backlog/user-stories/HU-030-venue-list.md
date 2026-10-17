# HU-030 — Consultar sedes

**Épica:** EP-12 — Sedes · **Fase:** 1 — Fundación SaaS · **Prioridad:** MVP · **Estado:** Definida
**Spec:** [`specs/004-venues-management/`](../../../specs/004-venues-management/spec.md) (en especificación)

> **Versión de lectura disponible:** la spec 003 (`specs/003-design-system/`, T-01) construyó la pantalla modelo de Sedes en `frontend/src/app/features/venues/` con lectura real: listado, sede principal, estados activa e inactiva y aislamiento por RLS (adelanta CA-001 a CA-004; CA-005 lo garantiza la base de datos). Esta HU la **completa** y la verifica formalmente; crear, editar, desactivar y eliminar siguen como maqueta hasta HU-029 y HU-031.

## Historia de usuario

> Como **owner**, quiero consultar las sedes de mi academia, para conocer los lugares registrados y su estado.

## Criterios de aceptación

### CA-001 — Listado de sedes

**Dado** que el owner accede a la gestión de sedes,
**cuando** se muestra el listado,
**entonces** puede ver todas las sedes no eliminadas de su academia, con su nombre, tipo, ciudad y estado.

### CA-002 — Sede principal identificada

**Dado** que se muestra el listado,
**cuando** el owner lo consulta,
**entonces** puede identificar cuál es la sede principal.

### CA-003 — Sedes inactivas

**Dado** que existen sedes desactivadas,
**cuando** el owner consulta el listado,
**entonces** las ve identificadas como inactivas.

### CA-004 — Sedes eliminadas

**Dado** que el owner eliminó una sede,
**cuando** consulta el listado,
**entonces** esa sede no aparece.

### CA-005 — Aislamiento

**Dado** que existen otras academias en PlayerTech,
**cuando** el owner consulta sus sedes,
**entonces** solo ve las sedes de su propia academia.

## Reglas de negocio

- El listado siempre contiene al menos la sede principal, por lo que no existe un estado vacío.

## Fuera de alcance

- Búsqueda y filtros avanzados.
- Vista de mapa.

## Decisiones relacionadas

DEC-05, DEC-26, DEC-27 (ADR-012).
