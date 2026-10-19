# HU-036 — Gestionar actividad

**Épica:** EP-04 — Gestión de actividades · **Fase:** 2 — Negocio · **Prioridad:** MVP · **Estado:** Definida
**Spec:** spec 2 de la Fase 2 (actividades y canchas)

## Historia de usuario

> Como **owner**, quiero corregir, cancelar o eliminar una actividad, para que la programación esté siempre al día.

## Criterios de aceptación

### CA-001 — Editar
**Dado** una actividad próxima (de hoy en adelante, aún no empezada),
**cuando** el owner cambia sus datos y guarda,
**entonces** se actualiza con las mismas validaciones de HU-005 (CA-003).

### CA-002 — Cancelar y reactivar
**Dado** una actividad programada,
**cuando** el owner la cancela y confirma,
**entonces** queda con el sello «Cancelada», sigue en el listado y puede **reactivarse**.

### CA-003 — Eliminar
**Dado** una actividad,
**cuando** el owner la elimina y confirma en un diálogo que la nombra (tipo, fecha y hora),
**entonces** deja de mostrarse (borrado lógico).

### CA-004 — Sin guardar
**Dado** cambios sin guardar,
**cuando** el owner cierra el formulario,
**entonces** se pide confirmación.

### CA-005 — Actividad repetida
**Dado** una actividad generada por repetición,
**cuando** el owner la edita, cancela o elimina,
**entonces** el cambio afecta solo a esa actividad.

### CA-006 — Actividad pasada
**Dado** una actividad que ya pasó,
**cuando** el owner la abre,
**entonces** ve sus datos pero no puede editarla ni cancelarla; solo eliminarla.

## Reglas de negocio

- Una actividad pasada no se modifica (decisión del responsable, 2026-10-18).
- Cancelar es reversible y pide confirmación; eliminar pide confirmación y no se revierte desde la interfaz.
- En la spec 3, cancelar una actividad con convocatoria permitirá avisar a los convocados.

## Decisiones relacionadas

ADR-018: DEC-44.
