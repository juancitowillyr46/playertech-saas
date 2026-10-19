# HU-004 — Gestionar grupos

**Épica:** EP-03 — Grupos y categorías · **Fase:** 2 — Negocio · **Prioridad:** MVP · **Estado:** Terminada (entorno local)
**Spec:** [`specs/009-players-guardians-groups/`](../../../specs/009-players-guardians-groups/spec.md) (**implementada**; validación en su `quickstart.md`)

## Historia de usuario

> Como **owner**, quiero organizar a mis jugadores en grupos o categorías (por ejemplo, «Sub-12»), para convocarlos por grupo en lugar de uno por uno.

## Criterios de aceptación

### CA-001 — Crear grupo
**Dado** que el owner escribe el nombre del grupo,
**cuando** guarda,
**entonces** el grupo queda creado y aparece en el listado de grupos.

### CA-002 — Nombre obligatorio y único
**Dado** que el nombre está vacío, o coincide con otro grupo no eliminado de la academia (sin distinguir mayúsculas ni espacios sobrantes),
**cuando** el owner intenta guardar,
**entonces** el campo lo indica y no se guarda nada.

### CA-003 — Listado de grupos
**Dado** que la academia tiene grupos,
**cuando** el owner abre Grupos,
**entonces** ve cada grupo con su número de jugadores activos.

### CA-004 — Integrantes
**Dado** un grupo,
**cuando** el owner lo abre,
**entonces** ve sus integrantes y puede **agregar** jugadores activos (con buscador) o **quitarlos** del grupo. También puede cambiar los grupos de un jugador desde su ficha (HU-033).

### CA-005 — Editar el nombre
**Dado** un grupo,
**cuando** el owner cambia su nombre con las mismas validaciones y guarda,
**entonces** se actualiza.

### CA-006 — Eliminar grupo
**Dado** un grupo,
**cuando** el owner lo elimina y confirma en un mensaje que nombra el grupo,
**entonces** el grupo deja de aparecer (borrado lógico); sus jugadores siguen registrados, solo dejan de pertenecer a ese grupo.

### CA-007 — Estado vacío y aislamiento
**Dado** que la academia no tiene grupos,
**cuando** el owner abre Grupos,
**entonces** ve una invitación a crear el primero. Nunca ve grupos de otras academias.

## Reglas de negocio

- Un jugador puede estar en varios grupos (DEC-35).
- Los jugadores inactivos siguen siendo integrantes, pero se muestran como inactivos y no cuentan en el número del grupo.
- Grupo y categoría son el mismo concepto en el MVP (glosario).
- Los nombres de grupos eliminados pueden reutilizarse.

## Fuera de alcance

- Categorías automáticas por edad.
- Entrenadores o horarios del grupo.
- Estadísticas del grupo.

## Decisiones relacionadas

ADR-018: DEC-35 · ADR-012 (DEC-27).
