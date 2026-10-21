# EP-10 — Gestión de acudientes

## Objetivo

Registrar a las personas que responden por cada jugador, para enviarles sus convocatorias y saber quién confirma.

## Alcance

- Registrar uno o más acudientes por jugador: nombre, celular (WhatsApp) y parentesco.
- Editar y retirar acudientes.
- Un jugador sin acudiente responde él mismo con su celular (DEC-30).
- Los acudientes pueden registrarse de dos formas: el owner los registra, o nacen **desde el enlace de una convocatoria** la primera vez que responden (vínculo pendiente). El owner **valida o rechaza** los vínculos pendientes con un toque. Todo dispositivo nuevo queda pendiente, aunque el celular coincida con un acudiente registrado (DEC-31).
- Un acudiente puede tener varios jugadores (hermanos), y un jugador varios acudientes (papá y mamá, cada uno con su vínculo).
- Modelo de acudiente, vínculo y dispositivo, con sus estados (DEC-40).
- Al registrarse desde el enlace, el acudiente autoriza el tratamiento de sus datos (DEC-39).

## Fuera de alcance

- Cuenta o acceso propio del acudiente a PlayerTech.
- Documento de identidad del acudiente.

## Historias de usuario

| ID | Historia | Estado |
|---|---|---|
| HU-034 | Acudientes del jugador (registro por el owner) | Terminada |
| HU-035 | Asignar un acudiente ya registrado (DEC-43) | Terminada |
| HU-040 | Validar o rechazar acudientes y dispositivos (spec 013) | Terminada (entorno local) |

Los acudientes que nacen desde el enlace y la validación de vínculos se definen antes de la spec 4.

## Decisiones de la ideación (2026-10-18)

ADR-018 (DEC-30, DEC-31). Se construye en la **spec 1** de la Fase 2 (jugadores, acudientes y grupos).
