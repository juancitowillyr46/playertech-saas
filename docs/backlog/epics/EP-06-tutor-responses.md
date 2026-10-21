# EP-06 — Respuesta del acudiente

## Objetivo

Permitir que el acudiente consulte una convocatoria y registre la respuesta respecto a la participación del jugador.

## Alcance

El acudiente puede:

- Acceder mediante el enlace recibido.
- Consultar la información de la convocatoria.
- Confirmar la participación (**Sí**) o confirmarla de forma provisional (**Sí, provisional**, DEC-38).
- Indicar que no participará.
- Elegir un motivo opcional de una lista fija para el No o el provisional; *Otro* pide un texto de hasta 200 caracteres (DEC-38).

## Reglas principales

- El acudiente no necesita crear una cuenta.
- El enlace de convocatoria es temporal.
- La respuesta puede cambiarse hasta 3 veces por jugador, antes del cierre (DEC-33; antes: «no puede modificarse»).
- Una respuesta afirmativa representa confirmación de participación, no asistencia.

## Historias de usuario

| ID | Historia | Estado |
|---|---|---|
| HU-009 | Abrir la convocatoria e identificarse | Definida |
| HU-010 | Responder la convocatoria | Definida |

## Decisiones de la ideación (2026-10-18)

ADR-018. Se construye en la **spec 4 (respuesta y seguimiento)** de la Fase 2. Primera vez: elige a su jugador en la lista (nombre e inicial) y se identifica; el vínculo queda pendiente de validar. Siguientes veces: dispositivo recordado (DEC-31, SEC-03). Hasta 3 cambios por jugador antes del cierre (DEC-33).
