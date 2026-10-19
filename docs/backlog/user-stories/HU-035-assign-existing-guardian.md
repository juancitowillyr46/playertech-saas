# HU-035 — Asignar un acudiente ya registrado

**Épica:** EP-10 — Gestión de acudientes · **Fase:** 2 — Negocio · **Prioridad:** MVP · **Estado:** Definida
**Spec:** spec 010 (ajustes de acudientes)

## Historia de usuario

> Como **owner**, quiero asignar a un jugador un acudiente que ya está registrado (por ejemplo, los papás de dos hermanos), para no escribir de nuevo sus datos.

## Criterios de aceptación

### CA-001 — Elegir un acudiente registrado
**Dado** la ficha de un jugador y una academia con acudientes registrados,
**cuando** el owner toca «Agregar acudiente», busca por nombre o celular (sin distinguir mayúsculas ni tildes), elige uno e indica el parentesco,
**entonces** el acudiente queda **asignado y validado** con ese jugador, sin escribir de nuevo su nombre ni su celular.

### CA-002 — A quién acompaña
**Dado** la lista de acudientes registrados,
**cuando** el owner la revisa,
**entonces** cada uno muestra su nombre, su celular y los jugadores que acompaña con su parentesco (por ejemplo, «Papá de Samuel V.»).

### CA-003 — Sin repetir la autorización
**Dado** un acudiente que ya autorizó el tratamiento de sus datos,
**cuando** el owner lo asigna a otro jugador,
**entonces** no se pide de nuevo la autorización (DEC-39).

### CA-004 — Ya asignado
**Dado** un acudiente que ya es acudiente de este jugador,
**cuando** aparece en la lista,
**entonces** se indica «Ya es acudiente de [jugador]» y no se puede asignar dos veces.

### CA-005 — Copiar acudientes de un hermano
**Dado** la ficha de un jugador,
**cuando** el owner toca «Copiar acudientes de un hermano», busca y elige a otro jugador, deja marcados los acudientes que quiere (todos por defecto) y confirma,
**entonces** quedan asignados al jugador con el mismo parentesco que tenían con el hermano, que puede cambiarse antes de confirmar. Los que ya eran sus acudientes no se repiten.

### CA-006 — Registrar uno nuevo
**Dado** la lista de acudientes registrados,
**cuando** el owner toca «Registrar un acudiente nuevo», o la academia aún no tiene acudientes,
**entonces** se muestra el formulario de HU-034, con la autorización obligatoria.

### CA-007 — Aislamiento
**Dado** que existen otras academias,
**cuando** el owner busca o copia acudientes,
**entonces** solo ve los de su academia.

## Reglas de negocio

- El parentesco es de cada vínculo: una persona puede ser «Mamá» de un jugador y «Otro» de otro.
- La autorización de datos es de la persona (DEC-39, ajuste de la spec 010). Los acudientes ya registrados conservan la autorización que dieron en su primer vínculo.
- Solo se listan acudientes no eliminados; en «Copiar», solo jugadores con acudientes.
- Asignar no cambia los datos del acudiente; para corregirlos se usa «Editar» (CA-005 de HU-034).

## Decisiones relacionadas

ADR-018: DEC-39 (ajustada), DEC-40 y DEC-43.
