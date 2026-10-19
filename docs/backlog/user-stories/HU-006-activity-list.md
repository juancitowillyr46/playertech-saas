# HU-006 — Consultar actividades

**Épica:** EP-04 — Gestión de actividades · **Fase:** 2 — Negocio · **Prioridad:** MVP · **Estado:** Terminada (entorno local)
**Spec:** [`specs/011-activities-fields/`](../../../specs/011-activities-fields/spec.md) (**implementada**; validación en su `quickstart.md`)

## Historia de usuario

> Como **owner**, quiero ver las actividades programadas de mi academia, para saber qué viene y gestionarlas.

## Criterios de aceptación

### CA-001 — Próximas actividades
**Dado** actividades programadas,
**cuando** el owner abre Actividades,
**entonces** ve por defecto las **próximas** (de hoy en adelante), ordenadas por fecha y hora, agrupadas por día.

### CA-002 — Identificar cada actividad
**Dado** el listado,
**cuando** el owner lo revisa,
**entonces** cada actividad muestra su tipo (Entrenamiento o Competencia), fecha, hora de inicio, lugar y, en competencia, el rival si existe; las canceladas se distinguen con el sello «Cancelada».

### CA-003 — Filtros
**Dado** el listado,
**cuando** el owner filtra por tipo o elige ver las **pasadas**,
**entonces** ve solo las que cumplen; las pasadas se ordenan de la más reciente a la más antigua.

### CA-004 — Detalle
**Dado** una actividad del listado,
**cuando** el owner la toca,
**entonces** ve todos sus datos (incluidas citación, observaciones y las indicaciones del lugar) y sus acciones (HU-036).

### CA-005 — Estado vacío
**Dado** que no hay actividades próximas,
**cuando** el owner abre el listado,
**entonces** ve un mensaje que lo indica y la acción para crear una.

### CA-006 — Aislamiento
**Dado** que existen otras academias,
**cuando** el owner consulta,
**entonces** solo ve las actividades de su academia.

## Decisiones relacionadas

ADR-018: DEC-44.
