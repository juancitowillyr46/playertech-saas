# Especificación de funcionalidad: Actividades y canchas externas

**Feature Branch**: `011-activities-fields`

**Created**: 2026-10-18

**Status**: Draft

**Origen**: Spec 2 de la **Fase 2 — Negocio** (ADR-018, DEC-37). Épicas **EP-04** (actividades) y **EP-14** (canchas externas): HU-005, HU-006, HU-036 y HU-037.

**Input**: Descripción del usuario: "activities-fields: programar entrenamientos y competencias (con repetición semanal), consultarlos, gestionarlos (editar, cancelar, eliminar) y mantener un catálogo de canchas externas. Maquetas de baja fidelidad antes de implementar."

> Esta spec cubre cuatro HU de dos épicas del mismo tramo del flujo (principio I) y referencia sus criterios en `docs/backlog/user-stories/`. Su usuario es el **owner de la academia**, sobre todo desde el celular. Es el paso previo a la convocatoria (spec 3): sin actividad no hay a qué convocar. Decisiones: DEC-32, DEC-35 y DEC-44 (ADR-018).

## Escenarios de usuario y pruebas *(mandatory)*

### Historia 1 - Programar una actividad (Prioridad: P1)

Como owner, quiero programar un entrenamiento o una competencia con su fecha, hora y lugar, para luego convocar a los jugadores.

**Motivo de prioridad**: Sin actividades no hay convocatorias.

**Prueba independiente**: Desde el celular, el owner crea un entrenamiento en una sede y una competencia en una cancha nueva, con rival y citación, y prueba datos inválidos.

**Referencia**: CA-001 a CA-005 y CA-007 de HU-005; DEC-44.

**Escenarios de aceptación**:

1. **Dado** tipo, fecha, hora de inicio y lugar válidos, **cuando** el owner guarda, **entonces** se cumplen CA-001, CA-002 y CA-007 de HU-005.
2. **Dado** un obligatorio vacío, una fecha pasada o horas incoherentes, **cuando** intenta guardar, **entonces** se cumple CA-003 de HU-005.
3. **Dado** los datos opcionales (fin, citación, observaciones, rival y torneo en competencia), **cuando** guarda, **entonces** se cumple CA-004 de HU-005.
4. **Dado** el campo de lugar, **cuando** elige una sede, una cancha o crea una cancha nueva, **entonces** se cumple CA-005 de HU-005.

---

### Historia 2 - Repetir entrenamientos (Prioridad: P1)

Como owner, quiero crear de una vez los entrenamientos de varias semanas (por ejemplo, martes y jueves), para no programarlos uno por uno.

**Motivo de prioridad**: Los entrenamientos se repiten cada semana; programarlos uno por uno desde el celular es lento.

**Prueba independiente**: El owner crea un entrenamiento los martes y jueves durante 4 semanas y obtiene 8 actividades independientes.

**Referencia**: CA-006 de HU-005; CA-005 de HU-036; DEC-44.

**Escenarios de aceptación**:

1. **Dado** «Repetir» con días de la semana y una fecha final, **cuando** guarda, **entonces** se cumple CA-006 de HU-005.
2. **Dado** una fecha final a más de 6 meses o sin días elegidos, **cuando** intenta guardar, **entonces** se indica y no se crea nada.
3. **Dado** una actividad generada, **cuando** se edita, cancela o elimina, **entonces** se cumple CA-005 de HU-036.

---

### Historia 3 - Consultar actividades (Prioridad: P1)

Como owner, quiero ver lo que viene, agrupado por día, y poder revisar lo que ya pasó.

**Motivo de prioridad**: Es la vista diaria del owner y el punto de partida de la convocatoria.

**Prueba independiente**: Con actividades próximas, pasadas y una cancelada, el owner revisa el listado, filtra por tipo, ve las pasadas y abre un detalle.

**Referencia**: CA-001 a CA-006 de HU-006.

**Escenarios de aceptación**:

1. **Dado** actividades programadas, **cuando** abre Actividades, **entonces** se cumplen CA-001 y CA-002 de HU-006.
2. **Dado** los filtros, **cuando** filtra por tipo o elige pasadas, **entonces** se cumple CA-003 de HU-006.
3. **Dado** una actividad, **cuando** la toca, **entonces** se cumple CA-004 de HU-006.
4. **Dado** que no hay próximas, o que existen otras academias, **entonces** se cumplen CA-005 y CA-006 de HU-006.

---

### Historia 4 - Gestionar una actividad (Prioridad: P1)

Como owner, quiero corregir, cancelar o eliminar una actividad para que la programación esté al día.

**Motivo de prioridad**: Los horarios cambian (lluvia, cancha ocupada); sin gestión la información pierde valor.

**Prueba independiente**: El owner edita una actividad próxima, cancela otra y la reactiva, elimina una tercera y comprueba que una pasada no se puede editar ni cancelar.

**Referencia**: CA-001 a CA-006 de HU-036.

**Escenarios de aceptación**:

1. **Dado** una actividad próxima, **cuando** la edita, **entonces** se cumple CA-001 de HU-036.
2. **Dado** una actividad programada, **cuando** la cancela o la reactiva, **entonces** se cumple CA-002 de HU-036.
3. **Dado** una actividad, **cuando** la elimina, **entonces** se cumple CA-003 de HU-036.
4. **Dado** cambios sin guardar o una actividad pasada, **entonces** se cumplen CA-004 y CA-006 de HU-036.

---

### Historia 5 - Catálogo de canchas externas (Prioridad: P2)

Como owner, quiero un catálogo de las canchas donde jugamos, para elegirlas sin escribirlas cada vez.

**Motivo de prioridad**: Se puede crear una cancha desde la actividad (historia 1); el catálogo completo es para mantenerlo.

**Prueba independiente**: El owner crea una cancha desde una actividad, la encuentra en el catálogo, la edita, intenta repetir su nombre y la retira; la actividad conserva su lugar.

**Referencia**: CA-001 a CA-005 de HU-037; DEC-32.

**Escenarios de aceptación**:

1. **Dado** el formulario de la actividad, **cuando** crea una cancha, **entonces** se cumple CA-001 de HU-037.
2. **Dado** un nombre repetido, **cuando** intenta guardar, **entonces** se cumple CA-002 de HU-037.
3. **Dado** el catálogo, **cuando** lo consulta, edita o retira, **entonces** se cumplen CA-003 y CA-004 de HU-037.
4. **Dado** otras academias, **entonces** se cumple CA-005 de HU-037.

---

### Historia 6 - Pantallas revisadas y aprobadas (Prioridad: P2)

Como owner, quiero que estas pantallas sean claras en el celular, y haber aprobado su diseño antes de que se construyan.

**Motivo de prioridad**: Principio XIII y aprobación de maquetas antes de implementar.

**Prueba independiente**: El responsable aprueba las maquetas de baja fidelidad; al implementar, se revisan a 360 px y en escritorio, en claro y oscuro.

**Escenarios de aceptación**:

1. **Dado** el plan, **cuando** el responsable revisa las maquetas (listado, detalle, formulario con repetición y lugar, catálogo de canchas y navegación), **entonces** las aprueba o pide cambios antes de implementar.
2. **Dado** las pantallas implementadas, **cuando** se revisan, **entonces** no hay hallazgos críticos ni altos sin resolver, no hay desplazamiento horizontal a 360 px y los controles miden al menos 44 px.

---

### Edge Cases

- **Actividad de hoy**: es próxima hasta su hora de inicio; desde entonces cuenta como pasada y no se modifica.
- **Sede o cancha desactivada o retirada**: deja de ofrecerse como lugar, pero las actividades que ya la usan conservan y muestran su lugar.
- **Competencia sin rival**: se muestra sin rival; el campo es opcional.
- **Cambio de tipo al editar**: al pasar de competencia a entrenamiento se descartan rival y torneo.
- **Repetición que no cae en ningún día**: por ejemplo, del lunes al martes eligiendo jueves; se indica que no se crea ninguna actividad.
- **Muchas actividades** (un año de entrenamientos, unas 200): el listado sigue siendo fluido.
- **Dos pestañas**: si la actividad cambió o se eliminó en otro lugar, se informa en español y la vista se actualiza.
- **Doble toque en Guardar**: no se crean actividades duplicadas.
- **Textos largos** (observaciones, nombre de torneo): no rompen el listado ni el detalle.

## Requirements *(mandatory)*

### Functional Requirements

**Actividades (HU-005, HU-006, HU-036)**

- **FR-001**: El owner DEBE poder crear actividades de tipo Entrenamiento o Competencia con fecha, hora de inicio y lugar (obligatorios), y hora de fin, hora de citación y observaciones (opcionales); en competencia, además, rival y torneo (opcionales) (DEC-44).
- **FR-002**: NO DEBE crearse una actividad en una fecha u hora ya pasada. La hora de fin, si existe, DEBE ser posterior a la de inicio, y la de citación, anterior o igual a la de inicio. Fechas y horas en la zona de Colombia.
- **FR-003**: El lugar DEBE ser una sede activa o una cancha externa no retirada de la academia; desde el formulario DEBE poder crearse una cancha nueva que queda elegida.
- **FR-004**: Al crear, el owner DEBE poder repetir la actividad semanalmente: uno o más días de la semana y una fecha final de hasta 6 meses después de la fecha de inicio. Se crean actividades independientes, en una sola operación, y se informa cuántas.
- **FR-005**: El listado DEBE mostrar por defecto las próximas, agrupadas por día y ordenadas por hora, con tipo, hora, lugar, rival (si existe) y el sello «Cancelada»; DEBE permitir filtrar por tipo y ver las pasadas (de la más reciente a la más antigua).
- **FR-006**: El detalle DEBE mostrar todos los datos, incluidas las indicaciones del lugar, y las acciones permitidas.
- **FR-007**: El owner DEBE poder editar una actividad próxima, cancelarla y reactivarla (con confirmación) y eliminarla (borrado lógico, con una confirmación que la nombra). Una actividad pasada NO DEBE poder editarse ni cancelarse, solo eliminarse; la regla DEBE garantizarse también fuera de la pantalla.
- **FR-008**: Salir de un formulario con cambios sin guardar DEBE pedir confirmación.

**Canchas externas (HU-037)**

- **FR-009**: El owner DEBE poder crear, editar y retirar canchas externas (nombre obligatorio; dirección, ciudad e indicaciones opcionales). El nombre DEBE ser único entre las canchas no retiradas de la academia, sin distinguir mayúsculas ni espacios sobrantes.
- **FR-010**: Retirar una cancha NO DEBE alterar las actividades que ya la usan.

**Transversales**

- **FR-011**: Toda lectura y escritura DEBE depender de la autorización de la base de datos: solo el owner escribe, y nunca se accede a datos de otra academia.
- **FR-012**: Cada operación exitosa DEBE mostrar un aviso breve y reflejarse sin recargar; los errores DEBEN mostrarse en español sin detalles técnicos, conservando lo escrito.
- **FR-013**: Antes de implementar, el plan DEBE incluir maquetas de baja fidelidad del listado, el detalle, el formulario (con lugar y repetición), el catálogo de canchas y la ubicación en la navegación, para la aprobación del responsable. Los formularios van en drawer, como en Sedes.
- **FR-014**: Las pantallas DEBEN cumplir `DESIGN.md` y `ui.md`, con controles de al menos 44 px, sin desplazamiento horizontal a 360 px, en modo claro y oscuro, y pasar la revisión de experiencia y accesibilidad (principio XIII).
- **FR-015**: Cada criterio de las cuatro HU DEBE tener al menos una prueba automática o un paso de validación documentado.

### Key Entities

- **Actividad**: tipo, fecha, hora de inicio, hora de fin, hora de citación, lugar (sede o cancha), observaciones, rival y torneo (competencia), estado (programada o cancelada), eliminada. Pertenece a una academia.
- **Cancha externa**: nombre único en la academia, dirección, ciudad, indicaciones, retirada.
- **Sede** (existente, EP-12): uno de los dos tipos de lugar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un owner programa una actividad en un lugar ya registrado desde el celular en menos de 1 minuto.
- **SC-002**: Un owner programa los entrenamientos de martes y jueves de 3 meses en menos de 90 segundos.
- **SC-003**: Un owner encuentra la próxima actividad de un día concreto en menos de 5 segundos, con 200 actividades registradas.
- **SC-004**: El 100 % de los intentos de editar o cancelar una actividad pasada se rechazan.
- **SC-005**: Ningún owner puede ver ni modificar actividades o canchas de otra academia (verificado con las dos academias del seed y con pruebas de base de datos).
- **SC-006**: El responsable aprueba las maquetas antes de implementar; a 360 px no hay desplazamiento horizontal, los controles miden al menos 44 px y la auditoría de accesibilidad no deja hallazgos críticos.
- **SC-007**: Cada criterio de las cuatro HU tiene al menos una prueba automática o un paso de validación documentado.

## Assumptions

- Hacen falta tablas nuevas (actividades y canchas externas) con las reglas de ADR-012 y ADR-017. Las define el plan.
- Solo el owner escribe (MVP).
- La actividad no lleva jugadores ni grupos: se eligen al convocar (spec 3, DEC-35).
- Una actividad pasa a ser «pasada» desde su fecha y hora de inicio, en la zona de Colombia.
- Las repeticiones distintas de la semanal y editar toda una serie quedan fuera.
- La ubicación del catálogo de canchas y de Actividades en la navegación se decide con las maquetas.
- Durante el desarrollo y antes del commit se corren solo las pruebas de la spec.
- Fuera de alcance: convocatoria y avisos (spec 3), asistencia, resultados, estadísticas, mapas y geolocalización.
