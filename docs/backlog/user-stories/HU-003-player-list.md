# HU-003 — Player List

**Épica:** EP-02 — Gestión de jugadores

## Historia de usuario

> Como **administrador**, quiero consultar los jugadores registrados en la academia, para conocer y gestionar la información disponible.

## Criterios de aceptación

### CA-001 — Listado de jugadores

**Dado** que existen jugadores registrados,  
**cuando** el administrador accede a la gestión de jugadores,  
**entonces** el sistema debe mostrar los jugadores disponibles.

### CA-002 — Academia

**Dado** que el administrador pertenece a una academia,  
**cuando** consulta sus jugadores,  
**entonces** solo debe visualizar jugadores correspondientes a esa academia.

### CA-003 — Estado vacío

**Dado** que no existen jugadores registrados,  
**cuando** el administrador accede al listado,  
**entonces** el sistema debe mostrar un estado indicando que no existen jugadores registrados.