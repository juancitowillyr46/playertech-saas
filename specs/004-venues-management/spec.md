# Especificación de funcionalidad: Gestión de sedes

**Feature Branch**: `004-venues-management`

**Created**: 2026-10-17

**Status**: Draft

**Origen**: Épica **EP-12 — Sedes**: HU-029 (registrar sede), HU-030 (consultar sedes) y HU-031 (gestionar sede)

**Input**: Descripción del usuario: "venues-management: Gestión completa de sedes de la academia. Implementa la épica EP-12 con HU-029, HU-030 y HU-031, referenciando sus criterios de aceptación sin copiarlos. Parte de la pantalla modelo de Sedes de la spec 003 y sustituye la maqueta por la escritura real."

> Esta spec cubre tres HU de la misma épica (principio I) y referencia sus criterios de aceptación en `docs/backlog/user-stories/`. Su usuario es el **owner de la academia**, que trabaja sobre todo desde el celular. Parte de la pantalla modelo de Sedes de la spec 003 (`specs/003-design-system/`): el listado ya muestra datos reales y la escritura existe como maqueta; esta spec la vuelve real. La regla de datos ya está en la base de datos de la spec 001 (`specs/001-database-foundation/contracts/database-api.md`). El sistema visual está en `DESIGN.md` y el patrón de página de gestión, en `docs/architecture/ui.md`.

## Escenarios de usuario y pruebas *(mandatory)*

### Historia 1 - Registrar una sede (Prioridad: P1)

Como owner, quiero registrar las oficinas y los lugares de entrenamiento de mi academia, para tener todas sus sedes en un solo lugar.

**Motivo de prioridad**: Sin poder crear sedes, la academia solo tiene la sede principal que creó el registro; es la acción que da sentido a la gestión.

**Prueba independiente**: Con el owner de una academia, se registra una sede nueva desde el celular y se comprueba que aparece en el listado como activa y no principal; se intenta registrar otra sin nombre y otra con un nombre ya usado.

**Referencia**: CA-001 a CA-004 de HU-029.

**Escenarios de aceptación**:

1. **Dado** el formulario de nueva sede con un nombre válido, **cuando** el owner guarda, **entonces** se cumplen CA-001 y CA-002 de HU-029: la sede se crea activa, no principal, con el tipo «Lugar de entrenamiento» si no se cambió, aparece en el listado y se muestra un aviso de confirmación.
2. **Dado** el nombre vacío o solo con espacios, **cuando** el owner intenta guardar, **entonces** se cumple CA-003 de HU-029: el campo indica que el nombre es obligatorio y no se crea nada.
3. **Dado** un nombre que ya usa otra sede no eliminada de la academia, aunque cambien mayúsculas o espacios al inicio y al final, **cuando** el owner intenta guardar, **entonces** se cumple CA-004 de HU-029: el campo indica que el nombre ya está en uso y no se crea nada.
4. **Dado** el nombre de una sede eliminada, **cuando** el owner registra una sede nueva con ese nombre, **entonces** se crea sin problema (regla de HU-029).

---

### Historia 2 - Editar una sede (Prioridad: P1)

Como owner, quiero corregir los datos de una sede, para que reflejen la realidad de mi academia.

**Motivo de prioridad**: La sede principal se crea con un nombre genérico («Sede principal»); el owner necesita poder ponerle su nombre y dirección reales desde el primer día.

**Prueba independiente**: Se edita el nombre, la dirección y la ciudad de la sede principal y de otra sede, y se comprueba que el listado y el inicio muestran los datos nuevos.

**Referencia**: CA-001 de HU-031.

**Escenarios de aceptación**:

1. **Dado** el formulario de edición de una sede con sus datos actuales cargados, **cuando** el owner cambia datos y guarda, **entonces** se cumple CA-001 de HU-031: los datos se actualizan, el listado los refleja y se muestra un aviso de confirmación.
2. **Dado** la edición, **cuando** el nombre queda vacío o duplicado, **entonces** se aplican las mismas validaciones que al registrar y no se guarda nada.
3. **Dado** una sede, **cuando** el owner la edita sin cambiar su propio nombre, **entonces** ese nombre no se considera duplicado.
4. **Dado** el formulario con cambios sin guardar, **cuando** el owner intenta cerrarlo, **entonces** se le pide confirmar que descarta los cambios (patrón de `ui.md`).

---

### Historia 3 - Cambiar la sede principal (Prioridad: P2)

Como owner, quiero elegir cuál es la sede principal de mi academia, para que sea la de referencia.

**Motivo de prioridad**: La principal es la sede de referencia (DEC-05) y además la condición para poder desactivar o eliminar la anterior.

**Prueba independiente**: Se marca como principal una sede activa y se comprueba que la anterior deja de serlo; se intenta marcar una inactiva.

**Referencia**: CA-006 y CA-007 de HU-031.

**Escenarios de aceptación**:

1. **Dado** una sede activa que no es la principal, **cuando** el owner la marca como principal, **entonces** se cumple CA-006 de HU-031: pasa a ser la principal, la anterior deja de serlo, el listado lo refleja en el mismo momento y se muestra un aviso.
2. **Dado** una sede inactiva, **cuando** el owner busca marcarla como principal, **entonces** se cumple CA-007 de HU-031: la acción no está disponible y se le indica que primero debe reactivarla.
3. **Dado** cualquier momento, **cuando** se consulta la academia, **entonces** existe exactamente una sede principal y está activa (regla de HU-031).

---

### Historia 4 - Desactivar y reactivar una sede (Prioridad: P2)

Como owner, quiero desactivar una sede que dejé de usar sin perder su información, y reactivarla si vuelvo a usarla.

**Motivo de prioridad**: Es la forma reversible de retirar una sede (DEC-26) y prepara la Fase 2, donde una sede inactiva no se podrá elegir para actividades.

**Prueba independiente**: Se desactiva una sede no principal, se comprueba que sigue en el listado como inactiva con sus datos, y se reactiva; se intenta desactivar la principal.

**Referencia**: CA-002, CA-003 y CA-005 de HU-031.

**Escenarios de aceptación**:

1. **Dado** una sede activa que no es la principal, **cuando** el owner la desactiva, **entonces** se cumple CA-002 de HU-031: queda inactiva, sigue visible con sus datos y se muestra un aviso.
2. **Dado** una sede inactiva, **cuando** el owner la reactiva, **entonces** se cumple CA-003 de HU-031 y se muestra un aviso.
3. **Dado** la sede principal, **cuando** el owner busca desactivarla, **entonces** se cumple CA-005 de HU-031: la acción no está disponible y se le indica que primero debe marcar otra sede como principal.

---

### Historia 5 - Eliminar una sede (Prioridad: P3)

Como owner, quiero eliminar una sede que registré por error o que ya no existe, para que deje de aparecer.

**Motivo de prioridad**: Es menos frecuente que desactivar y no se revierte desde la interfaz, por eso exige confirmación.

**Prueba independiente**: Se elimina una sede no principal confirmando la acción, se comprueba que desaparece del listado y que su nombre puede reutilizarse; se cancela la confirmación y se intenta eliminar la principal.

**Referencia**: CA-004 y CA-005 de HU-031.

**Escenarios de aceptación**:

1. **Dado** una sede que no es la principal, **cuando** el owner pide eliminarla, **entonces** se le pide una confirmación explícita que nombra la sede y explica que no se puede deshacer desde PlayerTech.
2. **Dado** esa confirmación, **cuando** el owner confirma, **entonces** se cumple CA-004 de HU-031: la sede deja de aparecer, su información se conserva internamente y se muestra un aviso.
3. **Dado** esa confirmación, **cuando** el owner cancela, **entonces** no cambia nada.
4. **Dado** la sede principal, **cuando** el owner busca eliminarla, **entonces** se cumple CA-005 de HU-031: la acción no está disponible y se le indica que primero debe marcar otra sede como principal.

---

### Historia 6 - Consultar las sedes (Prioridad: P1)

Como owner, quiero ver las sedes de mi academia con su tipo, ciudad y estado, para conocer los lugares registrados.

**Motivo de prioridad**: Es la base de las demás historias; la versión de lectura ya existe (spec 003) y aquí se verifica formalmente.

**Prueba independiente**: Con dos academias del seed, se consulta el listado de cada owner en el celular y en escritorio, con sedes activas, inactivas y eliminadas.

**Referencia**: CA-001 a CA-005 de HU-030.

**Escenarios de aceptación**:

1. **Dado** el owner de una academia, **cuando** abre Sedes, **entonces** se cumplen CA-001 a CA-004 de HU-030: ve sus sedes no eliminadas con nombre, tipo, ciudad y estado, la principal identificada y las inactivas marcadas.
2. **Dado** otra academia en PlayerTech, **cuando** el owner consulta sus sedes, **entonces** se cumple CA-005 de HU-030: solo ve las de su academia.

---

### Edge Cases

- **Dos pestañas o dispositivos**: si la sede cambió o se eliminó en otro lugar entre que se abrió el formulario y se guardó, se informa en español y el listado se actualiza; no se muestra un error técnico.
- **Nombre duplicado que solo descubre el servidor** (por ejemplo, otra pestaña creó el mismo nombre): se muestra el mismo mensaje de nombre en uso, junto al campo.
- **Espacios al inicio o al final**: se ignoran al validar y al guardar el nombre, la dirección, la ciudad y las indicaciones; un campo opcional que queda vacío se guarda como vacío.
- **Sin conexión o fallo del servidor al guardar**: el formulario conserva lo escrito, muestra un mensaje en español y permite reintentar.
- **Doble toque en Guardar o en una acción**: no se crea ni se aplica dos veces.
- **Única sede de la academia** (la principal): no puede desactivarse ni eliminarse; las acciones lo explican.
- **Sede principal inactiva**: no puede ocurrir; si la base de datos rechazara un cambio por esa regla, se explica en español.
- **Textos largos**: nombres y direcciones largos no rompen el listado, la tabla ni el formulario.
- **Usuario que no es owner** (cuando existan otros roles): la base de datos rechaza la escritura; la interfaz lo explica sin detalles técnicos.

## Requirements *(mandatory)*

### Functional Requirements

**Registrar y editar (HU-029, HU-031)**

- **FR-001**: El owner DEBE poder registrar una sede con nombre (obligatorio), tipo (oficina o lugar de entrenamiento; por defecto lugar de entrenamiento), dirección, ciudad e indicaciones (opcionales) (DEC-23).
- **FR-002**: Una sede nueva DEBE crearse activa y no principal.
- **FR-003**: El owner DEBE poder editar todos los datos de una sede, incluida la principal; el formulario DEBE abrirse con los datos actuales completos.
- **FR-004**: El nombre DEBE ser obligatorio y único entre las sedes no eliminadas de la academia, sin distinguir mayúsculas ni espacios al inicio y al final; la sede que se edita no cuenta como duplicado de sí misma.
- **FR-005**: Las validaciones DEBEN mostrarse junto al campo, en español, antes de enviar cuando sea posible; las que solo detecta el servidor DEBEN mostrarse en el mismo lugar con el mismo mensaje.
- **FR-006**: Los nombres de sedes eliminadas DEBEN poder reutilizarse.
- **FR-007**: Cerrar el formulario con cambios sin guardar DEBE pedir confirmación; sin cambios, DEBE cerrarse sin preguntar.

**Sede principal (HU-031)**

- **FR-008**: El owner DEBE poder marcar como principal una sede activa que no lo sea; la anterior DEBE dejar de serlo en la misma operación (DEC-25).
- **FR-009**: La acción de marcar como principal NO DEBE estar disponible para sedes inactivas; DEBE indicar que primero hay que reactivarla.
- **FR-010**: La academia DEBE tener siempre exactamente una sede principal activa.

**Desactivar, reactivar y eliminar (HU-031)**

- **FR-011**: El owner DEBE poder desactivar una sede activa no principal y reactivar una inactiva; desactivar conserva todos sus datos (DEC-26).
- **FR-012**: El owner DEBE poder eliminar una sede no principal tras una confirmación explícita que nombre la sede; la eliminación es un borrado lógico que no se revierte desde la interfaz (DEC-27).
- **FR-013**: Desactivar y eliminar NO DEBEN estar disponibles para la sede principal; cada acción DEBE indicar que primero hay que marcar otra sede como principal.

**Experiencia común**

- **FR-014**: Cada operación exitosa DEBE mostrar un aviso breve en español y reflejarse en el listado sin recargar la página.
- **FR-015**: Mientras una operación está en curso, su botón DEBE mostrar estado de carga e impedir repeticiones.
- **FR-016**: Ante un fallo, DEBE mostrarse un mensaje en español sin detalles técnicos; el formulario DEBE conservar lo escrito.
- **FR-017**: Las acciones no disponibles DEBEN seguir visibles en el menú de la sede, deshabilitadas, con el motivo en texto.
- **FR-018**: Las pantallas y el formulario DEBEN cumplir `DESIGN.md` y el patrón de página de gestión de `ui.md` (filas regladas en el celular, tabla en escritorio, formulario a pantalla completa en el celular), con controles de al menos 44 px y sin desplazamiento horizontal a 360 px.
- **FR-019**: Las pantallas DEBEN pasar la revisión de experiencia y accesibilidad (principio XIII).

**Consulta (HU-030)**

- **FR-020**: El listado DEBE cumplir CA-001 a CA-005 de HU-030 (ya construido en la spec 003); esta spec lo verifica con pruebas que cubran sedes activas, inactivas y eliminadas y el aislamiento entre academias.

**Seguridad**

- **FR-021**: Toda escritura DEBE depender de la autorización de la base de datos (owner de la academia, aislamiento entre academias). El usuario nunca elige la academia: sale del contexto de su membresía y la base de datos la valida.

### Key Entities

- **Sede**: nombre, tipo, dirección, ciudad, indicaciones, principal (sí/no), activa (sí/no) y eliminada (borrado lógico). Pertenece a una academia.
- **Sede principal**: la sede de referencia de la academia; exactamente una, siempre activa.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un owner registra una sede nueva desde el celular en menos de 1 minuto, desde tocar «Nueva sede» hasta ver el aviso.
- **SC-002**: El 100 % de los intentos de crear o editar con nombre vacío o duplicado se rechazan con el mensaje junto al campo, sin crear ni modificar datos.
- **SC-003**: En ninguna secuencia de operaciones la academia queda sin sede principal, con dos principales o con una principal inactiva.
- **SC-004**: El 100 % de las operaciones exitosas se reflejan en el listado sin recargar y muestran un aviso.
- **SC-005**: Ningún owner puede ver ni modificar sedes de otra academia (verificado con las dos academias del seed).
- **SC-006**: A 360 px de ancho no hay desplazamiento horizontal y todos los controles miden al menos 44 px; la auditoría de accesibilidad no deja hallazgos críticos.
- **SC-007**: Las pruebas automáticas existentes siguen en verde y cada criterio de aceptación de HU-029, HU-030 y HU-031 tiene al menos una prueba automática o un paso de validación documentado.

## Assumptions

- La base de datos de la spec 001 ya impone las reglas críticas (nombre único por academia sin distinguir mayúsculas, una sola principal activa, borrado lógico, escritura solo del owner); no se esperan migraciones nuevas salvo que el plan detecte un hueco.
- Desactivar no pide confirmación porque es reversible; eliminar sí (regla de HU-031).
- Los avisos de resultado son breves y no bloquean; no se ofrece «deshacer».
- El único rol con escritura en el MVP es el owner; otros roles llegarán más adelante.
- La sección «Completa tu academia» del inicio no cambia en esta spec (HU-032); sí refleja los datos editados de la sede principal en el resumen.
- Quedan fuera de alcance: restaurar sedes eliminadas, mapas o geolocalización, horarios de sede, límites por plan y la reasignación de actividades o jugadores al desactivar (Fase 2).
