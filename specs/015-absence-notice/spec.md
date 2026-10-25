# Especificación de funcionalidad: Aviso de inasistencia

**Feature Branch**: `015-absence-notice`

**Created**: 2026-10-24

**Status**: Draft

**Origen**: Spec 5 de la **Fase 2 — Negocio** (ADR-018, DEC-48). Épica **EP-15** (aviso de inasistencia): HU-042.

**Input**: Descripción del usuario: "absence-notice: en la cancha, el owner marca solo a quien no llegó (de los convocados o de un grupo elegido en el momento) y le escribe al acudiente por WhatsApp con un mensaje editable; queda «Avisado» con la hora. Maquetas de baja fidelidad antes de implementar."

> Esta spec cubre una HU (principio I) y referencia sus criterios en `docs/backlog/user-stories/HU-042-absence-notice.md`. Su usuario es el **owner en la cancha**, desde el celular y a veces con una mano. Adelanta una parte de la asistencia de la Etapa 2 (DEC-48): solo se registran ausencias, por excepción. Decisiones: DEC-31, DEC-45 y DEC-48 (ADR-018).

## Escenarios de usuario y pruebas *(mandatory)*

### Historia 1 - Marcar a quien no llegó (Prioridad: P1)

Como owner, quiero marcar en la cancha, con unos pocos toques, a los jugadores que no llegaron.

**Motivo de prioridad**: Sin la marca no hay a quién avisar ni registro de la inasistencia.

**Prueba independiente**: En el entrenamiento de Sub-12 de hoy (sin convocatoria), el owner abre «¿Quién no llegó?», elige Sub-12, toca a Mateo y a Tomás, y ve «2 no llegaron» en la actividad. En el partido del sábado (con convocatoria), la lista son los convocados, con los que dijeron «Sí» primero.

**Referencia**: CA-001 a CA-003 y CA-005 de HU-042; DEC-48.

**Escenarios de aceptación**:

1. **Dado** una actividad, **cuando** ya empezó o aún no, o es otro día, **entonces** se cumple CA-001 de HU-042.
2. **Dado** una actividad con o sin convocatoria, **cuando** se abre la lista, **entonces** se cumple CA-002 de HU-042.
3. **Dado** la lista, **cuando** marca o desmarca, **entonces** se cumple CA-003 de HU-042.
4. **Dado** una actividad con marcas, **entonces** se cumple CA-005 de HU-042.

---

### Historia 2 - Avisar al acudiente (Prioridad: P1)

Como owner, quiero escribirle al acudiente de quien no llegó en ese mismo momento, con un mensaje ya escrito que pueda ajustar.

**Motivo de prioridad**: Es el valor de la funcionalidad: saber que el niño está bien y por qué faltó.

**Prueba independiente**: Con Mateo marcado, el owner toca «Avisar», ajusta el mensaje, elige a su papá y se abre el chat de WhatsApp con el texto. Mateo queda «Avisado 4:12 p. m.». Con un jugador sin acudientes ni celular, solo «Copiar».

**Referencia**: CA-004 de HU-042; DEC-31, DEC-45 y DEC-48.

**Escenarios de aceptación**:

1. **Dado** un jugador marcado, **cuando** toca «Avisar», **entonces** se cumple CA-004 de HU-042.
2. **Dado** un jugador avisado, **cuando** vuelve a la lista, **entonces** ve «Avisado» con la hora y puede avisar de nuevo.

---

### Historia 3 - Pantallas revisadas y aprobadas (Prioridad: P2)

Como owner, quiero que estas pantallas sean rápidas de usar en la cancha, y el responsable quiere aprobar su diseño antes de construirlas.

**Motivo de prioridad**: Principio XIII y aprobación de maquetas antes de implementar.

**Prueba independiente**: El responsable aprueba las maquetas; al implementar, se revisan a 360 px y en escritorio, en claro y oscuro.

**Escenarios de aceptación**:

1. **Dado** el plan, **cuando** el responsable revisa las maquetas (lista con grupos, lista de convocados, aviso), **entonces** las aprueba o pide cambios.
2. **Dado** las pantallas implementadas, **cuando** se revisan, **entonces** no hay hallazgos críticos ni altos, no hay desplazamiento horizontal a 360 px y los controles miden al menos 44 px.

---

### Edge Cases

- **Actividad cancelada**: no ofrece «¿Quién no llegó?».
- **Actividad que termina después de medianoche**: el plazo es el final del día en que empezó (hora de Colombia).
- **Jugador en dos grupos elegidos**: aparece una sola vez.
- **Jugador marcado y luego desmarcado**: deja de contar como ausente y conserva si fue avisado, por si se vuelve a marcar.
- **Jugador de la convocatoria quitado después de marcarlo**: su marca se conserva en el resumen de la actividad.
- **Competencia: quien respondió «No»**: aparece aparte en «Avisaron que no», con «Dijo No» en su fila; se puede marcar igual, pero no hace falta avisar.
- **Jugador inactivo o eliminado**: no aparece en la lista; sus marcas anteriores se conservan.
- **Avisar dos veces**: se permite; vale la hora del último aviso.
- **Sin conexión al marcar**: se informa el error y la marca vuelve a su estado anterior, para que la pantalla muestre lo que quedó guardado; el owner la toca de nuevo para reintentar.
- **Avisar al día siguiente**: no se puede; desde el día siguiente todo queda en modo lectura, incluido «Avisado».
- **Muchos jugadores**: grupos de 30 se marcan sin desplazamiento horizontal y con un buscador.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Una actividad programada (no cancelada) DEBE ofrecer «¿Quién no llegó?» desde su hora de inicio hasta el final de ese día en Colombia; desde el día siguiente, las marcas DEBEN verse en modo lectura.
- **FR-002**: Con convocatoria, la lista DEBEN ser sus convocados activos; en competencia, primero los de respuesta «Sí», luego provisionales y sin respuesta, y aparte, en «Avisaron que no», los de «No», con «Dijo No» en su fila (spec 013).
- **FR-003**: Sin convocatoria, el owner DEBE poder elegir uno o varios grupos y la lista DEBEN ser sus jugadores activos, sin repetir.
- **FR-004**: Tocar a un jugador DEBE marcarlo como «No llegó» y volver a tocarlo, desmarcarlo. Solo se registran las ausencias (DEC-48).
- **FR-005**: «Avisar» DEBE mostrar un mensaje sugerido y editable con el nombre del jugador, el tipo de actividad, la hora y el lugar, y abrir el chat de WhatsApp del acudiente elegido (o del jugador, si no tiene acudientes y tiene celular); sin celular, solo «Copiar». El mensaje NO DEBE guardarse.
- **FR-006**: Al abrir el chat o copiar el mensaje, el jugador DEBE quedar «Avisado» con la hora del servidor. PlayerTech NO DEBE enviar mensajes ni saber si se entregaron.
- **FR-007**: La actividad DEBE mostrar el resumen «N no llegaron · M avisados» y la lista de quiénes.
- **FR-008**: Una ausencia NO DEBE cambiar la respuesta de la convocatoria ni sus totales.
- **FR-009**: Solo el owner DEBE poder marcar y avisar; los datos DEBEN quedar aislados por academia y las reglas de plazo y de actividad cancelada DEBEN garantizarse también fuera de la pantalla.
- **FR-010**: Cada operación exitosa DEBE confirmarse sin interrumpir la marcación; los errores DEBEN mostrarse en español sin detalles técnicos.
- **FR-011**: Antes de implementar, el plan DEBE incluir maquetas de baja fidelidad (detalle de la actividad, lista por grupos, lista de convocados, aviso) para la aprobación del responsable. Los formularios van en drawer.
- **FR-012**: Las pantallas DEBEN cumplir `DESIGN.md` y `ui.md`, con controles de al menos 44 px, sin desplazamiento horizontal a 360 px, en modo claro y oscuro, y pasar la revisión de experiencia y accesibilidad (principio XIII).
- **FR-013**: Cada criterio de HU-042 DEBE tener al menos una prueba automática o un paso de validación documentado.

### Key Entities

- **Ausencia**: de un jugador en una actividad; quién la marcó y cuándo; si se avisó y cuándo (último aviso). Nueva.
- **Actividad, convocatoria, respuestas, grupos, acudientes**: ya existen (specs 009 a 013).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El owner marca a 3 ausentes de un grupo de 20 en menos de 20 segundos desde que abre la actividad en el celular.
- **SC-002**: Desde la marca hasta el chat de WhatsApp abierto con el mensaje listo, el owner necesita como máximo 3 toques.
- **SC-003**: El 100 % de las ausencias avisadas muestran la hora del aviso; ninguna ausencia altera las respuestas de la convocatoria.
- **SC-004**: Ningún owner ve ni modifica ausencias de otra academia, y fuera de plazo o en una actividad cancelada no se pueden marcar (verificado con pruebas de base de datos).
- **SC-005**: El responsable aprueba las maquetas antes de implementar; a 360 px no hay desplazamiento horizontal, los controles miden al menos 44 px y la auditoría de accesibilidad no deja hallazgos críticos.

## Assumptions

- Las actividades, las convocatorias con sus respuestas, los grupos y los acudientes con su celular ya existen (specs 009 a 013).
- Hace falta una tabla nueva para las ausencias, con las reglas de ADR-012 y ADR-017. La define el plan.
- «Fin del día» es las 11:59 p. m. del día de inicio en Colombia (UTC−5 fijo, como el resto de la aplicación).
- El mensaje sugerido sigue el estilo de los mensajes de la spec 012 y se puede editar antes de enviarlo; no se guarda.
- Solo el owner marca (MVP); el entrenador, con EP-11.
- Durante el desarrollo y antes del commit se corren solo las pruebas de la spec.
- Fuera de alcance: lista de presentes, historial por jugador, porcentajes, reportes, rol de entrenador y envío automático (Etapa 2 y EP-11).
