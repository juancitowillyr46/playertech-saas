# HU-008 — Gestionar convocatoria abierta

**Épica:** EP-05 — Gestión de convocatorias · **Fase:** 2 — Negocio · **Prioridad:** MVP · **Estado:** Terminada (entorno local; spec 012)
**Spec:** spec 3 de la Fase 2 (convocatoria y mensaje)

## Historia de usuario

> Como **owner**, quiero ajustar y cerrar una convocatoria mientras está abierta, para que refleje quién juega y hasta cuándo se responde.

## Criterios de aceptación

### CA-001 — Abierta con sus enlaces
**Dado** una convocatoria recién creada,
**cuando** el owner la ve en la actividad,
**entonces** está **abierta**, con sus listas, el número de convocados de cada una y un enlace por lista, secreto e impredecible.

### CA-002 — Ajustar convocados
**Dado** una convocatoria abierta,
**cuando** el owner quita o suma jugadores (HU-007, CA-002 y CA-003),
**entonces** las listas y sus enlaces quedan actualizados.

### CA-003 — Cambiar la fecha límite
**Dado** una convocatoria abierta,
**cuando** el owner cambia o quita la fecha límite,
**entonces** se aplica la nueva hora de cierre.

### CA-004 — Cerrar antes
**Dado** una convocatoria abierta,
**cuando** el owner la cierra y confirma,
**entonces** queda **cerrada** y sus enlaces dejan de aceptar respuestas.

### CA-005 — Cierre automático
**Dado** una convocatoria abierta,
**cuando** llega su fecha límite o, sin ella, el inicio de la actividad,
**entonces** se considera cerrada sin que el owner haga nada.

### CA-006 — Aislamiento
**Dado** que existen otras academias,
**cuando** el owner gestiona convocatorias,
**entonces** solo ve y modifica las de su academia.

## Reglas de negocio

- Cerrada no se reabre en el MVP.
- El enlace de una lista no cambia al ajustar sus convocados.
- Responder desde el enlace es la spec 4 (DEC-31, DEC-33).

## Decisiones relacionadas

ADR-018: DEC-31, DEC-34 y DEC-45.
