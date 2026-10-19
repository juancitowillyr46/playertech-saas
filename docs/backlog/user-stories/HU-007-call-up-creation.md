# HU-007 — Crear convocatoria

**Épica:** EP-05 — Gestión de convocatorias · **Fase:** 2 — Negocio · **Prioridad:** MVP · **Estado:** Definida
**Spec:** spec 3 de la Fase 2 (convocatoria y mensaje)

## Historia de usuario

> Como **owner**, quiero convocar a los jugadores de una actividad eligiendo sus grupos y ajustando la lista, para pedirles que confirmen su asistencia.

## Criterios de aceptación

### CA-001 — Convocar por grupos
**Dado** una actividad próxima y no cancelada sin convocatoria,
**cuando** el owner toca «Convocar», elige uno o varios grupos y confirma,
**entonces** quedan convocados los jugadores activos de esos grupos, cada uno en la lista de su grupo, y la convocatoria queda abierta.

### CA-002 — Quitar jugadores
**Dado** la lista de convocados,
**cuando** el owner quita a un jugador,
**entonces** deja de estar convocado.

### CA-003 — Sumar jugadores de otros grupos
**Dado** una convocatoria con grupos,
**cuando** el owner suma a un jugador activo de otro grupo (o sin grupo) y elige en qué lista queda,
**entonces** queda convocado en esa lista y su enlace lo incluye.

### CA-004 — Solo jugadores sueltos
**Dado** que el owner no elige grupos,
**cuando** suma jugadores uno a uno y confirma,
**entonces** la convocatoria queda con una sola lista y su enlace.

### CA-005 — Fecha límite opcional
**Dado** el formulario,
**cuando** el owner indica una fecha y hora límite (futura y anterior al inicio de la actividad) o la deja vacía,
**entonces** la convocatoria se cerrará a esa hora o, sin ella, al empezar la actividad (DEC-34).

### CA-006 — Sin convocados
**Dado** que no queda ningún jugador en la lista,
**cuando** el owner intenta convocar,
**entonces** se indica y no se crea la convocatoria.

### CA-007 — Actividad no convocable
**Dado** una actividad pasada o cancelada, o que ya tiene convocatoria,
**cuando** el owner la abre,
**entonces** no se ofrece crear otra convocatoria.

## Reglas de negocio

- Modelo de DEC-45: una convocatoria por actividad, directa (sin borrador), un enlace por lista (DEC-31).
- Un jugador aparece una sola vez en la convocatoria.
- Solo jugadores activos y no eliminados.

## Decisiones relacionadas

ADR-018: DEC-31, DEC-34, DEC-35 y DEC-45.
