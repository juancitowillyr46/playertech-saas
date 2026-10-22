# HU-041 — Avisos en la aplicación

**Épica:** EP-07 — Seguimiento de respuestas · **Fase:** 2 — Negocio · **Prioridad:** MVP · **Estado:** Definida
**Spec:** 014 (avisos en la aplicación)

## Historia de usuario

> Como **owner**, quiero ver al entrar a PlayerTech si hay respuestas nuevas o acudientes por validar, para no tener que revisar cada actividad.

## Criterios de aceptación

### CA-001 — Contador en la navegación
**Dado** acudientes o dispositivos pendientes de validar,
**cuando** el owner navega por la aplicación,
**entonces** «Actividades» muestra un contador con el número de pendientes; sin pendientes, no muestra nada. Las respuestas nuevas no suman al contador (DEC-47).

### CA-002 — Aviso en el inicio
**Dado** pendientes por validar o respuestas nuevas,
**cuando** el owner abre el inicio,
**entonces** ve «3 acudientes por validar» y, por cada convocatoria con respuestas que aún no vio, «5 respuestas nuevas en el partido del sábado», que lleva a esa actividad.

### CA-003 — Respuestas vistas
**Dado** una convocatoria con respuestas nuevas,
**cuando** el owner abre su actividad,
**entonces** esas respuestas quedan vistas y el aviso de esa convocatoria desaparece del inicio (DEC-47).

### CA-004 — Validar desde el aviso
**Dado** el aviso de pendientes,
**cuando** el owner lo toca,
**entonces** se abre un drawer con todos los pendientes de la academia agrupados por jugador, y puede validar o rechazar cada uno sin buscar la actividad (HU-040).

## Reglas de negocio

- Avisos solo dentro de la aplicación. Las notificaciones push web quedan para T-03 y el correo, para cuando exista el SMTP propio (DEC-41).
- Se actualizan al navegar; la actualización en vivo queda para más adelante (DEC-46).

## Decisiones relacionadas

ADR-018: DEC-41, DEC-46 y DEC-47.
