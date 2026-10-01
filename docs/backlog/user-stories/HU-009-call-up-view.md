# HU-009 — Call-Up View

**Épica:** EP-06 — Respuesta del tutor

## Historia de usuario

> Como **tutor**, quiero consultar una convocatoria mediante el enlace recibido, para conocer los detalles de la actividad antes de responder.

## Criterios de aceptación

### CA-001 — Acceso mediante enlace

**Dado** que el tutor dispone de un enlace válido,  
**cuando** accede al enlace,  
**entonces** debe poder visualizar la convocatoria correspondiente.

### CA-002 — Información de la actividad

**Dado** que el tutor consulta una convocatoria,  
**cuando** se muestra la información,  
**entonces** debe poder identificar los datos relevantes de la actividad.

### CA-003 — Jugador

**Dado** que el tutor representa a un jugador convocado,  
**cuando** consulta la convocatoria,  
**entonces** debe poder identificar al jugador correspondiente.

### CA-004 — Enlace inválido o expirado

**Dado** que el enlace no es válido o ha expirado,  
**cuando** el tutor intenta acceder,  
**entonces** el sistema debe mostrar un mensaje indicando que la convocatoria ya no está disponible.

## Reglas de negocio

- El tutor no necesita crear una cuenta para consultar la convocatoria.
- El acceso se realiza mediante el enlace recibido.