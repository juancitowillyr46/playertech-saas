# HU-005 — Crear actividad

**Épica:** EP-04 — Gestión de actividades · **Fase:** 2 — Negocio · **Prioridad:** MVP · **Estado:** Definida
**Spec:** spec 2 de la Fase 2 (actividades y canchas)

## Historia de usuario

> Como **owner**, quiero programar los entrenamientos y competencias de mi academia, para luego convocar a los jugadores.

## Criterios de aceptación

### CA-001 — Crear entrenamiento
**Dado** el tipo «Entrenamiento», una fecha, una hora de inicio y un lugar,
**cuando** el owner guarda,
**entonces** la actividad queda programada y aparece en el listado.

### CA-002 — Crear competencia
**Dado** el tipo «Competencia» con los mismos datos y, opcionalmente, rival y torneo,
**cuando** el owner guarda,
**entonces** la actividad queda programada con esos datos.

### CA-003 — Datos obligatorios y horas coherentes
**Dado** que falta el tipo, la fecha, la hora de inicio o el lugar, la fecha ya pasó, la hora de fin no es posterior a la de inicio o la de citación es posterior a la de inicio,
**cuando** el owner intenta guardar,
**entonces** el campo lo indica y no se guarda nada.

### CA-004 — Datos opcionales
**Dado** hora de fin, hora de citación y observaciones (uniforme, qué llevar),
**cuando** el owner guarda,
**entonces** quedan registrados y se muestran en la actividad.

### CA-005 — Lugar: sede o cancha
**Dado** el formulario,
**cuando** el owner elige el lugar,
**entonces** puede elegir una sede activa de la academia o una cancha externa del catálogo, o crear una cancha nueva sin salir del formulario (HU-037).

### CA-006 — Repetir semanalmente
**Dado** una actividad con fecha de inicio,
**cuando** el owner activa «Repetir», elige los días de la semana y una fecha final, y guarda,
**entonces** se crean actividades independientes en cada día elegido entre ambas fechas, con los mismos datos, y se indica cuántas se crearon.

### CA-007 — Confirmación
**Dado** que la actividad se creó,
**cuando** termina,
**entonces** se muestra una confirmación y la actividad en el listado.

## Reglas de negocio

- Datos y reglas de DEC-44: tipo, fecha, hora de inicio, lugar (obligatorios); hora de fin, hora de citación, observaciones; rival y torneo solo en competencia.
- La actividad no lleva jugadores ni grupos: se eligen al convocar (spec 3).
- Fecha y horas en la zona de Colombia (America/Bogota). No se crean actividades en fechas pasadas.
- Repetición: hasta 6 meses desde la fecha de inicio; cada actividad generada se edita, cancela o elimina por separado.

## Fuera de alcance

- Asistencia, resultados y estadísticas.
- Convocatoria (spec 3).
- Repeticiones distintas de la semanal o editar toda la serie de una vez.

## Decisiones relacionadas

ADR-018: DEC-32, DEC-35 y DEC-44.
