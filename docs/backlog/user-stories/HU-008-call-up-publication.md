# HU-008 — Call-Up Publication

**Épica:** EP-05 — Gestión de convocatorias

## Historia de usuario

> Como **administrador**, quiero publicar una convocatoria, para ponerla a disposición de los tutores.

## Criterios de aceptación

### CA-001 — Publicar convocatoria

**Dado** que existe una convocatoria preparada,  
**cuando** el administrador la publica,  
**entonces** el sistema debe cambiarla a un estado que permita su consulta por los tutores.

### CA-002 — Generar enlace

**Dado** que una convocatoria es publicada,  
**cuando** finaliza la publicación,  
**entonces** el sistema debe generar un enlace de acceso para la convocatoria.

### CA-003 — Enlace temporal

**Dado** que el tutor recibe un enlace de convocatoria,  
**cuando** el enlace ha expirado o ya fue utilizado para registrar una respuesta,  
**entonces** el sistema no debe permitir registrar una nueva respuesta mediante ese enlace.

### CA-004 — Confirmación

**Dado** que la convocatoria fue publicada correctamente,  
**cuando** finaliza la operación,  
**entonces** el administrador debe recibir una confirmación.
