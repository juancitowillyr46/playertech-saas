# HU-010 — Responder la convocatoria

**Épica:** EP-06 — Respuesta del acudiente · **Fase:** 2 — Negocio · **Prioridad:** MVP · **Estado:** Definida
**Spec:** 013 (respuesta y seguimiento)

## Historia de usuario

> Como **acudiente**, quiero indicar si mi jugador asiste, asiste de forma provisional o no asiste, y poder corregirlo, para que la academia sepa con quién cuenta.

## Criterios de aceptación

### CA-001 — Tres respuestas
**Dado** un jugador por el que la persona responde, con la convocatoria abierta,
**cuando** elige **Sí**, **Sí, provisional** o **No** y envía,
**entonces** la respuesta queda registrada con quién la dio y cuándo, y se confirma con «¡Listo!».

### CA-002 — Motivo opcional
**Dado** **No** o **Sí, provisional**,
**cuando** la persona responde,
**entonces** puede elegir un motivo de la lista fija (DEC-38); si elige *Otro*, un texto de hasta 200 caracteres es obligatorio. En **Sí** no hay motivo.

### CA-003 — Cambiar la respuesta
**Dado** una respuesta registrada y la convocatoria abierta,
**cuando** la persona la cambia,
**entonces** vale la última, y se le indica cuántos cambios le quedan («Te quedan 2 cambios»); tras 3 cambios por jugador, la respuesta queda fija y se indica «Escríbele a la academia para cambiarla» (DEC-33).

### CA-004 — Varios acudientes
**Dado** un jugador con dos acudientes (papá y mamá),
**cuando** ambos responden,
**entonces** vale la última respuesta, cada cambio cuenta para el límite del jugador y la academia ve quién respondió cada vez (HU-011).

### CA-005 — Vínculo sin validar
**Dado** una respuesta dada desde un vínculo o dispositivo pendiente,
**cuando** se registra,
**entonces** cuenta igual, marcada como sin validar hasta que el owner decida (HU-040).

### CA-006 — Cierre
**Dado** la fecha límite o el inicio de la actividad,
**cuando** llega,
**entonces** ya no se admiten respuestas; una respuesta provisional queda como provisional (DEC-38).

## Reglas de negocio

- Una respuesta afirmativa es confirmación de participación, no asistencia (la asistencia está fuera del MVP).
- El owner puede registrar o cambiar la respuesta en nombre del acudiente (HU-011); eso no consume los cambios del acudiente.

## Decisiones relacionadas

ADR-018: DEC-33, DEC-38, DEC-40 y DEC-46.
