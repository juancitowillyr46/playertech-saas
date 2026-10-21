# EP-08 — Comunicación de convocatorias

## Objetivo

Facilitar al administrador la comunicación de las convocatorias mediante los canales utilizados actualmente por la academia.

## Alcance

- Generar mensaje de convocatoria.
- Incluir enlace de respuesta.
- Copiar el mensaje.
- Compartir manualmente mediante WhatsApp.

## Fuera del alcance

- Integración con API de WhatsApp.
- Envío automático.
- Gestión de conversaciones.
- Automatización de mensajes.

## Historias de usuario

| ID | Historia | Estado |
|---|---|---|
| HU-012 | Generar mensaje de convocatoria | Terminada (entorno local) |
| HU-013 | Compartir convocatoria por WhatsApp | Terminada (entorno local) |
| HU-038 | Avisar cambios de una actividad convocada | Terminada (entorno local) |
| [HU-039](../user-stories/HU-039-message-template.md) | Plantilla del mensaje con datos de la convocatoria (MVP+) | Pendiente |

## Decisiones de la ideación (2026-10-18)

ADR-018. Se construye en la **spec 3 (convocatoria y mensaje)** de la Fase 2. Un mensaje generado por grupo con su enlace, con botón «Compartir» (abre WhatsApp en el celular) además de «Copiar» (DEC-31). Envío directo al acudiente y avisos de cambio: DEC-45.
