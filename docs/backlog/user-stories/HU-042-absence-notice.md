# HU-042 — Marcar a quien no llegó y avisar al acudiente

**Épica:** EP-15 — Aviso de inasistencia · **Fase:** 2 — Negocio · **Prioridad:** MVP · **Estado:** Definida
**Spec:** 015 (aviso de inasistencia)

## Historia de usuario

> Como **owner**, quiero marcar en la cancha a los jugadores que no llegaron y escribirle a su acudiente en ese momento, para saber que están bien y por qué faltaron, sin tener que tomar lista a todos.

## Criterios de aceptación

### CA-001 — Cuándo se puede marcar
**Dado** una actividad programada (no cancelada),
**cuando** ya empezó y aún es el mismo día en Colombia,
**entonces** la actividad ofrece «¿Quién no llegó?»; antes del inicio no aparece, y desde el día siguiente las marcas se ven en modo lectura.

### CA-002 — La lista
**Dado** «¿Quién no llegó?» abierto,
**cuando** la actividad tiene convocatoria,
**entonces** la lista son sus convocados; en una competencia, primero los que respondieron «Sí», luego los provisionales y sin respuesta, y aparte los que avisaron «No». **Cuando** no tiene convocatoria, el owner elige uno o varios grupos y la lista son sus jugadores activos.

### CA-003 — Marcar por excepción
**Dado** la lista,
**cuando** el owner toca a un jugador,
**entonces** queda marcado como «No llegó»; volver a tocarlo lo desmarca. Los no marcados no se registran: se asume que llegaron.

### CA-004 — Avisar al acudiente
**Dado** un jugador marcado,
**cuando** el owner toca «Avisar»,
**entonces** ve un mensaje editable ya escrito («Hola, Mateo no llegó hoy al entrenamiento de las 4:00 p. m. en la Sede principal. ¿Está todo bien?»), elige el acudiente si hay varios (o el jugador, si no tiene acudientes y tiene celular), y se abre ese chat de WhatsApp; el jugador queda «Avisado» con la hora. Sin celular, solo «Copiar».

### CA-005 — Resumen
**Dado** una actividad con marcas,
**cuando** el owner la abre,
**entonces** ve «N no llegaron · M avisados» y la lista de quiénes.

## Reglas de negocio

- Solo se registran ausencias; no hay lista de presentes (DEC-48). Una ausencia no cambia la respuesta de la convocatoria.
- El mensaje se edita antes de enviarlo y no se guarda: cada aviso parte del texto sugerido.
- PlayerTech no envía ni sabe si el mensaje se entregó; «Avisado» significa que el owner abrió el chat.
- El aviso solo es una garantía si la academia lo comunica a las familias («si un niño no llega, te escribimos»); es una regla de la academia, no del sistema.
- Solo el owner marca (MVP); el entrenador, con EP-11.

## Decisiones relacionadas

ADR-018: DEC-31, DEC-45 y DEC-48.
