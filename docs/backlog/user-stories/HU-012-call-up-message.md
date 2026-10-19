# HU-012 — Generar mensaje de convocatoria

**Épica:** EP-08 — Comunicación de convocatorias · **Fase:** 2 — Negocio · **Prioridad:** MVP · **Estado:** Definida
**Spec:** spec 3 de la Fase 2 (convocatoria y mensaje)

## Historia de usuario

> Como **owner**, quiero que PlayerTech me arme el mensaje de la convocatoria, para no escribirlo a mano en cada grupo de WhatsApp.

## Criterios de aceptación

### CA-001 — Mensaje del grupo
**Dado** una lista de la convocatoria,
**cuando** el owner abre su mensaje,
**entonces** ve un texto con el tipo de actividad, la fecha, la hora de citación y de inicio, el lugar con su dirección, el rival y el torneo (si es competencia), las observaciones, la fecha límite si existe, los convocados de esa lista (nombre, inicial del apellido y apodo, por ejemplo «Samuel V. · Samu») y el enlace de la lista.

### CA-002 — Mensaje personal
**Dado** un convocado,
**cuando** el owner abre su mensaje personal,
**entonces** ve un texto dirigido a su acudiente (o al jugador) con su nombre, los datos de la actividad y el enlace de su lista.

### CA-003 — Texto propio editable
**Dado** el mensaje de una lista,
**cuando** el owner escribe o cambia su **texto propio** (saludo y notas, antes de los datos) y comparte,
**entonces** el mensaje lleva ese texto seguido del **bloque generado**, y el texto queda guardado para esa lista.

### CA-004 — Bloque generado no editable
**Dado** el mensaje,
**cuando** el owner lo revisa,
**entonces** los datos de la actividad, la lista de convocados y el enlace no se pueden editar y siempre salen con los datos actuales, aunque la actividad o los convocados hayan cambiado.

## Reglas de negocio

- Español de Colombia, tuteo, sin emojis obligatorios; fechas y horas de Colombia.
- Se guarda solo el texto propio de cada lista (hasta 500 caracteres); el bloque generado nunca se guarda.
- El mensaje personal y los avisos (HU-038) llevan su propio texto inicial editable, que no se guarda.
- PlayerTech no envía mensajes (EP-08, fuera de alcance).

## Decisiones relacionadas

ADR-018: DEC-31 y DEC-45.
