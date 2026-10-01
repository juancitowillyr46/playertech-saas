# HU-013 — Share Call-Up

**Épica:** EP-08 — Comunicación de convocatorias

## Historia de usuario

> Como **administrador**, quiero copiar el mensaje de una convocatoria, para compartirlo manualmente con el tutor mediante WhatsApp.

## Objetivo

Permitir que el administrador transfiera fácilmente el mensaje generado desde PlayerTech hacia el canal de comunicación utilizado por la academia.

## Criterios de aceptación

### CA-001 — Copiar mensaje

**Dado** que existe un mensaje de convocatoria generado,  
**cuando** el administrador selecciona la opción de copiar,  
**entonces** el sistema debe copiar el contenido al portapapeles.

### CA-002 — Confirmación de copia

**Dado** que el mensaje fue copiado correctamente,  
**cuando** finaliza la operación,  
**entonces** el sistema debe mostrar una confirmación visual.

### CA-003 — Contenido completo

**Dado** que el administrador copia el mensaje,  
**cuando** pega el contenido en otro canal,  
**entonces** debe conservar la información y el enlace de la convocatoria.

### CA-004 — Compartir mediante WhatsApp

**Dado** que el administrador tiene el mensaje copiado,  
**cuando** accede a WhatsApp,  
**entonces** debe poder pegar el mensaje y enviarlo manualmente al tutor.

### CA-005 — Sin envío automático

**Dado** que el administrador utiliza la opción de copiar,  
**cuando** finaliza la operación,  
**entonces** PlayerTech no debe enviar automáticamente el mensaje al tutor.

## Reglas de negocio

- El envío del mensaje es responsabilidad del administrador.
- WhatsApp funciona como canal externo de comunicación.
- PlayerTech no necesita conocer el estado de entrega o lectura del mensaje.

## Fuera de alcance

- API oficial de WhatsApp.
- Envío automático.
- Seguimiento de entrega.
- Seguimiento de lectura.
- Gestión de conversaciones.