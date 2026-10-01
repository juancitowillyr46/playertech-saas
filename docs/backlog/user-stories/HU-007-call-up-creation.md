# HU-007 — Call-Up Creation

**Épica:** EP-05 — Gestión de convocatorias

## Historia de usuario

> Como **administrador**, quiero crear una convocatoria asociada a una actividad, para solicitar la participación de determinados jugadores.

## Criterios de aceptación

### CA-001 — Crear convocatoria

**Dado** que existe una actividad,  
**cuando** el administrador selecciona los jugadores que participarán en la convocatoria,  
**entonces** el sistema debe crear la convocatoria.

### CA-002 — Jugadores convocados

**Dado** que el administrador seleccionó jugadores,  
**cuando** confirma la convocatoria,  
**entonces** esos jugadores deben quedar asociados a ella.

### CA-003 — Convocatoria sin jugadores

**Dado** que el administrador no seleccionó jugadores,  
**cuando** intenta crear la convocatoria,  
**entonces** el sistema debe impedir la operación e indicar que debe seleccionar al menos un jugador.

### CA-004 — Actividad asociada

**Dado** que se crea una convocatoria,  
**cuando** finaliza el proceso,  
**entonces** la convocatoria debe estar asociada a una actividad específica.