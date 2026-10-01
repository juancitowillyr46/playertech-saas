
# HU-010 — Call-Up Response

**Épica:** EP-06 — Respuesta del tutor

## Historia de usuario

> Como **tutor**, quiero responder una convocatoria indicando si el jugador participará o no, para informar a la academia sobre su participación.

## Criterios de aceptación

### CA-001 — Confirmar participación

**Dado** que el tutor tiene una convocatoria válida,  
**cuando** selecciona "Sí" y confirma,  
**entonces** el sistema debe registrar la respuesta como confirmación de participación.

### CA-002 — No participar

**Dado** que el tutor tiene una convocatoria válida,  
**cuando** selecciona "No",  
**entonces** el sistema debe solicitar un motivo.

### CA-003 — Motivo obligatorio

**Dado** que el tutor seleccionó "No",  
**cuando** intenta enviar la respuesta sin indicar un motivo,  
**entonces** el sistema debe impedir el registro y solicitarlo.

### CA-004 — Registro de respuesta

**Dado** que el tutor proporciona una respuesta válida,  
**cuando** confirma el envío,  
**entonces** el sistema debe registrar la respuesta asociada al jugador y a la convocatoria.

### CA-005 — No modificar respuesta

**Dado** que el tutor ya registró una respuesta,  
**cuando** intenta utilizar nuevamente el enlace para modificarla,  
**entonces** el sistema no debe permitir cambiar la respuesta registrada.

## Reglas de negocio

- Las respuestas posibles son **Sí** y **No**.
- Cuando la respuesta es **No**, el motivo es obligatorio.
- Una respuesta registrada no puede modificarse.
- La confirmación de participación no representa asistencia.