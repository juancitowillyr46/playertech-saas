# HU-040 — Validar o rechazar acudientes y dispositivos

**Épica:** EP-10 — Acudientes · **Fase:** 2 — Negocio · **Prioridad:** MVP · **Estado:** Definida
**Spec:** 013 (respuesta y seguimiento)

## Historia de usuario

> Como **owner**, quiero confirmar con un toque que quien respondió desde el enlace es de verdad acudiente del jugador, para confiar en las respuestas sin pedir códigos a las familias.

## Criterios de aceptación

### CA-001 — Validar
**Dado** un vínculo o un dispositivo pendiente,
**cuando** el owner toca «Validar»,
**entonces** el vínculo queda validado y el dispositivo de confianza; sus respuestas dejan de mostrarse como sin validar (DEC-40).

### CA-002 — Coincidencia de celular
**Dado** un pendiente cuyo celular coincide con un acudiente registrado,
**cuando** el owner lo ve,
**entonces** se indica la coincidencia («Coincide con Claudia Restrepo, mamá de Santiago D.») para decidir con un toque.

### CA-003 — Rechazar
**Dado** un vínculo o un dispositivo pendiente,
**cuando** el owner toca «Rechazar» y confirma,
**entonces** el vínculo se descarta, su respuesta deja de contar y el dispositivo deja de reconocerse; la persona no recibe ningún aviso (DEC-46).

### CA-004 — Dónde se valida
**Dado** pendientes por validar,
**cuando** el owner consulta el seguimiento de la convocatoria o la ficha del jugador,
**entonces** puede validar o rechazar desde allí. El aviso en el inicio llega con HU-041.

## Reglas de negocio

- Un vínculo validado por el owner equivale al que él mismo registra desde la ficha (DEC-43).
- La autorización de datos del acudiente se registró al identificarse (DEC-39); validar no la vuelve a pedir.

## Decisiones relacionadas

ADR-018: DEC-31, DEC-40 y DEC-46. Riesgo: SEC-03.
