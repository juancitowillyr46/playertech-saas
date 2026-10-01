# HU-011 — Response Tracking

**Épica:** EP-07 — Consulta y seguimiento de respuestas

## Historia de usuario

> Como **administrador**, quiero consultar las respuestas de una convocatoria, para conocer la participación confirmada y la no participación de los jugadores convocados.

## Objetivo

Permitir al administrador consultar el estado de respuesta de los jugadores incluidos en una convocatoria.

## Criterios de aceptación

### CA-001 — Consultar respuestas

**Dado** que existe una convocatoria,  
**cuando** el administrador consulta sus respuestas,  
**entonces** el sistema debe mostrar los jugadores convocados y el estado de respuesta de cada uno.

### CA-002 — Participación confirmada

**Dado** que un tutor respondió "Sí",  
**cuando** el administrador consulta las respuestas,  
**entonces** el jugador debe mostrarse como **participación confirmada**.

### CA-003 — No participación

**Dado** que un tutor respondió "No",  
**cuando** el administrador consulta las respuestas,  
**entonces** el jugador debe mostrarse como **no participa** y debe poder consultar el motivo registrado.

### CA-004 — Sin respuesta

**Dado** que un jugador fue convocado y su tutor todavía no ha respondido,  
**cuando** el administrador consulta las respuestas,  
**entonces** el jugador debe mostrarse como **sin respuesta**.

### CA-005 — Información de la convocatoria

**Dado** que el administrador consulta las respuestas,  
**cuando** visualiza la información,  
**entonces** debe poder identificar la actividad y los jugadores asociados a la convocatoria.

## Reglas de negocio

- Una convocatoria puede tener jugadores con respuesta y jugadores sin respuesta.
- Una respuesta "Sí" representa confirmación de participación.
- Una respuesta "No" requiere un motivo.
- La confirmación de participación no representa asistencia.
- La asistencia pertenece a un proceso diferente y está fuera del MVP v1.

## Fuera de alcance

- Registro de asistencia.
- Estadísticas de participación.
- Reportes avanzados.
- Notificaciones automáticas al administrador.