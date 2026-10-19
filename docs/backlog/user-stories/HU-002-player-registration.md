# HU-002 — Registrar jugador

**Épica:** EP-02 — Gestión de jugadores · **Fase:** 2 — Negocio · **Prioridad:** MVP · **Estado:** Terminada (entorno local)
**Spec:** [`specs/009-players-guardians-groups/`](../../../specs/009-players-guardians-groups/spec.md) (**implementada**; validación en su `quickstart.md`)

## Historia de usuario

> Como **owner**, quiero registrar a los jugadores de mi academia, para tenerlos en un solo lugar y poder convocarlos.

## Criterios de aceptación

### CA-001 — Registro exitoso
**Dado** que el owner escribe los nombres, los apellidos y la fecha de nacimiento del jugador,
**cuando** guarda,
**entonces** el jugador queda registrado como **activo** en su academia, aparece en el listado y se muestra un aviso de confirmación.

### CA-002 — Datos obligatorios
**Dado** que faltan los nombres, los apellidos o la fecha de nacimiento,
**cuando** el owner intenta guardar,
**entonces** cada campo pendiente lo indica y no se registra nada.

### CA-003 — Fecha de nacimiento válida
**Dado** que la fecha de nacimiento es futura o anterior a 100 años,
**cuando** el owner intenta guardar,
**entonces** el campo indica que la fecha no es válida y no se registra nada.

### CA-004 — Datos opcionales
**Dado** el formulario de registro,
**cuando** el owner completa o deja vacíos el **apodo** y el **celular** del jugador,
**entonces** el registro se completa igual; el apodo se muestra como «Samuel V. · Samu» en la convocatoria y en el seguimiento.

### CA-005 — Grupos al registrar
**Dado** que la academia tiene grupos,
**cuando** el owner elige uno o varios grupos al registrar al jugador,
**entonces** el jugador queda como integrante de esos grupos.

### CA-006 — Jugador ya registrado
**Dado** que ya existe en la academia un jugador no eliminado con los **mismos nombres, apellidos y fecha de nacimiento** (sin distinguir mayúsculas, tildes ni espacios sobrantes),
**cuando** el owner intenta guardar,
**entonces** no se crea otro jugador; se muestra «Este jugador ya está registrado» con sus datos actuales y la opción de **actualizar sus datos** con los que acaba de escribir (apodo, celular y grupos). Si el jugador existente está inactivo, la opción es **reactivarlo y actualizar sus datos**.

### CA-007 — Celular válido
**Dado** que el owner escribe un celular,
**cuando** no tiene el formato de un celular colombiano (10 dígitos que empiezan por 3),
**entonces** el campo lo indica y no se registra nada.

## Reglas de negocio

- El jugador pertenece a la academia del owner; la academia nunca la elige el usuario (ADR-012).
- Datos básicos: nombres, apellidos, apodo (opcional), fecha de nacimiento (obligatoria), celular (opcional) y estado activo o inactivo (DEC-36). Sin documento de identidad ni foto.
- El celular del jugador es **siempre opcional**. Un jugador adulto sin acudiente responde él mismo desde el enlace, eligiendo «Soy el jugador» (DEC-36, DEC-31).
- Los acudientes se agregan desde la ficha del jugador (HU-034) o nacen desde el enlace de una convocatoria (spec 4).
- Un jugador puede pertenecer a varios grupos (DEC-35).
- Los espacios al inicio y al final se ignoran.
- Un jugador eliminado no impide registrar a otro con los mismos datos.

## Fuera de alcance

- Documento de identidad, foto, información médica, pagos y estadísticas.
- Importación masiva de jugadores.
- Categorías automáticas por edad.

## Decisiones relacionadas

ADR-018: DEC-30, DEC-31, DEC-35, DEC-36 y DEC-42 · ADR-012 (DEC-27, borrado lógico).
