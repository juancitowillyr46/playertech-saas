# Especificación de funcionalidad: Asignar acudientes ya registrados

**Feature Branch**: `010-guardian-assignment`

**Created**: 2026-10-18

**Status**: Draft

**Origen**: Ajuste de la spec 009 en la **Fase 2 — Negocio** (ADR-018). Épica **EP-10** (acudientes): HU-035.

**Input**: Descripción del usuario: "guardian-assignment: asignar a un jugador un acudiente ya registrado (por ejemplo, los papás de dos hermanos) en lugar de volver a escribir sus datos, y copiar los acudientes de un hermano. La autorización de datos pasa a ser de la persona. Maquetas de baja fidelidad antes de implementar."

> Esta spec cubre HU-035 y referencia sus criterios de aceptación en `docs/backlog/user-stories/`. Nace de la validación de la spec 009: con hermanos, registrar dos veces al mismo acudiente no tiene sentido. Su usuario es el **owner de la academia**, sobre todo desde el celular. Decisiones: DEC-43 y DEC-39 ajustada (ADR-018).

## Escenarios de usuario y pruebas *(mandatory)*

### Historia 1 - Elegir un acudiente ya registrado (Prioridad: P1)

Como owner, quiero elegir de una lista a un acudiente que ya está en la academia y asignarlo a un jugador, para no escribir de nuevo sus datos.

**Motivo de prioridad**: Es el ajuste pedido: el caso de hermanos y de cualquier acudiente que acompaña a varios jugadores.

**Prueba independiente**: Con un acudiente registrado para un jugador, el owner lo asigna a otro jugador buscándolo por nombre o celular, sin escribir sus datos ni marcar de nuevo la autorización.

**Referencia**: CA-001 a CA-004, CA-006 y CA-007 de HU-035; DEC-43 y DEC-39.

**Escenarios de aceptación**:

1. **Dado** acudientes registrados en la academia, **cuando** el owner toca «Agregar acudiente» en la ficha de un jugador, **entonces** ve la lista con buscador y a quién acompaña cada uno (CA-001 y CA-002 de HU-035).
2. **Dado** un acudiente elegido y un parentesco, **cuando** confirma, **entonces** queda asignado y validado sin pedir la autorización (CA-001 y CA-003 de HU-035).
3. **Dado** un acudiente que ya es de este jugador, **cuando** aparece en la lista, **entonces** se indica y no se puede asignar de nuevo (CA-004 de HU-035).
4. **Dado** que la persona no está en la lista, o la academia aún no tiene acudientes, **cuando** el owner toca «Registrar un acudiente nuevo» (o abre «Agregar acudiente» sin acudientes registrados), **entonces** ve el formulario de HU-034 con la autorización obligatoria (CA-006 de HU-035).

---

### Historia 2 - Copiar los acudientes de un hermano (Prioridad: P1)

Como owner, quiero copiar a un jugador los acudientes de su hermano en un solo paso, para registrar rápido a familias con varios hijos.

**Motivo de prioridad**: El caso más común (mamá y papá de dos hermanos) queda en un toque.

**Prueba independiente**: Con un jugador que tiene mamá y papá, el owner abre la ficha del hermano, elige «Copiar acudientes de un hermano», elige al primero y confirma: el hermano queda con ambos y con el mismo parentesco.

**Referencia**: CA-005 y CA-007 de HU-035; DEC-43.

**Escenarios de aceptación**:

1. **Dado** otro jugador con acudientes, **cuando** el owner lo elige, **entonces** ve sus acudientes marcados por defecto, con su parentesco editable (CA-005 de HU-035).
2. **Dado** algunos acudientes desmarcados o un parentesco cambiado, **cuando** confirma, **entonces** solo se asignan los marcados, con el parentesco indicado.
3. **Dado** un acudiente que ya es de este jugador, **cuando** se copia, **entonces** no se repite.

---

### Historia 3 - La autorización es de la persona (Prioridad: P1)

Como owner, quiero que la autorización de datos de un acudiente se registre una sola vez, porque lo que se autoriza es el tratamiento de sus datos, no cada vínculo.

**Motivo de prioridad**: Sin este cambio, asignar a un acudiente existente pediría de nuevo la autorización (DEC-39 ajustada).

**Prueba independiente**: Los acudientes registrados con la spec 009 conservan su autorización; uno nuevo la registra al crearse; asignar no la pide.

**Referencia**: CA-003 y CA-006 de HU-035; CA-006 de HU-034; DEC-39.

**Escenarios de aceptación**:

1. **Dado** acudientes registrados antes de este cambio, **cuando** se aplica, **entonces** cada uno conserva la autorización (versión y hora) de su primer vínculo.
2. **Dado** un acudiente nuevo, **cuando** el owner lo registra, **entonces** la autorización sigue siendo obligatoria y queda registrada en la persona.

---

### Historia 4 - Pantallas revisadas y aprobadas (Prioridad: P2)

Como owner, quiero que estas pantallas sean claras en el celular, y haber aprobado su diseño antes de que se construyan.

**Motivo de prioridad**: Principio XIII y aprobación de maquetas antes de implementar.

**Prueba independiente**: El responsable aprueba las maquetas de baja fidelidad; al implementar, se revisan a 360 px y en escritorio, en claro y oscuro.

**Escenarios de aceptación**:

1. **Dado** el plan, **cuando** el responsable revisa las maquetas de la lista de acudientes, la asignación y «Copiar acudientes de un hermano», **entonces** las aprueba o pide cambios antes de implementar.
2. **Dado** las pantallas implementadas, **cuando** se revisan, **entonces** no hay hallazgos críticos ni altos sin resolver, no hay desplazamiento horizontal a 360 px y los controles miden al menos 44 px.

---

### Edge Cases

- **Acudiente con varios jugadores**: la lista muestra todos los jugadores activos que acompaña, con su parentesco.
- **Parentesco distinto por jugador**: una persona puede ser «Mamá» de uno y «Otro» de otro.
- **Copiar de un jugador sin acudientes**: no aparece en la búsqueda de «Copiar».
- **Copiar cuando todos ya son acudientes del jugador**: se indica y no hay nada que asignar.
- **Acudiente retirado de todos sus jugadores**: sigue en la lista y puede asignarse; la persona y su autorización se conservan.
- **Dos pestañas**: si el acudiente o el jugador ya no existen al confirmar, se informa en español y la ficha se actualiza.
- **Doble toque en Asignar**: no se crea el vínculo dos veces.
- **Muchos acudientes** (300): la búsqueda sigue siendo fluida.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: «Agregar acudiente» en la ficha del jugador DEBE mostrar primero los acudientes no eliminados de la academia, con un buscador por nombre o celular (sin distinguir mayúsculas ni tildes), y para cada uno su nombre, su celular y los jugadores activos que acompaña con su parentesco.
- **FR-002**: El owner DEBE poder elegir un acudiente, indicar el parentesco (mamá, papá, abuelo o abuela, u otro) y asignarlo. El vínculo nace validado y no se piden de nuevo los datos ni la autorización.
- **FR-003**: Un acudiente que ya es de ese jugador DEBE indicarse en la lista y NO DEBE poder asignarse dos veces; la regla DEBE garantizarse también fuera de la pantalla.
- **FR-004**: Desde la lista DEBE poder pasarse a «Registrar un acudiente nuevo» (formulario de HU-034); si la academia no tiene acudientes, se muestra directamente el formulario.
- **FR-005**: La ficha del jugador DEBE ofrecer «Copiar acudientes de un hermano»: buscar otro jugador con acudientes, ver sus acudientes marcados por defecto con su parentesco editable, y asignar los marcados en una sola operación, omitiendo los que ya son de este jugador.
- **FR-006**: La autorización de datos DEBE pertenecer al acudiente (versión de la Política y hora del servidor) y registrarse al crearlo; asignarlo a otro jugador NO DEBE pedirla de nuevo (DEC-39 ajustada).
- **FR-007**: Al aplicar el cambio, los acudientes existentes DEBEN conservar la autorización de su primer vínculo, sin pérdida de datos.
- **FR-008**: Toda lectura y asignación DEBE depender de la autorización de la base de datos: solo el owner asigna, y nunca se ven ni se asignan acudientes o jugadores de otra academia.
- **FR-009**: Cada asignación exitosa DEBE mostrar un aviso breve y reflejarse en la ficha sin recargar; los errores DEBEN mostrarse en español, sin detalles técnicos.
- **FR-010**: Antes de implementar, el plan DEBE incluir maquetas de baja fidelidad de la lista de acudientes, la asignación y «Copiar acudientes de un hermano», para la aprobación del responsable. Los formularios van en drawer, como en Sedes.
- **FR-011**: Las pantallas DEBEN cumplir `DESIGN.md` y `ui.md`, con controles de al menos 44 px, sin desplazamiento horizontal a 360 px, en modo claro y oscuro, y pasar la revisión de experiencia y accesibilidad (principio XIII).
- **FR-012**: Cada criterio de HU-035 DEBE tener al menos una prueba automática o un paso de validación documentado.

### Key Entities

- **Acudiente**: la persona (nombre y celular, única por celular en la academia), que ahora guarda **su autorización de datos** (versión de la Política y hora).
- **Vínculo acudiente-jugador**: parentesco y estado (validado cuando lo crea el owner). Ya no guarda la autorización.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un owner asigna un acudiente ya registrado a un jugador en menos de 20 segundos desde el celular, sin escribir sus datos.
- **SC-002**: Un owner copia la mamá y el papá de un hermano en menos de 30 segundos.
- **SC-003**: El 100 % de los acudientes existentes conservan su autorización tras el cambio, y ningún vínculo queda duplicado.
- **SC-004**: Ningún owner puede ver ni asignar acudientes o jugadores de otra academia (verificado con las dos academias del seed y con pruebas de base de datos).
- **SC-005**: El responsable aprueba las maquetas antes de implementar; a 360 px no hay desplazamiento horizontal, los controles miden al menos 44 px y la auditoría de accesibilidad no deja hallazgos críticos.
- **SC-006**: Cada criterio de HU-035 tiene al menos una prueba automática o un paso de validación documentado.

## Assumptions

- Se parte de la spec 009, aplicada en local y en la nube de pruebas. El cambio de la autorización requiere una migración que traslade los datos existentes; la define el plan.
- Solo el owner asigna acudientes (MVP).
- El owner ve todos los acudientes de su academia; no hay restricción por grupo.
- Al copiar, el parentesco por defecto es el que el acudiente tiene con el hermano.
- La spec 4 (acudientes desde el enlace) registrará la autorización en la persona, conforme a DEC-39 ajustada.
- Durante el desarrollo y antes del commit se corren solo las pruebas de la spec.
- Fuera de alcance: acudientes desde el enlace y validación de vínculos (spec 4), ficha propia del acudiente, y fusionar acudientes duplicados con distinto celular.
