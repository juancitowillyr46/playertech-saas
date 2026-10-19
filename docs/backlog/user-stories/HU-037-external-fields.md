# HU-037 — Canchas externas

**Épica:** EP-14 — Canchas externas · **Fase:** 2 — Negocio · **Prioridad:** MVP · **Estado:** Definida
**Spec:** spec 2 de la Fase 2 (actividades y canchas)

## Historia de usuario

> Como **owner**, quiero guardar las canchas donde jugamos torneos, para elegirlas al crear actividades sin escribir el lugar cada vez.

## Criterios de aceptación

### CA-001 — Crear desde la actividad
**Dado** el formulario de una actividad,
**cuando** el owner elige «Nueva cancha», escribe nombre, dirección, ciudad e indicaciones (solo el nombre es obligatorio) y guarda,
**entonces** la cancha queda en el catálogo y elegida como lugar de la actividad.

### CA-002 — Nombre único
**Dado** una cancha no eliminada con ese nombre en la academia (sin distinguir mayúsculas ni espacios sobrantes),
**cuando** el owner intenta guardar otra igual,
**entonces** se indica junto al campo y no se guarda.

### CA-003 — Consultar y editar
**Dado** el catálogo de canchas,
**cuando** el owner lo abre,
**entonces** ve las canchas con su ciudad y puede crear, editar y retirar.

### CA-004 — Retirar
**Dado** una cancha,
**cuando** el owner la retira y confirma,
**entonces** deja de ofrecerse como lugar (borrado lógico); las actividades que ya la usan conservan su lugar.

### CA-005 — Aislamiento
**Dado** que existen otras academias,
**cuando** el owner gestiona canchas,
**entonces** solo ve y modifica las de su academia.

## Reglas de negocio

- Las canchas no son sedes: no tienen principal ni cuentan en «Completa tu academia» (EP-14).
- La ubicación del catálogo en la navegación se decide con las maquetas de la spec 2.

## Decisiones relacionadas

ADR-018: DEC-32.
