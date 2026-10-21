# Especificación de funcionalidad: Respuesta del acudiente y seguimiento

**Feature Branch**: `013-responses-tracking`

**Created**: 2026-10-21

**Status**: Draft

**Origen**: Spec 4a de la **Fase 2 — Negocio** (ADR-018, DEC-37 y DEC-46). Épicas **EP-06** (respuesta del acudiente), **EP-07** (seguimiento) y **EP-10** (acudientes): HU-009, HU-010, HU-011 y HU-040.

**Input**: Descripción del usuario: "responses-tracking: el acudiente abre el enlace de la convocatoria sin cuenta, se identifica la primera vez, responde Sí, Sí provisional o No y puede cambiar su respuesta; el owner sigue las respuestas, responde en nombre del acudiente y valida o rechaza vínculos y dispositivos. Maquetas de baja fidelidad antes de implementar."

> Esta spec cubre cuatro HU del mismo tramo del flujo (principio I) y referencia sus criterios en `docs/backlog/user-stories/`. Tiene **dos usuarios**: el **acudiente**, sin cuenta, desde el celular y desde el enlace que llegó al grupo de WhatsApp; y el **owner de la academia**, también desde el celular. Cierra el flujo principal del MVP. Decisiones: DEC-31, DEC-33, DEC-38, DEC-39, DEC-40, DEC-45 y DEC-46 (ADR-018). Flujo: `docs/product/call-up-flow.md`. Riesgo aceptado: SEC-03. Los avisos en la aplicación son la spec 014 (HU-041).

## Escenarios de usuario y pruebas *(mandatory)*

### Historia 1 - El acudiente se identifica la primera vez (Prioridad: P1)

Como acudiente, quiero abrir el enlace del grupo, elegir a mi jugador y decir quién soy, sin crear una cuenta.

**Motivo de prioridad**: Sin identificación no hay respuesta ni se sabe quién respondió.

**Prueba independiente**: Desde un celular nuevo, una persona abre el enlace de la lista de Sub-12, elige «Samuel V. · Samu», escribe su nombre, su celular y su parentesco, acepta la autorización de datos y llega a responder.

**Referencia**: CA-001, CA-002 y CA-004 de HU-009; DEC-31, DEC-39 y DEC-46.

**Escenarios de aceptación**:

1. **Dado** un enlace vigente y un dispositivo no reconocido, **cuando** se abre, **entonces** se cumple CA-001 de HU-009.
2. **Dado** el jugador elegido, **cuando** la persona se identifica, **entonces** se cumple CA-002 de HU-009, incluido el caso del celular que ya pertenece a un acudiente de la academia.
3. **Dado** que su jugador no está en la lista, **entonces** se cumple CA-004 de HU-009.

---

### Historia 2 - El acudiente responde y puede corregir (Prioridad: P1)

Como acudiente, quiero decir si mi jugador asiste, asiste de forma provisional o no asiste, y poder corregirlo antes del cierre.

**Motivo de prioridad**: Es la razón de ser del enlace y del flujo de la Fase 2.

**Prueba independiente**: El acudiente responde «Sí»; luego lo cambia a «No» con el motivo «Enfermedad o lesión» y ve cuántos cambios le quedan; la mamá, desde otro celular, también responde y vale la última.

**Referencia**: CA-001 a CA-006 de HU-010; DEC-33 y DEC-38.

**Escenarios de aceptación**:

1. **Dado** la convocatoria abierta, **cuando** responde, **entonces** se cumplen CA-001 y CA-002 de HU-010.
2. **Dado** una respuesta registrada, **cuando** la cambia, **entonces** se cumple CA-003 de HU-010, incluido el límite de 3 cambios.
3. **Dado** dos acudientes del mismo jugador, **cuando** ambos responden, **entonces** se cumple CA-004 de HU-010.
4. **Dado** un vínculo o dispositivo pendiente, **cuando** responde, **entonces** se cumple CA-005 de HU-010.
5. **Dado** el cierre, **entonces** se cumple CA-006 de HU-010.

---

### Historia 3 - El dispositivo recordado va directo a responder (Prioridad: P1)

Como acudiente, quiero que las siguientes veces el enlace me lleve directo a mis jugadores, sin volver a identificarme.

**Motivo de prioridad**: Las familias responden cada semana; repetir los datos cada vez haría que dejaran de usarlo.

**Prueba independiente**: El papá que se identificó en el entrenamiento del martes abre el enlace del partido del sábado y responde por sus dos hijos convocados sin escribir nada; luego suma a un tercer jugador con «¿Respondes por alguien más?».

**Referencia**: CA-003 de HU-009; DEC-31 y DEC-46.

**Escenarios de aceptación**:

1. **Dado** un dispositivo recordado con vínculos no rechazados, **cuando** abre el enlace, **entonces** se cumple CA-003 de HU-009.
2. **Dado** un dispositivo con su vínculo rechazado, **cuando** abre el enlace, **entonces** se le trata como dispositivo desconocido, sin anunciar el rechazo (DEC-46).

---

### Historia 4 - El enlace en situaciones especiales (Prioridad: P2)

Como acudiente, quiero entender qué pasa cuando la convocatoria ya cerró, la actividad se canceló, el enlace no existe o mi jugador ya no está convocado.

**Motivo de prioridad**: Evita confusión y llamadas a la academia; protege los datos cuando el enlace no es válido.

**Prueba independiente**: Se abren un enlace de una convocatoria cerrada, uno de una actividad cancelada, uno inventado y uno de una lista de la que quitaron al jugador del acudiente.

**Referencia**: CA-005 y CA-006 de HU-009.

**Escenarios de aceptación**:

1. **Dado** una convocatoria cerrada o una actividad cancelada, **entonces** se cumple CA-005 de HU-009 en modo lectura.
2. **Dado** un enlace inexistente, **entonces** se cumple CA-005 de HU-009 sin mostrar ningún dato.
3. **Dado** un jugador quitado de la convocatoria, **entonces** se cumple CA-006 de HU-009.

---

### Historia 5 - El owner sigue las respuestas (Prioridad: P1)

Como owner, quiero ver quién respondió, qué respondió y quién falta, y registrar la respuesta de quien me escribió por WhatsApp.

**Motivo de prioridad**: Sin seguimiento, las respuestas no le sirven al owner para organizar la actividad.

**Prueba independiente**: En la actividad del sábado, el owner ve «12 Sí · 2 Provisional · 1 No · 2 Sin respuesta», abre el historial de Juan, registra «No» para Mateo porque su papá le escribió y ve «12/17» en la lista de actividades.

**Referencia**: CA-001 a CA-007 de HU-011; DEC-46.

**Escenarios de aceptación**:

1. **Dado** una convocatoria con respuestas, **cuando** abre la actividad, **entonces** se cumplen CA-001 y CA-002 de HU-011.
2. **Dado** un jugador con varias respuestas, **cuando** lo toca, **entonces** se cumple CA-003 de HU-011.
3. **Dado** un convocado, **cuando** registra su respuesta en nombre del acudiente, **entonces** se cumple CA-005 de HU-011, también tras el cierre.
4. **Dado** la lista de actividades, **entonces** se cumple CA-006 de HU-011.
5. **Dado** el seguimiento abierto, **cuando** actualiza o vuelve a la pantalla, **entonces** se cumple CA-007 de HU-011.

---

### Historia 6 - El owner valida o rechaza a quien respondió (Prioridad: P1)

Como owner, quiero confirmar con un toque que quien respondió es acudiente del jugador, o rechazarlo.

**Motivo de prioridad**: Es la protección principal de la identificación sin códigos (SEC-03).

**Prueba independiente**: En el seguimiento aparece «Carlos Pérez (papá) · sin validar»; el owner lo valida. Otra respuesta, de un celular que coincide con la mamá registrada, muestra la coincidencia y también se valida. Una tercera se rechaza y deja de contar.

**Referencia**: CA-001 a CA-004 de HU-040 y CA-004 de HU-011; DEC-40 y DEC-46.

**Escenarios de aceptación**:

1. **Dado** un pendiente, **cuando** lo valida, **entonces** se cumple CA-001 de HU-040.
2. **Dado** un pendiente con celular coincidente, **entonces** se cumple CA-002 de HU-040.
3. **Dado** un pendiente, **cuando** lo rechaza, **entonces** se cumple CA-003 de HU-040.
4. **Dado** pendientes, **cuando** el owner abre el seguimiento o la ficha del jugador, **entonces** se cumple CA-004 de HU-040.

---

### Historia 7 - Pantallas revisadas y aprobadas (Prioridad: P2)

Como acudiente y como owner, quiero que estas pantallas sean claras en el celular, y el responsable quiere aprobar su diseño antes de que se construyan.

**Motivo de prioridad**: Principio XIII y aprobación de maquetas antes de implementar. La página del enlace es la primera pantalla que ven las familias.

**Prueba independiente**: El responsable aprueba las maquetas; al implementar, se revisan a 360 px y en escritorio, en claro y oscuro.

**Escenarios de aceptación**:

1. **Dado** el plan, **cuando** el responsable revisa las maquetas (página del enlace: elegir jugador, identificarse, responder, estados especiales; seguimiento con historial, respuesta del owner y validación), **entonces** las aprueba o pide cambios.
2. **Dado** las pantallas implementadas, **cuando** se revisan, **entonces** no hay hallazgos críticos ni altos, no hay desplazamiento horizontal a 360 px y los controles miden al menos 44 px.

---

### Edge Cases

- **Jugador en la lista equivocada**: el acudiente solo ve la lista del enlace que abrió; si su jugador está en otra lista de la misma convocatoria, no lo encuentra y se le indica escribir a la academia.
- **Dos personas eligen al mismo jugador desde dispositivos nuevos**: ambas quedan pendientes; las dos respuestas cuentan para el límite del jugador y vale la última.
- **Hermanos en listas distintas**: en cada enlace el acudiente solo ve a sus jugadores de esa lista.
- **Llave del dispositivo borrada** (otro navegador, modo privado, datos borrados): el dispositivo cuenta como nuevo y queda pendiente, aunque el vínculo ya estuviera validado.
- **Respuesta enviada justo al cierre**: si llega después de la hora de cierre, no se registra y se muestra que la convocatoria cerró.
- **Varias respuestas seguidas del mismo acudiente**: cada envío que cambia la respuesta cuenta como un cambio; reenviar la misma respuesta no cuenta.
- **El owner rechaza un vínculo cuya respuesta era la última**: vale la respuesta anterior que siga contando; si no hay, el jugador queda «Sin respuesta».
- **Jugador quitado y vuelto a sumar**: recupera su respuesta vigente y su historial.
- **Actividad cancelada y reactivada**: la convocatoria sigue cerrada (spec 012); el enlace queda en modo lectura.
- **Enlace inventado o de otra academia**: no revela si existe ni a quién pertenece.
- **Muchos convocados**: listas de 30 jugadores con nombres largos no rompen la página del enlace ni el seguimiento.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El enlace de una lista DEBE poder abrirse sin cuenta y mostrar solo: el nombre de la academia, los datos de la actividad y, para elegir por quién responder, los convocados de esa lista con nombre, inicial del apellido y apodo. NO DEBE mostrar apellidos completos, celulares, respuestas de otros ni datos de otras listas (DEC-31, DEC-46).
- **FR-002**: La primera vez, la persona DEBE identificarse con un nombre (1 a 120 caracteres; basta el nombre, sin apellidos; no se pide con «Soy el jugador»), celular colombiano (10 dígitos que empiezan por 3) y parentesco (mamá, papá, abuelo o abuela, otro, o «Soy el jugador»), y DEBE aceptar la autorización de datos vigente (DEC-39). Queda un vínculo y un dispositivo **pendientes de validar**. El formulario DEBE ser el mismo exista o no el celular en la academia, para no revelar qué celulares están registrados (DEC-46).
- **FR-003**: Si el celular coincide con un acudiente de la academia, NO DEBE crearse otra persona: el vínculo pendiente se asocia a ese acudiente, conservando su nombre registrado (DEC-46).
- **FR-004**: El dispositivo DEBE quedar recordado mediante una marca secreta generada por PlayerTech (no el celular). Un dispositivo recordado con vínculos no rechazados DEBE ir directo a responder por sus jugadores de esa lista y ofrecer «¿Respondes por alguien más?». Todo dispositivo nuevo DEBE quedar pendiente (DEC-31, DEC-40).
- **FR-005**: Las respuestas DEBEN ser **Sí**, **Sí, provisional** o **No**; para las dos últimas, un motivo opcional de la lista fija de DEC-38; *Otro* exige un texto de 1 a 200 caracteres.
- **FR-006**: Cada respuesta DEBE registrar quién la dio (acudiente u owner) y cuándo, con la hora del servidor. Vale la última; las anteriores forman el historial (DEC-33).
- **FR-007**: Los acudientes DEBEN poder cambiar la respuesta de un jugador hasta **3 veces por convocatoria** (sumando todos sus acudientes) y solo mientras la convocatoria esté abierta. Reenviar la misma respuesta no cuenta como cambio. Las reglas DEBEN garantizarse también fuera de la pantalla.
- **FR-008**: Con la convocatoria cerrada o la actividad cancelada, el enlace DEBE mostrar la actividad y las respuestas propias en modo lectura; un enlace inexistente DEBE mostrar «Esta convocatoria ya no está disponible» sin datos; un jugador quitado, «Ya no está convocado».
- **FR-009**: Un vínculo rechazado NO DEBE reconocerse: la persona se trata como dispositivo desconocido y no recibe ningún aviso de rechazo (DEC-46).
- **FR-010**: La sección «Convocatoria» de la actividad DEBE mostrar al owner los totales de Sí, Provisional, No y Sin respuesta de toda la convocatoria, los confirmados sobre los convocados de cada lista («12/17») y, por jugador, la última respuesta, quién la dio, la hora y el motivo, y DEBE dar acceso a su historial.
- **FR-011**: El owner DEBE poder registrar o cambiar la respuesta de cualquier convocado, también después del cierre; queda como «registrada por el owner» y no consume los cambios de los acudientes.
- **FR-012**: Las respuestas de vínculos o dispositivos pendientes DEBEN mostrarse como «sin validar», con «Validar» y «Rechazar» (con confirmación); si el celular coincide con un acudiente registrado, DEBE indicarse la coincidencia. Validar confirma vínculo y dispositivo; rechazar descarta el vínculo, su respuesta deja de contar y el dispositivo deja de reconocerse (DEC-40).
- **FR-013**: La ficha del jugador DEBE mostrar sus vínculos pendientes con «Validar» y «Rechazar».
- **FR-014**: La lista de actividades DEBE mostrar en las convocadas los confirmados (solo **Sí**) sobre los convocados («12/17»).
- **FR-015**: Un jugador quitado de la convocatoria DEBE salir del conteo y conservar su historial.
- **FR-016**: El seguimiento DEBE actualizarse al abrirse, al volver a la pantalla y con «Actualizar». La actualización en vivo queda fuera (DEC-46).
- **FR-017**: El acceso sin cuenta DEBE limitarse a lo que permite el enlace: no DEBE dar acceso a otras convocatorias, listas, academias ni a datos fuera de FR-001, y un enlace no válido NO DEBE revelar si existe. Toda escritura del owner DEBE depender de la autorización de la base de datos, sin acceso a datos de otra academia.
- **FR-018**: Cada operación exitosa DEBE confirmarse con un mensaje breve; los errores DEBEN mostrarse en español sin detalles técnicos, conservando lo escrito.
- **FR-019**: Antes de implementar, el plan DEBE incluir maquetas de baja fidelidad de la página del enlace (elegir jugador, identificarse, responder, estados especiales) y del seguimiento (resumen, historial, respuesta del owner, validación) para la aprobación del responsable. Los formularios del owner van en drawer.
- **FR-020**: Las pantallas DEBEN cumplir `DESIGN.md` y `ui.md`, con controles de al menos 44 px, sin desplazamiento horizontal a 360 px, en modo claro y oscuro, y pasar la revisión de experiencia y accesibilidad (principio XIII).
- **FR-021**: Cada criterio de las cuatro HU DEBE tener al menos una prueba automática o un paso de validación documentado.

### Key Entities

- **Acudiente**: la persona (nombre, celular), ya existente (spec 009); ahora también nace desde el enlace, con su autorización de datos.
- **Vínculo acudiente-jugador**: parentesco y estado (pendiente, validado o rechazado); ya existente; ahora nace pendiente desde el enlace.
- **Dispositivo**: la marca secreta de un navegador, asociada a un acudiente; pendiente, de confianza o revocado (DEC-40).
- **Respuesta**: de un jugador convocado, en una convocatoria: Sí, Sí provisional o No; motivo y texto de *Otro*; quién la dio (acudiente con su vínculo y dispositivo, u owner) y cuándo. La última vigente es la que cuenta; el resto es historial.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un acudiente que abre el enlace por primera vez se identifica y responde en menos de 1 minuto desde el celular.
- **SC-002**: Con el dispositivo recordado, un acudiente responde por sus jugadores en menos de 15 segundos, sin escribir datos.
- **SC-003**: El owner identifica a los convocados sin respuesta de una actividad en menos de 10 segundos desde que la abre.
- **SC-004**: El owner valida o rechaza a un acudiente pendiente con un solo toque más su confirmación.
- **SC-005**: Desde un enlace no se puede ver ni modificar ningún dato distinto de los de FR-001 ni de otra lista, convocatoria o academia, y un enlace inventado no revela nada (verificado con las academias del seed y con pruebas de base de datos).
- **SC-006**: El 100 % de las respuestas del seguimiento muestran quién respondió y cuándo, y ninguna supera el límite de 3 cambios de los acudientes.
- **SC-007**: El responsable aprueba las maquetas antes de implementar; a 360 px no hay desplazamiento horizontal, los controles miden al menos 44 px y la auditoría de accesibilidad no deja hallazgos críticos.
- **SC-008**: Cada criterio de las cuatro HU tiene al menos una prueba automática o un paso de validación documentado.

## Assumptions

- La convocatoria, sus listas, sus enlaces y la regla de cierre ya existen (spec 012, DEC-45). La página del enlace reemplaza «Pronto podrás responder aquí».
- Hacen falta tablas nuevas (respuestas con historial y dispositivos) y ajustes a acudientes y vínculos para que nazcan pendientes desde el enlace, con las reglas de ADR-012 y ADR-017. El acceso sin cuenta necesita una vía pública acotada por el enlace; su diseño lo decide el plan (consecuencias de ADR-018).
- La autorización de datos usa la Política de Tratamiento de Datos vigente, como el registro de acudientes por el owner (spec 009).
- La lista fija de motivos es la de DEC-38, igual para todas las academias.
- Los motivos y el texto de *Otro* solo los ve el owner de la academia.
- El límite de 3 cambios es por jugador y convocatoria, sumando a todos sus acudientes; la primera respuesta no es un cambio.
- La marca del dispositivo vive en el navegador; si se borra, el dispositivo cuenta como nuevo (supuesto aprobado el 2026-10-21).
- Solo el owner usa la parte privada (MVP).
- Durante el desarrollo y antes del commit se corren solo las pruebas de la spec.
- Fuera de alcance: avisos en la aplicación (HU-041, spec 014), actualización en vivo, notificaciones push, códigos por SMS o WhatsApp, asistencia, estadísticas y reportes.
