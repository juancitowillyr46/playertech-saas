# HU-038 — Avisar cambios de una actividad convocada

**Épica:** EP-08 — Comunicación de convocatorias · **Fase:** 2 — Negocio · **Prioridad:** MVP · **Estado:** Definida
**Spec:** spec 3 de la Fase 2 (convocatoria y mensaje)

## Historia de usuario

> Como **owner**, quiero avisar a los convocados cuando una actividad se cancela o cambia, para que nadie llegue a la hora o al lugar equivocados.

## Criterios de aceptación

### CA-001 — Aviso de cancelación
**Dado** una actividad con convocatoria abierta,
**cuando** el owner la cancela,
**entonces** se ofrece un mensaje «Se cancela…» con los datos de la actividad, para compartir en cada grupo o enviar a los acudientes (HU-013).

### CA-002 — Aviso de cambio
**Dado** una actividad con convocatoria abierta,
**cuando** el owner cambia la fecha, la hora o el lugar y guarda,
**entonces** se ofrece un mensaje «Cambio en…» que indica lo nuevo, con el enlace de cada lista.

### CA-003 — Opcional
**Dado** el aviso ofrecido,
**cuando** el owner lo descarta,
**entonces** no pasa nada más; puede volver a generarlo desde la convocatoria.

### CA-004 — Cancelar cierra la convocatoria
**Dado** una actividad con convocatoria abierta,
**cuando** el owner la cancela,
**entonces** la convocatoria se cierra; si la reactiva, la convocatoria no se reabre.

## Reglas de negocio

- Los avisos usan los mismos botones de HU-013 y se editan antes de compartir (HU-012, CA-003).
- Cambios de observaciones, rival o torneo no generan aviso automático; el owner puede compartir el mensaje actualizado.

## Decisiones relacionadas

ADR-018: DEC-44 y DEC-45.
