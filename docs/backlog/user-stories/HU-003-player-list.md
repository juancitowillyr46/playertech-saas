# HU-003 — Consultar jugadores

**Épica:** EP-02 — Gestión de jugadores · **Fase:** 2 — Negocio · **Prioridad:** MVP · **Estado:** Definida
**Spec:** spec 1 de la Fase 2 (jugadores, acudientes y grupos)

## Historia de usuario

> Como **owner**, quiero ver y encontrar rápido a los jugadores de mi academia desde el celular, para gestionarlos y convocarlos.

## Criterios de aceptación

### CA-001 — Listado
**Dado** que la academia tiene jugadores,
**cuando** el owner abre Jugadores,
**entonces** ve cada jugador con su nombre, apodo (si tiene), edad, grupos y estado, ordenados alfabéticamente por apellido.

### CA-002 — Búsqueda
**Dado** el listado,
**cuando** el owner escribe en el buscador,
**entonces** ve solo los jugadores cuyo nombre, apellido o apodo coinciden, sin distinguir mayúsculas ni tildes.

### CA-003 — Filtros
**Dado** el listado,
**cuando** el owner filtra por **grupo** o por **estado** (activos, inactivos o todos),
**entonces** ve solo los jugadores que cumplen el filtro. Por defecto se muestran los activos.

### CA-004 — Acudientes en el listado
**Dado** un jugador con acudientes,
**cuando** el owner lo ve en el listado,
**entonces** ve cuántos acudientes tiene, o «Sin acudientes» si no tiene ninguno.

### CA-005 — Estado vacío
**Dado** que la academia no tiene jugadores,
**cuando** el owner abre Jugadores,
**entonces** ve un mensaje que lo invita a registrar el primero, con la acción para hacerlo.

### CA-006 — Aislamiento
**Dado** que existen otras academias,
**cuando** el owner consulta jugadores,
**entonces** solo ve los de su academia.

## Reglas de negocio

- Los jugadores eliminados no se muestran.
- La edad se calcula con la fecha de nacimiento y la fecha actual de Colombia.
- En el celular, el listado usa filas regladas; en escritorio, tabla (patrón de página de gestión de `ui.md`).

## Fuera de alcance

- Exportar el listado.
- Estadísticas o historial del jugador.

## Decisiones relacionadas

ADR-018: DEC-35 y DEC-36 · ADR-012.
