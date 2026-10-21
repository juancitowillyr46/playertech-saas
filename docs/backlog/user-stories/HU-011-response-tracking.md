# HU-011 — Seguimiento de respuestas

**Épica:** EP-07 — Seguimiento de respuestas · **Fase:** 2 — Negocio · **Prioridad:** MVP · **Estado:** Definida
**Spec:** 013 (respuesta y seguimiento)

## Historia de usuario

> Como **owner**, quiero ver quién respondió a la convocatoria, qué respondió y quién falta, para organizar la actividad sin perseguir a cada familia por WhatsApp.

## Criterios de aceptación

### CA-001 — Resumen
**Dado** una convocatoria,
**cuando** el owner abre la actividad,
**entonces** la sección «Convocatoria» muestra los totales de **Sí**, **Provisional**, **No** y **Sin respuesta** de toda la convocatoria, y en cada lista los confirmados sobre los convocados («12/17»).

### CA-002 — Estado de cada convocado
**Dado** la lista de convocados,
**cuando** el owner la consulta,
**entonces** cada jugador muestra su última respuesta, quién la dio (nombre y parentesco), la hora y el motivo si lo hay; los que no han respondido aparecen como **Sin respuesta**.

### CA-003 — Historial
**Dado** un jugador con varias respuestas,
**cuando** el owner lo toca,
**entonces** ve el historial corto: cada respuesta con quién y cuándo (por ejemplo, papá «Sí» a las 9:30 a. m. y mamá «No» a las 2:10 p. m.).

### CA-004 — Respuestas sin validar
**Dado** una respuesta de un vínculo o dispositivo pendiente,
**cuando** aparece en el seguimiento,
**entonces** se distingue como «sin validar», con las acciones de validar o rechazar (HU-040).

### CA-005 — Registrar en nombre del acudiente
**Dado** un jugador convocado,
**cuando** el owner registra o cambia su respuesta (por ejemplo, porque el papá escribió por WhatsApp o agotó sus cambios),
**entonces** queda como la última respuesta, «registrada por el owner», también después del cierre, y no consume los cambios del acudiente.

### CA-006 — Lista de actividades
**Dado** una actividad convocada,
**cuando** el owner ve la lista de actividades,
**entonces** la marca muestra los confirmados sobre los convocados («12/17»).

### CA-007 — Actualizar
**Dado** el seguimiento abierto,
**cuando** el owner vuelve a la pantalla o toca «Actualizar»,
**entonces** ve las respuestas nuevas. La actualización en vivo queda para más adelante (DEC-46).

## Reglas de negocio

- Los confirmados cuentan solo **Sí**; los provisionales se muestran aparte.
- Un jugador quitado de la convocatoria sale del conteo; su respuesta queda en el historial.
- Una respuesta de un vínculo rechazado deja de contar (DEC-40).

## Fuera de alcance

Registro de asistencia, estadísticas y reportes.

## Decisiones relacionadas

ADR-018: DEC-33, DEC-38, DEC-40 y DEC-46.
