# Especificación de funcionalidad: Jugadores, acudientes y grupos

**Feature Branch**: `009-players-guardians-groups`

**Created**: 2026-10-18

**Status**: Draft

**Origen**: Spec 1 de la **Fase 2 — Negocio** (ADR-018, DEC-37). Épicas **EP-02** (jugadores), **EP-03** (grupos) y **EP-10** (acudientes): HU-002, HU-003, HU-033, HU-004 y HU-034.

**Input**: Descripción del usuario: "players-guardians-groups: Spec 1 de la Fase 2. Registrar, consultar y gestionar jugadores; gestionar grupos con sus integrantes; registrar los acudientes de cada jugador. Antes de implementar, maquetas de baja fidelidad para la aprobación del responsable."

> Esta spec cubre cinco HU de tres épicas del mismo tramo del flujo de la Fase 2 (principio I) y referencia sus criterios de aceptación en `docs/backlog/user-stories/`. Su usuario es el **owner de la academia**, que trabaja sobre todo desde el celular. Es la base de las convocatorias: sin jugadores, grupos y acudientes no hay a quién convocar. Las decisiones de producto están en ADR-018 (DEC-30, DEC-31, DEC-35, DEC-36, DEC-39, DEC-40 y DEC-42). Los acudientes que nacen desde el enlace de una convocatoria y su validación llegan en la spec 4.

## Escenarios de usuario y pruebas *(mandatory)*

### Historia 1 - Registrar jugadores (Prioridad: P1)

Como owner, quiero registrar a los jugadores de mi academia, para tenerlos en un solo lugar y poder convocarlos.

**Motivo de prioridad**: Sin jugadores no hay grupos, acudientes ni convocatorias.

**Prueba independiente**: Desde el celular, el owner registra un jugador con datos obligatorios y opcionales, intenta registrarlo de nuevo con los mismos datos y prueba datos inválidos.

**Referencia**: CA-001 a CA-007 de HU-002; DEC-36 y DEC-42.

**Escenarios de aceptación**:

1. **Dado** nombres, apellidos y fecha de nacimiento válidos, **cuando** el owner guarda, **entonces** se cumple CA-001 de HU-002.
2. **Dado** un dato obligatorio vacío, una fecha futura o de hace más de 100 años, o un celular que no es colombiano, **cuando** intenta guardar, **entonces** se cumplen CA-002, CA-003 y CA-007 de HU-002.
3. **Dado** apodo, celular y grupos (opcionales), **cuando** guarda, **entonces** se cumplen CA-004 y CA-005 de HU-002.
4. **Dado** un jugador ya registrado (activo o inactivo) con los mismos nombres, apellidos y fecha de nacimiento, **cuando** intenta guardar, **entonces** se cumple CA-006 de HU-002: no se duplica y se ofrece actualizar sus datos, o reactivarlo y actualizarlo.

---

### Historia 2 - Encontrar jugadores (Prioridad: P1)

Como owner, quiero ver y encontrar rápido a mis jugadores desde el celular.

**Motivo de prioridad**: Es la pantalla que el owner usará a diario.

**Prueba independiente**: Con varios jugadores en distintos grupos y estados, el owner busca por nombre, apodo y sin tildes, filtra por grupo y por estado, y revisa el estado vacío.

**Referencia**: CA-001 a CA-006 de HU-003.

**Escenarios de aceptación**:

1. **Dado** jugadores registrados, **cuando** el owner abre Jugadores, **entonces** se cumplen CA-001 y CA-004 de HU-003.
2. **Dado** el listado, **cuando** busca o filtra, **entonces** se cumplen CA-002 y CA-003 de HU-003.
3. **Dado** una academia sin jugadores, u otra academia con jugadores, **cuando** abre Jugadores, **entonces** se cumplen CA-005 y CA-006 de HU-003.

---

### Historia 3 - Mantener al día un jugador (Prioridad: P1)

Como owner, quiero ver la ficha de un jugador, corregir sus datos, desactivarlo si deja de entrenar o eliminarlo si lo registré por error.

**Motivo de prioridad**: Los datos cambian (celular, grupos) y los jugadores entran y salen de la academia.

**Prueba independiente**: El owner abre la ficha, edita, desactiva y reactiva un jugador, y elimina otro con confirmación.

**Referencia**: CA-001 a CA-005 de HU-033.

**Escenarios de aceptación**:

1. **Dado** un jugador, **cuando** el owner abre su ficha y edita sus datos o grupos, **entonces** se cumplen CA-001 y CA-002 de HU-033.
2. **Dado** un jugador activo o inactivo, **cuando** lo desactiva o lo reactiva, **entonces** se cumple CA-003 de HU-033.
3. **Dado** un jugador, **cuando** lo elimina y confirma, **entonces** se cumple CA-004 de HU-033.
4. **Dado** el formulario con cambios sin guardar, **cuando** intenta salir, **entonces** se cumple CA-005 de HU-033.

---

### Historia 4 - Organizar grupos (Prioridad: P1)

Como owner, quiero organizar a mis jugadores en grupos o categorías, para convocarlos por grupo.

**Motivo de prioridad**: Las convocatorias se generan por grupo (DEC-31, DEC-35).

**Prueba independiente**: El owner crea un grupo, agrega y quita integrantes, renombra el grupo y lo elimina sin perder a sus jugadores.

**Referencia**: CA-001 a CA-007 de HU-004.

**Escenarios de aceptación**:

1. **Dado** un nombre válido y no repetido, **cuando** el owner crea o renombra un grupo, **entonces** se cumplen CA-001, CA-002 y CA-005 de HU-004.
2. **Dado** grupos con jugadores, **cuando** abre Grupos o un grupo, **entonces** se cumplen CA-003 y CA-004 de HU-004.
3. **Dado** un grupo, **cuando** lo elimina y confirma, **entonces** se cumple CA-006 de HU-004.
4. **Dado** una academia sin grupos, u otra academia con grupos, **cuando** abre Grupos, **entonces** se cumple CA-007 de HU-004.

---

### Historia 5 - Registrar acudientes (Prioridad: P2)

Como owner, quiero registrar a los acudientes que ya conozco, para que sus respuestas cuenten como validadas desde el principio.

**Motivo de prioridad**: Los acudientes también pueden nacer desde el enlace (spec 4); registrarlos a mano es opcional pero útil.

**Prueba independiente**: El owner agrega a la mamá y al papá de un jugador, vincula al papá con un hermano usando su celular, edita y retira un acudiente.

**Referencia**: CA-001 a CA-007 de HU-034; DEC-39 y DEC-40.

**Escenarios de aceptación**:

1. **Dado** la ficha de un jugador, **cuando** el owner agrega un acudiente válido con la marca de autorización de datos, **entonces** se cumplen CA-001, CA-002 y CA-006 de HU-034.
2. **Dado** un celular que ya pertenece a un acudiente de la academia, **cuando** lo agrega a otro jugador, **entonces** se cumple CA-003 de HU-034: se vincula la misma persona.
3. **Dado** un jugador con un acudiente, **cuando** agrega otro, o edita o retira uno, **entonces** se cumplen CA-004 y CA-005 de HU-034.
4. **Dado** otra academia, **cuando** gestiona acudientes, **entonces** se cumple CA-007 de HU-034.

---

### Historia 6 - Pantallas revisadas y aprobadas (Prioridad: P2)

Como owner, quiero que estas pantallas sean claras y cómodas en el celular, y haber aprobado su diseño antes de que se construyan.

**Motivo de prioridad**: Principio XIII y decisión del responsable de aprobar maquetas antes de implementar.

**Prueba independiente**: El responsable aprueba las maquetas de baja fidelidad del plan; al implementar, se revisan las pantallas a 360 px y en escritorio, en modo claro y oscuro.

**Escenarios de aceptación**:

1. **Dado** el plan, **cuando** el responsable revisa las maquetas de las pantallas principales, **entonces** las aprueba o pide cambios antes de implementar.
2. **Dado** las pantallas implementadas, **cuando** se revisan, **entonces** no hay hallazgos críticos ni altos sin resolver, no hay desplazamiento horizontal a 360 px y los controles miden al menos 44 px.

---

### Edge Cases

- **Homónimos**: dos jugadores con el mismo nombre y apellidos pero distinta fecha de nacimiento se registran sin problema; el apodo ayuda a distinguirlos.
- **Tildes y mayúsculas**: «José Pérez» y «jose perez» con la misma fecha cuentan como el mismo jugador (DEC-42).
- **Jugador ya registrado pero eliminado**: no bloquea registrar uno nuevo.
- **Celular con espacios o guiones** («300 123 4567»): se aceptan y se guardan solo los 10 dígitos.
- **Mismo celular para el jugador y su acudiente**: se permite (por ejemplo, una mamá que usa el celular del hijo).
- **Acudiente retirado de su único jugador**: deja de mostrarse; si se vuelve a registrar con el mismo celular, se reutiliza la persona.
- **Grupo eliminado con jugadores**: los jugadores siguen registrados y dejan de pertenecer a ese grupo.
- **Jugador inactivo en un grupo**: sigue como integrante, marcado como inactivo, y no cuenta en el número del grupo.
- **Dos pestañas o dispositivos**: si un jugador, un grupo o un acudiente cambió o se eliminó en otro lugar, se informa en español y la pantalla se actualiza.
- **Sin conexión al guardar**: el formulario conserva lo escrito y muestra un mensaje en español.
- **Doble toque en Guardar o en una acción**: no se aplica dos veces.
- **Textos largos**: nombres largos no rompen el listado ni la ficha.

## Requirements *(mandatory)*

### Functional Requirements

**Jugadores (HU-002, HU-003, HU-033)**

- **FR-001**: El owner DEBE poder registrar jugadores con nombres, apellidos y fecha de nacimiento (obligatorios), y apodo y celular (opcionales) (DEC-36).
- **FR-002**: La fecha de nacimiento NO DEBE ser futura ni anterior a 100 años. El celular, si se ingresa, DEBE ser colombiano: 10 dígitos que empiezan por 3.
- **FR-003**: NO DEBE existir más de un jugador no eliminado con los mismos nombres, apellidos y fecha de nacimiento en la academia (sin distinguir mayúsculas, tildes ni espacios sobrantes). Ante un intento, DEBE ofrecerse actualizar los datos del existente, o reactivarlo y actualizarlo si está inactivo (DEC-42).
- **FR-004**: El listado DEBE mostrar nombre, apodo, edad, grupos, estado y número de acudientes; DEBE permitir buscar por nombre, apellido o apodo (sin distinguir mayúsculas ni tildes) y filtrar por grupo y estado, con activos por defecto.
- **FR-005**: El owner DEBE poder ver la ficha de un jugador, editarlo, desactivarlo y reactivarlo sin confirmación, y eliminarlo tras una confirmación que lo nombre (borrado lógico).
- **FR-006**: Salir de un formulario con cambios sin guardar DEBE pedir confirmación.

**Grupos (HU-004)**

- **FR-007**: El owner DEBE poder crear, renombrar y eliminar grupos. El nombre es obligatorio y único entre los grupos no eliminados de la academia (sin distinguir mayúsculas ni espacios sobrantes); los nombres de grupos eliminados pueden reutilizarse.
- **FR-008**: Un jugador DEBE poder pertenecer a varios grupos. El owner DEBE poder agregar y quitar integrantes desde el grupo (con buscador de jugadores activos) y desde la ficha del jugador.
- **FR-009**: El listado de grupos DEBE mostrar el número de jugadores activos de cada uno. Eliminar un grupo NO DEBE eliminar a sus jugadores.

**Acudientes (HU-034)**

- **FR-010**: El owner DEBE poder agregar acudientes a un jugador con nombre, celular colombiano válido y parentesco (mamá, papá, abuelo o abuela, u otro). El vínculo creado por el owner nace **validado** (DEC-40).
- **FR-011**: Un acudiente se identifica en la academia por su celular: si el celular ya pertenece a un acudiente, DEBE ofrecerse vincular a esa misma persona en lugar de crear otra.
- **FR-012**: Un jugador DEBE poder tener varios acudientes y un acudiente varios jugadores. El owner DEBE poder editar un acudiente y retirarlo de un jugador con confirmación.
- **FR-013**: Al registrar un acudiente, el owner DEBE marcar que cuenta con su autorización para tratar sus datos. Se guarda la versión vigente de la Política de Tratamiento de Datos y la hora (DEC-39).

**Comunes**

- **FR-014**: Toda lectura y escritura DEBE depender de la autorización de la base de datos: solo el owner escribe, y nunca se accede a datos de otra academia (ADR-012).
- **FR-015**: Cada operación exitosa DEBE mostrar un aviso breve y reflejarse sin recargar la página; los errores DEBEN mostrarse en español sin detalles técnicos, conservando lo escrito.
- **FR-016**: Antes de implementar, el plan DEBE incluir maquetas de baja fidelidad de las pantallas principales (listado y ficha del jugador con sus acudientes, formulario con el aviso de jugador ya registrado, listado de grupos y grupo con integrantes) para la aprobación del responsable.
- **FR-017**: Las pantallas DEBEN cumplir `DESIGN.md` y el patrón de página de gestión de `ui.md`, con controles de al menos 44 px y sin desplazamiento horizontal a 360 px, en modo claro y oscuro, y pasar la revisión de experiencia y accesibilidad (principio XIII).
- **FR-018**: Cada criterio de las cinco HU DEBE tener al menos una prueba automática o un paso de validación documentado.

### Key Entities

- **Jugador**: nombres, apellidos, apodo, fecha de nacimiento, celular, activo o inactivo, eliminado. Pertenece a una academia.
- **Grupo**: nombre único en la academia; eliminado. Agrupa jugadores.
- **Integrante de grupo**: relación entre un jugador y un grupo; un jugador puede estar en varios.
- **Acudiente**: la persona (nombre y celular), única en la academia por su celular.
- **Vínculo acudiente-jugador**: parentesco y estado (aquí siempre validado, porque lo crea el owner; pendiente y rechazado llegan en la spec 4), con la autorización de datos registrada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un owner registra un jugador con sus grupos desde el celular en menos de 1 minuto.
- **SC-002**: Un owner encuentra a un jugador escribiendo parte de su nombre o apodo en menos de 5 segundos, con 200 jugadores registrados.
- **SC-003**: El 100 % de los intentos de duplicar a un jugador se detectan y ofrecen actualizar al existente; no quedan jugadores duplicados.
- **SC-004**: Un owner crea un grupo y le agrega 15 jugadores en menos de 2 minutos.
- **SC-005**: Ningún owner puede ver ni modificar jugadores, grupos ni acudientes de otra academia (verificado con las dos academias del seed y con pruebas de base de datos).
- **SC-006**: El responsable aprueba las maquetas antes de implementar; a 360 px no hay desplazamiento horizontal, los controles miden al menos 44 px y la auditoría de accesibilidad no deja hallazgos críticos.
- **SC-007**: Cada criterio de aceptación de las cinco HU tiene al menos una prueba automática o un paso de validación documentado.

## Assumptions

- Hacen falta tablas nuevas (jugadores, grupos, integrantes, acudientes y vínculos) con las reglas de ADR-012 (academia, permisos por base de datos, auditoría y borrado lógico) y de ADR-017 (portabilidad). Las define el plan.
- El único rol con escritura es el owner (MVP). Los acudientes no acceden a la aplicación en esta spec.
- Jugadores, grupos y acudientes son una sección nueva de la aplicación, en la navegación principal. Su ubicación exacta se decide con las maquetas.
- Los parentescos son mamá, papá, abuelo o abuela, y otro. «Soy el jugador» solo existe desde el enlace (spec 4).
- La edad se calcula con la fecha actual de Colombia (America/Bogota).
- Desactivar no pide confirmación (es reversible); eliminar sí, como en Sedes.
- Durante el desarrollo y antes del commit se corren solo las pruebas de la spec, incluidas las de base de datos de las tablas nuevas.
- Quedan fuera de alcance: acudientes desde el enlace, validación de vínculos y dispositivos, avisos (spec 4), actividades y convocatorias (specs 2 y 3), importación masiva, categorías automáticas por edad, documento de identidad, foto e información médica.
