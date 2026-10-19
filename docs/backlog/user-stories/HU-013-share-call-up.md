# HU-013 — Compartir convocatoria por WhatsApp

**Épica:** EP-08 — Comunicación de convocatorias · **Fase:** 2 — Negocio · **Prioridad:** MVP · **Estado:** Definida
**Spec:** spec 3 de la Fase 2 (convocatoria y mensaje)

## Historia de usuario

> Como **owner**, quiero compartir el mensaje en el grupo de WhatsApp o enviárselo al acudiente de un convocado, para que respondan desde el enlace.

## Criterios de aceptación

### CA-001 — Compartir en el grupo
**Dado** el mensaje de una lista,
**cuando** el owner toca «Compartir en el grupo»,
**entonces** se abre WhatsApp con el texto listo para elegir el chat (en el celular, el menú de compartir; en el computador, WhatsApp Web).

### CA-002 — Enviar al acudiente
**Dado** un convocado con acudientes,
**cuando** el owner toca «Enviar al acudiente» y, si hay varios, elige a cuál,
**entonces** se abre el chat de WhatsApp de ese celular con el mensaje personal listo para enviar.

### CA-003 — Jugador sin acudientes
**Dado** un convocado sin acudientes pero con celular propio,
**cuando** el owner toca «Enviar al jugador»,
**entonces** se abre su chat con el mensaje personal; sin celular, solo se ofrece «Copiar».

### CA-004 — Copiar
**Dado** cualquier mensaje,
**cuando** el owner toca «Copiar»,
**entonces** el texto completo queda en el portapapeles y se confirma con un aviso breve.

### CA-005 — Sin envío automático
**Dado** cualquier opción de compartir,
**cuando** se usa,
**entonces** el owner envía el mensaje desde WhatsApp; PlayerTech no envía ni conoce si se entregó o se leyó.

## Reglas de negocio

- Los enlaces de chat usan el celular en formato internacional de Colombia (+57) y el texto codificado; no requieren la API de WhatsApp.
- Compartir no cambia el estado de la convocatoria.

## Decisiones relacionadas

ADR-018: DEC-31 y DEC-45.
