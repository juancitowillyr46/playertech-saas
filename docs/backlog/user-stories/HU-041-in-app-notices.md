# HU-041 — Avisos en la aplicación

**Épica:** EP-07 — Seguimiento de respuestas · **Fase:** 2 — Negocio · **Prioridad:** MVP · **Estado:** Definida
**Spec:** 014 (avisos en la aplicación)

## Historia de usuario

> Como **owner**, quiero ver al entrar a PlayerTech si hay respuestas nuevas o acudientes por validar, para no tener que revisar cada actividad.

## Criterios de aceptación

### CA-001 — Contador en la navegación
**Dado** acudientes o dispositivos pendientes de validar,
**cuando** el owner navega por la aplicación,
**entonces** «Actividades» muestra un contador con el número de pendientes.

### CA-002 — Aviso en el inicio
**Dado** pendientes por validar o respuestas nuevas desde su última visita,
**cuando** el owner abre el inicio,
**entonces** ve un aviso («3 acudientes por validar», «5 respuestas nuevas») que lleva a la convocatoria correspondiente.

### CA-003 — Validar desde el aviso
**Dado** el aviso de pendientes,
**cuando** el owner lo toca,
**entonces** puede validar o rechazar sin buscar la actividad (HU-040).

## Reglas de negocio

- Avisos solo dentro de la aplicación. Las notificaciones push web quedan para T-03 y el correo, para cuando exista el SMTP propio (DEC-41).
- Se actualizan al navegar; la actualización en vivo queda para más adelante (DEC-46).

## Decisiones relacionadas

ADR-018: DEC-41 y DEC-46.
