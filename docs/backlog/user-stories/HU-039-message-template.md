# HU-039 — Plantilla del mensaje con datos de la convocatoria

**Épica:** EP-08 — Comunicación de convocatorias · **Fase:** posterior a la Fase 2 · **Prioridad:** MVP+ · **Estado:** Pendiente
**Origen:** validación de la spec 012 (2026-10-19). Hoy el mensaje es un texto propio editable seguido de un bloque generado fijo (HU-012).

## Historia de usuario

> Como **owner**, quiero escribir el mensaje de la convocatoria a mi manera e indicar dónde van los datos (lugar, hora, convocados, enlace), para que suene como yo y los datos sigan siendo siempre los actuales.

## Criterios de aceptación

### CA-001 — Escribir la plantilla
**Dado** el mensaje de una convocatoria,
**cuando** el owner edita la plantilla,
**entonces** puede cambiar libremente el texto y el orden, e insertar datos con «Insertar dato» (por ejemplo, `{lugar}`), sin escribirlos a mano.

### CA-002 — Los datos no se editan
**Dado** una plantilla con datos,
**cuando** se genera el mensaje,
**entonces** cada dato se reemplaza por su valor actual (fecha, actividad, lugar, llegada, inicio, observaciones, fecha límite, convocados en viñetas, enlace); el owner no puede cambiar esos valores desde la plantilla.

### CA-003 — Vista previa
**Dado** la plantilla en edición,
**cuando** el owner escribe,
**entonces** ve debajo el mensaje tal como se copiará.

### CA-004 — Datos obligatorios
**Dado** una plantilla sin `{convocados}` o sin `{enlace}` (mensaje del grupo), o sin `{enlace}` (mensaje personal),
**cuando** el owner intenta guardarla,
**entonces** se le indica qué dato falta y no se guarda.

### CA-005 — Dato desconocido o vacío
**Dado** un dato mal escrito (por ejemplo, `{lugr}`) o un dato sin valor (por ejemplo, `{rival}` en un entrenamiento),
**cuando** se genera el mensaje,
**entonces** el dato mal escrito se señala en la vista previa, y la línea que solo tenía datos vacíos no aparece.

### CA-006 — Plantilla por defecto
**Dado** una academia que nunca editó la plantilla,
**cuando** abre el mensaje,
**entonces** se usa la plantilla actual de PlayerTech (spec 012), y puede volver a ella con «Restablecer».

## Decisiones por cerrar (Definition of Ready)

Propuestas del análisis del 2026-10-19, pendientes de aprobación:

1. **Forma de edición:** campo de texto con marcadores, botones «Insertar dato» y vista previa (opción C). Se descartan, por ahora, los comodines bloqueados dentro del texto (requieren un editor enriquecido y una librería nueva, con problemas en iPhone) y la edición por bloques (opción B, que queda como evolución si los marcadores resultan difíciles de usar).
2. **Alcance de la plantilla:** por academia y tipo de actividad (entrenamiento o competencia), para el mensaje del grupo y el personal. Los avisos de HU-038 conservan su formato.
3. **Texto propio por lista:** se mantiene como saludo antes de la plantilla, para no perder lo que ya escribieron los owners.
4. **Nombres de los datos:** en español y con el vocabulario de `docs/product/glossary.md` (`{fecha}`, `{actividad}`, `{lugar}`, `{llegada}`, `{inicio}`, `{fin}`, `{rival}`, `{torneo}`, `{observaciones}`, `{fecha límite}`, `{convocados}`, `{enlace}`).

## Reglas de negocio

- Los datos se toman siempre de la actividad y de la convocatoria al generar el mensaje; la plantilla no guarda valores.
- La plantilla pertenece a la academia (aislamiento entre academias y borrado lógico, ADR-012).

## Decisiones relacionadas

ADR-018: DEC-45. Se registrará una DEC nueva al cerrar las decisiones anteriores.
