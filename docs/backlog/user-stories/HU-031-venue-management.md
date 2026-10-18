# HU-031 — Gestionar sede

**Épica:** EP-12 — Sedes · **Fase:** 1 — Fundación SaaS · **Prioridad:** MVP · **Estado:** Terminada (entorno local)
**Spec:** [`specs/004-venues-management/`](../../../specs/004-venues-management/spec.md) (**implementada**; validación en su `quickstart.md`)

## Historia de usuario

> Como **owner**, quiero editar, desactivar, eliminar y elegir la sede principal, para mantener las sedes de mi academia acordes con su realidad.

## Criterios de aceptación

### CA-001 — Editar sede

**Dado** que el owner modifica los datos de una sede,
**cuando** guarda los cambios,
**entonces** el sistema los actualiza y muestra una confirmación, aplicando las mismas validaciones que en el registro (nombre obligatorio y no duplicado).

### CA-002 — Desactivar sede

**Dado** que una sede está activa y no es la principal,
**cuando** el owner la desactiva,
**entonces** la sede queda inactiva, sigue visible en el listado y conserva su información.

### CA-003 — Reactivar sede

**Dado** que una sede está inactiva,
**cuando** el owner la reactiva,
**entonces** la sede vuelve a estar activa.

### CA-004 — Eliminar sede

**Dado** que una sede no es la principal,
**cuando** el owner la elimina y confirma la acción,
**entonces** la sede deja de aparecer en PlayerTech, pero su información se conserva internamente.

### CA-005 — Proteger la sede principal

**Dado** que una sede es la principal,
**cuando** el owner intenta desactivarla o eliminarla,
**entonces** el sistema no lo permite e indica que primero debe marcar otra sede como principal.

### CA-006 — Cambiar la sede principal

**Dado** que una sede está activa y no es la principal,
**cuando** el owner la marca como principal,
**entonces** esa sede pasa a ser la principal y la anterior deja de serlo.

### CA-007 — Solo sedes activas como principal

**Dado** que una sede está inactiva,
**cuando** el owner intenta marcarla como principal,
**entonces** el sistema no lo permite e indica que primero debe reactivarla.

## Reglas de negocio

- Cada academia tiene siempre exactamente una sede principal activa.
- Desactivar es reversible; eliminar es un borrado lógico que no se revierte desde la interfaz.
- Eliminar una sede requiere confirmación explícita.
- En la Fase 2, una sede inactiva no podrá elegirse para nuevas actividades.

## Fuera de alcance

- Restaurar sedes eliminadas desde la interfaz.
- Reasignar automáticamente actividades o jugadores al desactivar una sede (se definirá en la Fase 2).

## Decisiones relacionadas

DEC-05, DEC-25, DEC-26, DEC-27 (ADR-012).
