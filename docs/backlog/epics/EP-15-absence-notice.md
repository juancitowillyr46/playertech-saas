# EP-15 — Aviso de inasistencia

## Objetivo

Que el owner, al ver en la cancha que un jugador no llegó, lo marque y le escriba de inmediato a su acudiente, para cuidar a los niños y saber por qué faltaron, sin tomar lista completa.

## Alcance

- Marcar **solo a quien no llegó** (por excepción): a los demás se les asume presentes.
- Desde una actividad que ya empezó, hasta el final de ese día (hora de Colombia).
- La lista sale de los convocados, si hay convocatoria, o de un grupo elegido en el momento, si no la hay (entrenamientos de rutina).
- Avisar al acudiente (o al propio jugador) por WhatsApp con un mensaje editable, y dejar registrado que se le escribió.
- Un resumen en la actividad: cuántos no llegaron y a cuántos se avisó.

## Fuera de alcance

- Lista completa de presentes, historial por jugador, porcentajes y reportes: la asistencia formal sigue en la **Etapa 2** (`docs/product/roadmap.md`).
- Que el entrenador marque: llega con «Equipo y roles» (EP-11, MVP+).
- Envío automático: el owner envía el mensaje desde WhatsApp (DEC-31, DEC-45).

## Historias de usuario

| ID | Historia | Estado |
|---|---|---|
| [HU-042](../user-stories/HU-042-absence-notice.md) | Marcar a quien no llegó y avisar al acudiente | Terminada (entorno local; spec 015) |

## Decisiones

ADR-018: DEC-48 (aprobada el 2026-10-23). Se construye en la **spec 015**.
