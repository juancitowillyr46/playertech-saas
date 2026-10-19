# HU-033 — Gestionar jugador

**Épica:** EP-02 — Gestión de jugadores · **Fase:** 2 — Negocio · **Prioridad:** MVP · **Estado:** Terminada (entorno local)
**Spec:** [`specs/009-players-guardians-groups/`](../../../specs/009-players-guardians-groups/spec.md) (**implementada**; validación en su `quickstart.md`)

## Historia de usuario

> Como **owner**, quiero ver la ficha de un jugador y mantener sus datos al día, desactivarlo cuando deja de entrenar o eliminarlo si lo registré por error.

## Criterios de aceptación

### CA-001 — Ficha del jugador
**Dado** un jugador del listado,
**cuando** el owner lo abre,
**entonces** ve sus datos, edad, grupos, estado y acudientes (HU-034).

### CA-002 — Editar
**Dado** la ficha del jugador,
**cuando** el owner cambia sus datos o sus grupos y guarda,
**entonces** se actualizan con las mismas validaciones del registro (HU-002 CA-002, CA-003, CA-006 y CA-007) y se muestra una confirmación.

### CA-003 — Desactivar y reactivar
**Dado** un jugador activo,
**cuando** el owner lo desactiva,
**entonces** queda inactivo con todos sus datos, sale del listado por defecto y no aparecerá para convocar. Un jugador inactivo puede reactivarse.

### CA-004 — Eliminar
**Dado** un jugador,
**cuando** el owner elige eliminarlo y confirma en un mensaje que nombra al jugador,
**entonces** deja de aparecer en PlayerTech (borrado lógico) y se muestra una confirmación.

### CA-005 — Cambios sin guardar
**Dado** el formulario con cambios sin guardar,
**cuando** el owner intenta salir,
**entonces** se le pide confirmación.

## Reglas de negocio

- Desactivar no pide confirmación (es reversible); eliminar sí.
- Eliminar no se revierte desde la interfaz (DEC-27). Sus vínculos con grupos y acudientes dejan de mostrarse.
- La regla de jugador ya registrado (DEC-42) aplica también al editar.

## Fuera de alcance

- Restaurar jugadores eliminados.
- Historial de cambios del jugador.

## Decisiones relacionadas

ADR-018: DEC-36 y DEC-42 · ADR-012 (DEC-26 y DEC-27, por analogía con las sedes).
