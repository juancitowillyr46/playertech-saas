# Especificación de funcionalidad: Convocatoria y mensaje de WhatsApp

**Feature Branch**: `012-call-ups`

**Created**: 2026-10-19

**Status**: Draft

**Origen**: Spec 3 de la **Fase 2 — Negocio** (ADR-018, DEC-37). Épicas **EP-05** (convocatorias) y **EP-08** (comunicación): HU-007, HU-008, HU-012, HU-013 y HU-038.

**Input**: Descripción del usuario: "call-ups: convocar jugadores a una actividad por grupos (sumando o quitando jugadores), con un enlace por lista; generar el mensaje con un texto propio editable y un bloque generado no editable; compartirlo en el grupo de WhatsApp o enviarlo al acudiente; avisar cancelaciones y cambios. Maquetas de baja fidelidad antes de implementar."

> Esta spec cubre cinco HU de dos épicas del mismo tramo del flujo (principio I) y referencia sus criterios en `docs/backlog/user-stories/`. Su usuario es el **owner de la academia**, sobre todo desde el celular. Reemplaza el mensaje que hoy se escribe a mano en cada grupo de WhatsApp. Decisiones: DEC-31, DEC-34, DEC-35 y DEC-45 (ADR-018). Responder desde el enlace y el seguimiento son la spec 4.

## Escenarios de usuario y pruebas *(mandatory)*

### Historia 1 - Convocar a una actividad (Prioridad: P1)

Como owner, quiero convocar a los jugadores de una actividad eligiendo sus grupos y ajustando la lista.

**Motivo de prioridad**: Sin convocatoria no hay mensaje ni respuestas.

**Prueba independiente**: Desde el celular, el owner convoca a Sub-12 para un entrenamiento, quita a un jugador, suma a uno de Sub-10 en la lista de Sub-12 y deja una fecha límite.

**Referencia**: CA-001 a CA-007 de HU-007; DEC-45.

**Escenarios de aceptación**:

1. **Dado** una actividad próxima sin convocatoria, **cuando** convoca por grupos, **entonces** se cumple CA-001 de HU-007.
2. **Dado** la lista, **cuando** quita jugadores o suma de otros grupos, **entonces** se cumplen CA-002 y CA-003 de HU-007.
3. **Dado** que no elige grupos, **cuando** suma jugadores uno a uno, **entonces** se cumple CA-004 de HU-007.
4. **Dado** una fecha límite, o ninguna, **entonces** se cumple CA-005 de HU-007.
5. **Dado** una lista vacía o una actividad no convocable, **entonces** se cumplen CA-006 y CA-007 de HU-007.

---

### Historia 2 - Mantener la convocatoria abierta al día (Prioridad: P1)

Como owner, quiero ajustar los convocados y la fecha límite mientras la convocatoria está abierta, y cerrarla cuando quiera.

**Motivo de prioridad**: Los convocados cambian hasta última hora (el caso del amistoso).

**Prueba independiente**: Con una convocatoria abierta, el owner ve sus listas con sus enlaces, suma a un jugador, cambia la fecha límite y la cierra.

**Referencia**: CA-001 a CA-006 de HU-008.

**Escenarios de aceptación**:

1. **Dado** una convocatoria recién creada, **entonces** se cumple CA-001 de HU-008.
2. **Dado** una abierta, **cuando** ajusta convocados o la fecha límite, **entonces** se cumplen CA-002 y CA-003 de HU-008.
3. **Dado** una abierta, **cuando** la cierra o llega su hora de cierre, **entonces** se cumplen CA-004 y CA-005 de HU-008.
4. **Dado** otras academias, **entonces** se cumple CA-006 de HU-008.

---

### Historia 3 - Mensaje listo para WhatsApp (Prioridad: P1)

Como owner, quiero que el mensaje se arme solo, con mi saludo, los datos de la actividad, los convocados y el enlace.

**Motivo de prioridad**: Es el objetivo de la Fase 2: dejar de escribir el mensaje a mano.

**Prueba independiente**: El owner abre el mensaje de Sub-12, escribe un saludo, comparte, vuelve a abrirlo y su saludo sigue ahí con los datos actualizados tras cambiar la hora.

**Referencia**: CA-001 a CA-004 de HU-012.

**Escenarios de aceptación**:

1. **Dado** una lista, **cuando** abre su mensaje, **entonces** se cumple CA-001 de HU-012.
2. **Dado** un convocado, **cuando** abre su mensaje personal, **entonces** se cumple CA-002 de HU-012.
3. **Dado** el texto propio, **cuando** lo edita, **entonces** se cumplen CA-003 y CA-004 de HU-012.

---

### Historia 4 - Compartir por WhatsApp (Prioridad: P1)

Como owner, quiero compartir el mensaje en el grupo o enviárselo directo al acudiente de un convocado.

**Motivo de prioridad**: Sin compartir, el mensaje no llega a las familias.

**Prueba independiente**: Desde el celular, el owner comparte el mensaje de Sub-12 en su grupo y envía el mensaje personal al papá de Mateo, que no está en ese grupo.

**Referencia**: CA-001 a CA-005 de HU-013.

**Escenarios de aceptación**:

1. **Dado** el mensaje de una lista, **cuando** toca «Copiar mensaje», **entonces** se cumple CA-001 de HU-013 (ajuste del 2026-10-19).
2. **Dado** un convocado con acudientes, o sin ellos, **cuando** toca enviar, **entonces** se cumplen CA-002 y CA-003 de HU-013.
3. **Dado** cualquier mensaje, **cuando** copia, **entonces** se cumple CA-004 de HU-013.

---

### Historia 5 - Avisar cancelaciones y cambios (Prioridad: P2)

Como owner, quiero avisar a los convocados cuando la actividad se cancela o cambia de fecha, hora o lugar.

**Motivo de prioridad**: Evita que alguien llegue a la hora o al lugar equivocados.

**Prueba independiente**: Con una convocatoria abierta, el owner cambia la hora del entrenamiento y comparte el aviso; luego cancela otra actividad convocada y comparte el aviso de cancelación.

**Referencia**: CA-001 a CA-004 de HU-038; DEC-45.

**Escenarios de aceptación**:

1. **Dado** una actividad convocada, **cuando** se cancela o cambia de fecha, hora o lugar, **entonces** se cumplen CA-001 y CA-002 de HU-038.
2. **Dado** el aviso ofrecido, **cuando** lo descarta, **entonces** se cumple CA-003 de HU-038.
3. **Dado** una cancelación, **entonces** se cumple CA-004 de HU-038.

---

### Historia 6 - Pantallas revisadas y aprobadas (Prioridad: P2)

Como owner, quiero que estas pantallas sean claras en el celular, y haber aprobado su diseño antes de que se construyan.

**Motivo de prioridad**: Principio XIII y aprobación de maquetas antes de implementar.

**Prueba independiente**: El responsable aprueba las maquetas; al implementar, se revisan a 360 px y en escritorio, en claro y oscuro.

**Escenarios de aceptación**:

1. **Dado** el plan, **cuando** el responsable revisa las maquetas (convocar, convocatoria en la actividad, mensaje y compartir, aviso), **entonces** las aprueba o pide cambios.
2. **Dado** las pantallas implementadas, **cuando** se revisan, **entonces** no hay hallazgos críticos ni altos, no hay desplazamiento horizontal a 360 px y los controles miden al menos 44 px.

---

### Edge Cases

- **Jugador en dos grupos convocados**: aparece una sola vez, en la lista del primer grupo elegido; el owner puede moverlo a otra lista.
- **Jugador desactivado o eliminado tras convocarlo**: deja de aparecer en la lista y en el mensaje.
- **Grupo eliminado tras convocar**: su lista y su enlace se conservan en la convocatoria.
- **Lista que queda vacía al quitar jugadores**: la lista y su enlace se quitan; la convocatoria debe conservar al menos un convocado.
- **Acudiente sin celular válido o jugador sin acudientes ni celular**: solo «Copiar».
- **Cambio de hora que mueve la actividad antes de la fecha límite**: la fecha límite debe seguir siendo anterior al inicio; si no, se indica al guardar.
- **En el computador**: «Compartir» abre WhatsApp Web; si el navegador no puede abrirlo, queda «Copiar».
- **El enlace en esta spec**: al abrirlo se ve «Pronto podrás responder aquí», sin datos de jugadores (responder es la spec 4).
- **Textos largos**: listas de 30 convocados y observaciones largas no rompen el mensaje ni la pantalla.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El owner DEBE poder convocar a una actividad próxima y no cancelada que aún no tenga convocatoria, eligiendo grupos (sus jugadores activos), quitando jugadores y sumando jugadores activos de cualquier grupo, cada uno en la lista de un grupo convocado; sin grupos, en una única lista. Un jugador aparece una sola vez (DEC-45).
- **FR-002**: La convocatoria DEBE quedar abierta al crearse, con un enlace secreto e impredecible por lista, que no cambia al ajustar los convocados (DEC-31).
- **FR-003**: La fecha límite, opcional, DEBE ser futura y anterior al inicio de la actividad; sin ella, la convocatoria se considera cerrada al empezar la actividad (DEC-34). La regla DEBE garantizarse también fuera de la pantalla.
- **FR-004**: Mientras esté abierta, el owner DEBE poder sumar, quitar o mover convocados y cambiar la fecha límite, y DEBE poder cerrarla (con confirmación). Cerrada no se reabre.
- **FR-005**: Cada lista DEBE ofrecer su mensaje: un **texto propio** del owner (hasta 500 caracteres, guardado por lista) seguido de un **bloque generado no editable** con tipo, fecha, citación, inicio, lugar y dirección, rival y torneo (en competencia), observaciones, fecha límite, convocados (nombre, inicial y apodo) y el enlace, siempre con los datos actuales.
- **FR-006**: Cada convocado DEBE ofrecer un mensaje personal (texto inicial editable no guardado, nombre del jugador, datos de la actividad y enlace de su lista).
- **FR-007**: El mensaje de una lista DEBE poder copiarse completo para pegarlo en el grupo (ajuste del 2026-10-19); los mensajes personales DEBEN poder enviarse al celular de un acudiente del convocado (o del propio jugador sin acudientes) abriendo ese chat con el texto listo, y copiarse. PlayerTech NO DEBE enviar mensajes.
- **FR-008**: Al cancelar una actividad con convocatoria abierta, la convocatoria DEBE cerrarse y DEBE ofrecerse un aviso de cancelación; al cambiar su fecha, hora o lugar, DEBE ofrecerse un aviso de cambio. Los avisos son opcionales y usan las mismas opciones de compartir.
- **FR-009**: Toda lectura y escritura DEBE depender de la autorización de la base de datos: solo el owner escribe, y nunca se accede a datos de otra academia. El enlace NO DEBE dar acceso a datos en esta spec.
- **FR-010**: Cada operación exitosa DEBE mostrar un aviso breve y reflejarse sin recargar; los errores DEBEN mostrarse en español sin detalles técnicos, conservando lo escrito.
- **FR-011**: Antes de implementar, el plan DEBE incluir maquetas de baja fidelidad (convocar, convocatoria en la actividad, mensaje y compartir, aviso) para la aprobación del responsable. Los formularios van en drawer.
- **FR-012**: Las pantallas DEBEN cumplir `DESIGN.md` y `ui.md`, con controles de al menos 44 px, sin desplazamiento horizontal a 360 px, en modo claro y oscuro, y pasar la revisión de experiencia y accesibilidad (principio XIII).
- **FR-013**: Cada criterio de las cinco HU DEBE tener al menos una prueba automática o un paso de validación documentado.

### Key Entities

- **Convocatoria**: de una actividad; fecha límite opcional; abierta o cerrada.
- **Lista de convocatoria**: de un grupo convocado (o única, sin grupo); su enlace secreto; el texto propio del mensaje.
- **Convocado**: un jugador en una lista.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un owner convoca a un grupo y comparte el mensaje en su grupo de WhatsApp en menos de 1 minuto desde el celular.
- **SC-002**: Un owner suma a un jugador de otra categoría y le envía el mensaje a su acudiente en menos de 30 segundos.
- **SC-003**: El 100 % de los mensajes compartidos llevan los datos actuales de la actividad, los convocados actuales y el enlace correcto de su lista.
- **SC-004**: Ningún owner puede ver ni modificar convocatorias de otra academia, y el enlace no expone datos (verificado con las dos academias del seed y con pruebas de base de datos).
- **SC-005**: El responsable aprueba las maquetas antes de implementar; a 360 px no hay desplazamiento horizontal, los controles miden al menos 44 px y la auditoría de accesibilidad no deja hallazgos críticos.
- **SC-006**: Cada criterio de las cinco HU tiene al menos una prueba automática o un paso de validación documentado.

## Assumptions

- Hacen falta tablas nuevas (convocatorias, listas y convocados) con las reglas de ADR-012 y ADR-017. Las define el plan.
- Solo el owner escribe (MVP).
- El enlace se genera y se comparte en esta spec; responder desde él, el acceso público seguro, la identificación del acudiente y el seguimiento son la spec 4 (DEC-31, DEC-33). Mientras tanto, abrirlo muestra «Pronto podrás responder aquí», sin datos (aprobado el 2026-10-19).
- Cerrada no se reabre; reactivar una actividad cancelada no reabre su convocatoria.
- Solo cambios de fecha, hora o lugar generan aviso automático.
- Durante el desarrollo y antes del commit se corren solo las pruebas de la spec.
- Fuera de alcance: API de WhatsApp, envío automático, estado de entrega o lectura, respuestas y seguimiento (spec 4), plantilla de mensaje para toda la academia.
