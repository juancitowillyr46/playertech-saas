# HU-043 — Leer los documentos legales sin salir del formulario

**Épica:** EP-00 — Alta de academia · **Fase:** 2 — Negocio (antes del piloto) · **Prioridad:** MVP · **Estado:** Definida
**Spec:** 016 (documentos legales en la aplicación)

## Historia de usuario

> Como **persona que acepta un documento legal** (el owner al registrarse, o el owner o el acudiente al autorizar los datos de un acudiente), quiero leer los Términos y Condiciones y la Política de Tratamiento de Datos en la misma pantalla, para aceptarlos sabiendo qué acepto, sin perder lo que ya escribí.

## Criterios de aceptación

### CA-001 — Leer en un dialog
**Dado** el registro, la autorización del acudiente en la ficha del jugador o la respuesta pública de una convocatoria,
**cuando** la persona toca el nombre de un documento,
**entonces** se abre un dialog con su título, la versión y la fecha, y el texto completo con desplazamiento; en el celular ocupa toda la pantalla. Al cerrarlo, el formulario sigue como estaba.

### CA-002 — Leer no es aceptar
**Dado** el dialog abierto,
**cuando** la persona lo cierra,
**entonces** la casilla de aceptación sigue como estaba: aceptar es un paso aparte (HU-014, CA-004).

### CA-003 — La versión que se acepta
**Dado** un documento vigente,
**cuando** se muestra,
**entonces** el texto es el de la versión que queda registrada al aceptarlo.

### CA-004 — Si no carga
**Dado** que el texto no se puede cargar,
**cuando** se abre el dialog,
**entonces** muestra un mensaje en español y un enlace para abrir el documento en otra pestaña.

## Reglas de negocio

- Cada documento y versión es un archivo propio; una versión publicada no se modifica: un cambio de texto se publica como versión nueva (DEC-49).
- El texto inicial es un borrador base para Colombia (Ley 1581 de 2012 y Decreto 1377 de 2013) con los datos del responsable como marcadores; lo revisa un abogado antes de cargar datos reales.
- La academia es la responsable de los datos de sus jugadores y acudientes; PlayerTech, la encargada. De los datos de la cuenta del owner, PlayerTech es la responsable.

## Decisiones relacionadas

ADR-018: DEC-49. HU-014 (CA-004).
