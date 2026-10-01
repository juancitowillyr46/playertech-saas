# HU-012 — Call-Up Message

**Épica:** EP-08 — Comunicación de convocatorias

## Historia de usuario

> Como **administrador**, quiero generar un mensaje de convocatoria, para comunicar la actividad al tutor utilizando el canal habitual de la academia.

## Objetivo

Facilitar al administrador un mensaje estructurado que pueda utilizar para comunicar una convocatoria.

## Criterios de aceptación

### CA-001 — Generar mensaje

**Dado** que existe una convocatoria publicada,  
**cuando** el administrador solicita generar el mensaje,  
**entonces** el sistema debe generar un contenido listo para compartir.

### CA-002 — Información de la actividad

**Dado** que se genera el mensaje,  
**cuando** el administrador lo consulta,  
**entonces** debe contener la información necesaria para identificar la actividad convocada.

### CA-003 — Información del jugador

**Dado** que la convocatoria corresponde a un jugador,  
**cuando** se genera el mensaje,  
**entonces** el mensaje debe identificar al jugador convocado.

### CA-004 — Enlace de convocatoria

**Dado** que la convocatoria tiene un enlace válido,  
**cuando** se genera el mensaje,  
**entonces** el enlace debe incluirse en el contenido.

### CA-005 — Mensaje reutilizable

**Dado** que el mensaje fue generado,  
**cuando** el administrador lo consulta,  
**entonces** debe poder utilizar el contenido para compartirlo mediante un canal externo.

## Reglas de negocio

- El mensaje debe estar asociado a una convocatoria específica.
- El enlace incluido debe corresponder a la convocatoria publicada.
- PlayerTech genera el contenido, pero no realiza el envío mediante WhatsApp.

## Fuera de alcance

- Integración con la API de WhatsApp.
- Envío automático.
- Seguimiento de entrega o lectura.
- Gestión de conversaciones.