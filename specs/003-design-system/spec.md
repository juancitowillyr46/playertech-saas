# Especificación de funcionalidad: Sistema de diseño PlayerTech

**Feature Branch**: `003-design-system`

**Created**: 2026-10-17

**Status**: Draft

**Origen**: Habilitador técnico **T-01** (`docs/backlog/enablers/T-01-design-system.md`)

**Input**: Descripción del usuario: "design-system: Sistema de diseño PlayerTech. Implementa el habilitador técnico T-01 y sus criterios de aceptación CA-001 a CA-007 (referenciarlos, no copiarlos)."

> Esta spec proviene de un habilitador técnico (principio I de la Constitución). Sus usuarios son el **responsable de producto**, que aprueba el brief y elige la dirección visual; el **equipo de desarrollo**, que construirá cada HU sobre el sistema resultante; y, como beneficiario final, el **owner de la academia**, que usa PlayerTech desde el celular. El brief de marca (usuario, personalidad, referencias y restricciones) está en T-01 y no se repite aquí. Los patrones de pantalla de partida están en `docs/architecture/ui.md`; las decisiones que se revisan son FE-06 (ADR-015) y ADR-003. Parte de las pantallas de acceso básicas de la spec 002.

## Escenarios de usuario y pruebas *(mandatory)*

### Historia 1 - Brief de producto aprobado (Prioridad: P1)

Como responsable de producto, necesito un brief de producto y marca que recoja el usuario, la personalidad, las referencias y las restricciones de PlayerTech, para que todas las decisiones visuales posteriores partan de una base que yo he aprobado.

**Motivo de prioridad**: Sin brief aprobado, cualquier propuesta visual es arbitraria. Es el punto de partida de todo T-01.

**Prueba independiente**: Se genera el brief, el responsable de producto lo revisa contra el brief de T-01 y lo aprueba o pide cambios.

**Referencia**: CA-001 de T-01.

**Escenarios de aceptación**:

1. **Dado** el brief de marca de T-01, **cuando** se genera el brief de producto, **entonces** refleja el usuario principal, la personalidad, las referencias y las restricciones, y enlaza a la visión del producto en lugar de repetirla.
2. **Dado** el brief generado, **cuando** el responsable de producto lo revisa, **entonces** queda registrada su aprobación o se ajusta hasta obtenerla antes de avanzar a la dirección visual.

---

### Historia 2 - Dirección visual elegida (Prioridad: P1)

Como responsable de producto, necesito ver entre 2 y 3 direcciones visuales distintas aplicadas a pantallas reales de PlayerTech y elegir una, para que la identidad sea una decisión consciente y no el aspecto por defecto de la plantilla.

**Motivo de prioridad**: La dirección elegida determina los tokens, el chasis, las pantallas modelo y los correos.

**Prueba independiente**: Se presentan las direcciones con muestras comparables (mismas pantallas, modo claro y oscuro, vista de celular y de escritorio); el responsable de producto elige una y queda registrada.

**Referencia**: CA-002 de T-01.

**Escenarios de aceptación**:

1. **Dado** el brief aprobado, **cuando** se presentan las direcciones, **entonces** son entre 2 y 3, claramente distintas entre sí, y cada una muestra paleta, tipografía, principios y su aplicación a al menos el inicio de sesión y una pantalla interna, en celular y en escritorio.
2. **Dado** las direcciones presentadas, **cuando** el responsable de producto elige una (o una combinación explícita), **entonces** queda registrada en el sistema visual con su paleta, tipografía y principios.
3. **Dado** cualquier dirección propuesta, **cuando** se revisa, **entonces** se puede construir solo con la base adoptada (componentes de PrimeNG, layout adoptado y utilidades de Tailwind), sin componentes que sustituyan a PrimeNG.

---

### Historia 3 - Identidad aplicada a toda la aplicación por tokens (Prioridad: P1)

Como owner de una academia, necesito que toda la aplicación (pantallas de acceso, barra superior, menú, formularios, mensajes y estados) tenga la identidad de PlayerTech, en modo claro y oscuro, para percibirla como un producto profesional y no como una plantilla genérica.

**Motivo de prioridad**: Es el núcleo del habilitador: que cualquier pantalla futura herede la identidad sin esfuerzo adicional.

**Prueba independiente**: Se recorren todas las pantallas existentes en ambos modos y se comprueba que adoptan la identidad elegida; se revisa que no hay estilos que sobrescriban los internos de los componentes.

**Referencia**: CA-003 y CA-006 de T-01.

**Escenarios de aceptación**:

1. **Dado** la dirección elegida, **cuando** se aplica, **entonces** los colores, superficies, tipografía, radios, foco y densidad de todos los componentes cambian desde un único conjunto de tokens, sin estilos que sobrescriban los internos de los componentes.
2. **Dado** cualquier pantalla existente, **cuando** se cambia entre modo claro y oscuro, **entonces** ambos mantienen la identidad y cumplen los mínimos de contraste.
3. **Dado** un componente nuevo de la biblioteca que aún no se usa, **cuando** se añade en una HU futura, **entonces** adopta la identidad sin ajustes adicionales.
4. **Dado** la marca, **cuando** se muestra, **entonces** es una marca tipográfica provisional coherente con la dirección (sin logo definitivo).

---

### Historia 4 - Chasis cómodo en el celular (Prioridad: P2)

Como owner que trabaja desde el celular, necesito que la barra superior, el menú, el menú de usuario y el encabezado de cada página sean cómodos de usar con el pulgar y me digan siempre dónde estoy, para moverme por la aplicación sin esfuerzo.

**Motivo de prioridad**: El chasis acompaña a todas las pantallas; si es incómodo en el celular, toda la aplicación lo es.

**Prueba independiente**: En un celular de 360 px de ancho, se navega entre todas las secciones, se abre y cierra el menú, se usa el menú de usuario y se comprueba el encabezado de cada página.

**Referencia**: CA-004 de T-01; arquitectura de información de `ui.md`.

**Escenarios de aceptación**:

1. **Dado** un celular de 360 px, **cuando** el owner navega, **entonces** usa la barra de navegación inferior con el pulgar, sin abrir menús, y la barra indica la sección actual.
2. **Dado** cualquier página interna, **cuando** se muestra, **entonces** tiene un encabezado con título, descripción breve opcional y, si aplica, la acción principal, siempre al alcance en el celular.
3. **Dado** la barra superior, **cuando** se muestra en el celular, **entonces** es compacta, muestra la identidad de la academia (logo o iniciales y nombre legible) y el menú de usuario, con áreas táctiles de al menos 44 px; el cambio de modo está dentro del menú de usuario.

---

### Historia 5 - Pantallas modelo como referencia de patrones (Prioridad: P2)

Como equipo de desarrollo, necesito cuatro pantallas modelo terminadas (inicio de sesión, registro, sedes e inicio) que muestren cómo se aplica el sistema a cada patrón de `ui.md`, para construir las siguientes HU copiando un patrón probado en lugar de inventar uno.

**Motivo de prioridad**: Las pantallas modelo convierten los tokens en patrones concretos y son la evidencia de que el sistema funciona en el celular.

**Prueba independiente**: Cada pantalla modelo se revisa en 360 px y en escritorio, en ambos modos, y pasa la revisión de experiencia y accesibilidad (crítica, auditoría y pulido).

**Referencia**: CA-004 y CA-005 de T-01; patrones de `ui.md`; HU-001, HU-014, HU-030 y HU-032 como pantallas de origen.

**Escenarios de aceptación**:

1. **Dado** el inicio de sesión y el registro de la spec 002, **cuando** se rediseñan, **entonces** mantienen todo su comportamiento y pruebas actuales, aplican la identidad, y mejoran textos, orden de campos, mensajes y uso en el celular según las observaciones del responsable de producto.
2. **Dado** la pantalla modelo de sedes, **cuando** se muestra, **entonces** aplica el patrón de página de gestión (encabezado, búsqueda, filtro, listado, estado, acciones por fila y drawer de creación y edición), con su variante de celular. La confirmación se demuestra al cerrar el drawer con cambios sin guardar; la confirmación de eliminar y el aviso tras guardar quedan definidos en el sistema visual y se usan por primera vez en HU-031.
3. **Dado** la pantalla modelo de inicio, **cuando** se muestra, **entonces** aplica el patrón de inicio con tareas pendientes, incluida la tarjeta "Completa tu academia".
4. **Dado** el alcance de las pantallas modelo de sedes e inicio, **cuando** se construyen, **entonces** viven en sus rutas reales y muestran, solo en lectura, los datos reales de la academia del owner: el listado de sedes (adelanta CA-001 a CA-003 de HU-030) y el resumen del inicio con nombre, logo si existe, plan y sede principal (adelanta CA-001 de HU-032). Las acciones de escritura (crear, editar, desactivar y eliminar sedes) y el progreso real de "Completa tu academia" se muestran como maqueta visual sin guardar ni calcular nada, y se completan en HU-029, HU-031 y HU-032.
5. **Dado** cualquier pantalla modelo, **cuando** se ejecuta la auditoría de accesibilidad, **entonces** no quedan hallazgos críticos de contraste, foco de teclado ni etiquetas de formulario.

---

### Historia 6 - Patrones móviles para listados y formularios laterales (Prioridad: P2)

Como owner que gestiona su academia desde el celular, necesito que los listados se vean como tarjetas y que los formularios laterales ocupen toda la pantalla, para leer y editar sin desplazarme de lado ni hacer zoom.

**Motivo de prioridad**: Todas las gestiones de la Fase 1 y de la Fase 2 (sedes, jugadores, actividades…) dependen de este patrón.

**Prueba independiente**: En la pantalla modelo de sedes, a 360 px, se consulta el listado y se abre el formulario de creación y edición.

**Referencia**: CA-004 de T-01; patrón de página de gestión de `ui.md`.

**Escenarios de aceptación**:

1. **Dado** un listado en una pantalla de 360 px, **cuando** se muestra, **entonces** cada registro aparece como una tarjeta con sus datos clave, su estado y sus acciones, sin desplazamiento horizontal.
2. **Dado** el formulario lateral de creación o edición, **cuando** se abre en el celular, **entonces** ocupa toda la pantalla, con las acciones de guardar y cancelar siempre visibles.
3. **Dado** el mismo listado en escritorio, **cuando** se muestra, **entonces** se presenta como tabla con búsqueda, filtro, ordenamiento y paginación.

---

### Historia 7 - Correos de autenticación con la identidad de PlayerTech (Prioridad: P3)

Como owner que se registra o recupera su contraseña, necesito recibir un correo en español, con la marca de PlayerTech y un botón claro, para confiar en el mensaje y completar el proceso desde el celular.

**Motivo de prioridad**: Hoy los correos llegan en inglés y sin marca; no bloquean el desarrollo, pero deben estar listos antes del piloto (roadmap, "Antes del piloto").

**Prueba independiente**: En el entorno local, se registra una cuenta y se solicita una recuperación; ambos correos se revisan en el visor de correo local, en ancho de celular y de escritorio, y se sigue su botón hasta completar el proceso.

**Referencia**: CA-007 de T-01.

**Escenarios de aceptación**:

1. **Dado** un registro, **cuando** llega el correo de confirmación, **entonces** su asunto y texto están en español de Colombia, llevan la marca de PlayerTech y su botón completa la verificación.
2. **Dado** una solicitud de recuperación, **cuando** llega el correo, **entonces** su asunto y texto están en español de Colombia, explican qué hacer si la persona no lo solicitó, y su botón lleva a establecer la nueva contraseña.
3. **Dado** cualquiera de los dos correos, **cuando** se abre en un cliente de correo móvil o con las imágenes bloqueadas, **entonces** se lee correctamente y el enlace también aparece como texto.

---

### Edge Cases

- **El responsable de producto no elige ninguna dirección** o pide mezclar dos: se itera una vez sobre la combinación pedida; la elección explícita queda registrada antes de aplicar tokens.
- **Un color de la dirección elegida no cumple contraste** en algún modo: se ajusta el tono (no la dirección) hasta cumplir, y el ajuste se documenta en el sistema visual.
- **La tipografía elegida no carga** (red lenta o bloqueada): la interfaz se muestra con una tipografía de respaldo similar, sin saltos de diseño que oculten contenido.
- **Textos largos** (nombre de academia o de sede muy largos): se recortan o ajustan sin romper la barra superior, las tarjetas ni la tabla, y el texto completo sigue disponible.
- **Preferencia de modo del sistema**: sin elección guardada, se respeta la del dispositivo; una elección explícita del owner prevalece.
- **Movimiento reducido**: si el dispositivo lo pide, las transiciones se reducen o eliminan.
- **Pantallas de acceso sin layout de aplicación** (acceso denegado, suspendida, callback, 404): también adoptan la identidad.
- **Demos de referencia**: no se modifican para implementar la identidad; pueden verse distintas a PlayerTech y eso es aceptable.
- **Cliente de correo que ignora estilos**: el correo sigue siendo legible y el botón degrada a enlace.

## Requirements *(mandatory)*

### Functional Requirements

**Brief y dirección visual**

- **FR-001**: El proyecto DEBE contar con un brief de producto y marca derivado del brief de T-01, que enlace a la visión del producto en lugar de repetirla, y aprobado explícitamente por el responsable de producto (CA-001 de T-01).
- **FR-002**: Se DEBEN presentar entre 2 y 3 direcciones visuales distintas, cada una con paleta, tipografía, principios y su aplicación al inicio de sesión y a una pantalla interna, en celular y escritorio, y en modo claro y oscuro.
- **FR-003**: La dirección elegida DEBE quedar registrada en el sistema visual del proyecto (paleta, tipografía, principios, reglas de uso) antes de aplicarse (CA-002 de T-01).
- **FR-004**: Ninguna dirección DEBE requerir nuevas bibliotecas de estilos o de componentes ni componentes que sustituyan a los de la biblioteca adoptada.

**Tokens y tema**

- **FR-005**: La identidad DEBE aplicarse desde un único conjunto de tokens de tema que cubra paleta, superficies, tipografía, radios, foco, densidad y ajustes de los componentes usados (botón, campos de formulario, tabla, drawer, tarjeta, menú, mensajes, avisos y etiquetas de estado) (CA-003 de T-01).
- **FR-006**: NO DEBE existir ningún estilo que sobrescriba los internos de los componentes de la biblioteca ni uso de `!important`; todo cambio visual entra por los tres sitios definidos en `AGENTS.md`.
- **FR-007**: Los modos claro y oscuro DEBEN mantener la identidad y cumplir contraste mínimo AA: 4,5:1 para texto normal y 3:1 para texto grande, iconos y bordes de controles (CA-006 de T-01).
- **FR-008**: El foco de teclado DEBE ser visible y consistente en todos los elementos interactivos, en ambos modos.
- **FR-009**: Sin una elección guardada, el modo DEBE seguir la preferencia del dispositivo; la elección del owner DEBE prevalecer y conservarse.
- **FR-010**: La marca DEBE mostrarse como marca tipográfica provisional definida en el sistema visual.
- **FR-011**: Las transiciones DEBEN respetar la preferencia de movimiento reducido del dispositivo.

**Chasis**

- **FR-012**: La barra superior, el menú lateral, el menú de usuario y el encabezado de página DEBEN aplicar la identidad y la arquitectura de información de `ui.md`.
- **FR-012a**: En el celular (por debajo de 992 px) la aplicación DEBE comportarse como una app: barra superior compacta con la identidad de la academia (logo o iniciales y nombre) y el menú de usuario; **navegación inferior** con los destinos principales; sin menú hamburguesa; la marca PlayerTech no se repite en las pantallas internas (sí en el acceso, en escritorio y en los correos). El cambio de modo claro/oscuro vive en el menú de usuario. En escritorio se mantiene el menú lateral con la marca.
- **FR-013**: En pantallas de 360 px, todos los controles del chasis DEBEN tener áreas táctiles de al menos 44 px, la navegación DEBE indicar la sección actual (no solo por color) y no DEBE haber desplazamiento horizontal (CA-004 de T-01).
- **FR-014**: Toda página interna DEBE usar un encabezado común con título, descripción opcional y acción principal opcional.

**Pantallas modelo y patrones**

- **FR-015**: El inicio de sesión y el registro DEBEN rediseñarse con la identidad, conservando su comportamiento, sus validaciones y sus pruebas automáticas, e incorporando las mejoras de experiencia acordadas con el responsable de producto.
- **FR-016**: Las demás pantallas de acceso (verificación de correo, recuperación, nueva contraseña, acceso denegado, suspendida, retorno del enlace) y las páginas de estado (no encontrada, error de contexto) DEBEN adoptar la identidad.
- **FR-017**: DEBE existir una pantalla modelo de sedes que aplique el patrón de página de gestión de `ui.md` completo, incluida su variante móvil.
- **FR-018**: DEBE existir una pantalla modelo de inicio que aplique el patrón de inicio con tareas pendientes, incluida la tarjeta "Completa tu academia".
- **FR-018a**: Las pantallas modelo de sedes e inicio DEBEN vivir en sus rutas reales y leer solo los datos de la academia del owner, respetando el aislamiento entre academias. Sus acciones de escritura y el progreso de "Completa tu academia" DEBEN presentarse como maqueta visual que no guarda datos, de forma que el owner entienda que aún no están disponibles (por ejemplo, el botón de guardar del drawer deshabilitado con un aviso "Disponible próximamente"). Cerrar el drawer con cambios sin guardar DEBE pedir confirmación, como establece el patrón de `ui.md`.
- **FR-019**: En pantallas de 360 px, los listados DEBEN presentarse como tarjetas y los formularios laterales DEBEN ocupar la pantalla completa con las acciones siempre visibles; en escritorio, el listado DEBE presentarse como tabla.
- **FR-020**: Los estados de carga, vacío y error DEBEN tener un tratamiento visual definido en el sistema visual y aplicado en las pantallas modelo.
- **FR-021**: Cada pantalla modelo DEBE pasar la revisión de experiencia y accesibilidad (crítica, auditoría y pulido) sin hallazgos críticos de contraste, foco de teclado ni etiquetas (CA-005 de T-01; principio XIII).
- **FR-022**: Los textos de todas las pantallas DEBEN estar en español de Colombia y usar el vocabulario del glosario.

**Correos**

- **FR-023**: Los correos de confirmación de cuenta y de recuperación de contraseña DEBEN tener asunto y texto en español de Colombia, la marca de PlayerTech y un botón de acción, con el enlace también visible como texto (CA-007 de T-01).
- **FR-024**: Los correos DEBEN ser legibles en clientes de correo móviles y con las imágenes bloqueadas, y verificarse en el entorno local.
- **FR-025**: El correo de recuperación DEBE indicar qué hacer si la persona no lo solicitó.

**Documentación y decisiones**

- **FR-026**: El sistema visual (tokens, tipografía, color, reglas de estilo y de uso) DEBE quedar documentado en una única fuente; los patrones de pantalla y la arquitectura de información, en `ui.md`, actualizado con las pantallas modelo como referencia.
- **FR-027**: Las decisiones revisadas (FE-06 y ADR-003) DEBEN actualizarse en el registro de decisiones cuando se elija la dirección.

### Key Entities

- **Brief de producto**: usuario principal, personalidad, referencias, restricciones y tono; aprobado por el responsable de producto.
- **Dirección visual**: propuesta con nombre, paleta, tipografía, principios y muestras; una sola queda elegida.
- **Sistema visual**: tokens (color, superficie, tipografía, radios, foco, densidad), reglas de uso y marca tipográfica; fuente única del aspecto de PlayerTech.
- **Pantalla modelo**: pantalla terminada que ejemplifica un patrón de `ui.md` y sirve de referencia para las HU.
- **Plantilla de correo**: asunto, texto y botón de acción de un correo de autenticación.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El responsable de producto aprueba el brief y elige una dirección visual en, como máximo, dos rondas de revisión cada uno.
- **SC-002**: El 100 % de las pantallas existentes adoptan la identidad en ambos modos, y una revisión del código encuentra cero estilos que sobrescriban los internos de los componentes y cero usos de `!important`.
- **SC-003**: A 360 px de ancho, las cuatro pantallas modelo y el chasis no presentan desplazamiento horizontal y el 100 % de sus controles miden al menos 44 px.
- **SC-004**: El 100 % de los textos y controles de las pantallas modelo cumplen el contraste AA en ambos modos, y la auditoría de accesibilidad deja cero hallazgos críticos.
- **SC-005**: Las pruebas automáticas existentes siguen pasando al 100 % tras el rediseño, sin perder cobertura de comportamiento.
- **SC-006**: Una persona que no ha visto antes la pantalla completa el registro en su celular, sin ayuda, en menos de 3 minutos, cronometrados desde que abre el registro hasta que llega al inicio e incluida la verificación del correo.
- **SC-007**: Los dos correos de autenticación se leen correctamente en ancho de celular y con imágenes bloqueadas, y su botón completa el proceso en el 100 % de las pruebas locales.
- **SC-008**: Una persona del equipo puede construir una pantalla nueva de gestión siguiendo solo la pantalla modelo de sedes y la documentación, sin decisiones visuales nuevas.

## Clarifications

### Session 2026-10-17

- Q: ¿Dónde y con qué datos viven las pantallas modelo de sedes e inicio? → A: En sus rutas reales, con datos reales solo de lectura; escritura y progreso como maqueta visual (Historia 5, escenario 4; FR-018a).
- Q: ¿Qué patrón de navegación usa la aplicación en el celular, tras probarla en el dispositivo? → A: App con barra inferior: barra superior compacta con la academia y el menú de usuario, navegación inferior con los destinos principales, modo claro/oscuro en el menú de usuario y acción principal flotante sobre la barra; escritorio sin cambios (FR-012a, FR-013).

## Assumptions

- El brief de marca de T-01 es suficiente para generar el brief de producto; el responsable de producto aporta ajustes durante la aprobación.
- Las direcciones visuales se presentan como muestras navegables o imágenes comparables; el formato concreto se decide en el plan.
- La tipografía elegida es de libre uso; su forma de carga se decide en el plan, priorizando que la interfaz funcione si no carga.
- Las observaciones de experiencia que el responsable de producto anotó al probar el flujo completo se recogen durante el rediseño de las pantallas de acceso.
- Los correos se diseñan en modo claro; los clientes que fuerzan modo oscuro los adaptan por su cuenta, y se verifica que sigan siendo legibles.
- Los correos se verifican en el entorno local; su aplicación en la nube con el SMTP real pertenece a "Antes del piloto" (roadmap).
- Las demos de SakaiNG siguen disponibles solo en desarrollo y no se adaptan a la identidad.
- Quedan fuera de alcance: logo definitivo, ilustraciones o fotografía propias, landing comercial, componentes propios que sustituyan a la biblioteca adoptada y la lógica de negocio de las HU (crear, editar o eliminar sedes y calcular el progreso del inicio corresponden a HU-029 a HU-032).
