# EP-07 — Consulta y seguimiento de respuestas

## Objetivo

Permitir al administrador consultar las respuestas recibidas para una convocatoria.

## Alcance

- Consultar jugadores convocados.
- Identificar respuestas afirmativas, distinguiendo las confirmadas de las provisionales (DEC-38).
- Identificar respuestas negativas.
- Consultar los motivos (de la lista o el texto de *Otro*) de los No y de los provisionales.
- Identificar convocados sin respuesta.

## Fuera del alcance

- Registro de asistencia.
- Estadísticas deportivas.
- Reportes avanzados.

## Historias de usuario

| ID | Historia | Estado |
|---|---|---|
| HU-011 | Seguimiento de respuestas | Terminada (entorno local) |
| HU-041 | Avisos en la aplicación (spec 014) | Terminada (entorno local) |

## Decisiones de la ideación (2026-10-18)

ADR-018. Se construye en la **spec 4 (respuesta y seguimiento)** de la Fase 2. Muestra quién respondió, la última respuesta con su hora y el historial corto; marca las respuestas de acudientes sin validar, con la acción de validar o rechazar el vínculo (DEC-31, DEC-33, DEC-40). Avisos en la aplicación: contador, aviso en el inicio y actualización en vivo (DEC-41).
