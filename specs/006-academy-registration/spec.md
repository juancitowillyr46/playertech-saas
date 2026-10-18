# Especificación de funcionalidad: Alta de academia

**Feature Branch**: `006-academy-registration`

**Created**: 2026-10-18

**Status**: Draft

**Origen**: Épica **EP-00 — Alta de academia**: HU-014 (registrar academia y owner)

**Input**: Descripción del usuario: "academy-registration: Completar la épica EP-00 con HU-014, referenciando sus criterios CA-001 a CA-008. La spec 001 ya implementó el registro atómico en la base de datos y la spec 002 la versión básica de las pantallas; esta spec la completa: verificación formal de los criterios, reenvío del correo de verificación (decisión del responsable de producto), pruebas de la pantalla de verificar correo y revisión de experiencia y accesibilidad."

> Esta spec cubre la única HU de su épica (principio I) y referencia sus criterios de aceptación en `docs/backlog/user-stories/HU-014-academy-registration.md`. Su usuario es el **visitante que registra su academia**, sobre todo desde el celular. El registro atómico ya existe en la base de datos (spec 001) y la versión básica de las pantallas, en la spec 002 (Historia 7). Esta spec la **completa**, no la reemplaza. La única funcionalidad nueva es reenviar el correo de verificación, que HU-014 dejaba a confirmar y el responsable de producto incluyó el 2026-10-17.

## Escenarios de usuario y pruebas *(mandatory)*

### Historia 1 - Registrar la academia (Prioridad: P1)

Como visitante, quiero registrar mi academia y mi cuenta en un solo paso desde el celular, para empezar a usar PlayerTech sin ayuda.

**Motivo de prioridad**: Es la puerta de entrada de cada academia nueva. Existe en versión básica y falta verificarla contra todos sus criterios.

**Prueba independiente**: Desde el celular, se registra una academia nueva, se intenta registrar con datos incompletos, con una contraseña inválida, sin aceptar los documentos y con un correo ya registrado.

**Referencia**: CA-001 a CA-005 de HU-014.

**Escenarios de aceptación**:

1. **Dado** el formulario completo y válido, con ambos documentos aceptados, **cuando** el visitante confirma, **entonces** se cumple CA-001 de HU-014: se crean la academia y la cuenta, se envía el correo de verificación y se le indica que debe verificar su correo.
2. **Dado** un dato obligatorio vacío, **cuando** intenta registrarse, **entonces** se cumple CA-002 de HU-014: se indican los campos pendientes y no se registra nada.
3. **Dado** una contraseña de menos de 8 caracteres o una confirmación distinta, **cuando** intenta registrarse, **entonces** se cumple CA-003 de HU-014.
4. **Dado** que no aceptó alguno de los dos documentos legales, **cuando** intenta registrarse, **entonces** se cumple CA-004 de HU-014.
5. **Dado** un correo que ya pertenece a una cuenta, **cuando** intenta registrarse, **entonces** se cumple CA-005 de HU-014: ve exactamente lo mismo que en un registro exitoso y no se crea otra academia.

---

### Historia 2 - Verificar el correo y entrar con la academia lista (Prioridad: P1)

Como owner recién registrado, quiero verificar mi correo y encontrar mi academia lista para operar.

**Motivo de prioridad**: Sin verificación no hay acceso (ADR-014); la academia debe quedar completa desde el primer ingreso.

**Prueba independiente**: Se abre el enlace de verificación del correo, se inicia sesión y se comprueban el nombre, el plan, la sede principal y el correo de contacto de la academia.

**Referencia**: CA-006 y CA-007 de HU-014.

**Escenarios de aceptación**:

1. **Dado** el correo de verificación, **cuando** el owner abre el enlace, **entonces** se cumple CA-006 de HU-014: la cuenta queda verificada y puede iniciar sesión.
2. **Dado** el primer ingreso, **cuando** consulta su academia, **entonces** se cumple CA-007 de HU-014: tiene el nombre registrado, el plan Free, una sede principal «Sede principal» de tipo lugar de entrenamiento y, como correo de contacto, el del registro.

---

### Historia 3 - Reenviar el correo de verificación (Prioridad: P1)

Como owner recién registrado, quiero pedir de nuevo el correo de verificación si no me llegó o venció, para no quedar bloqueado.

**Motivo de prioridad**: Hoy, si el correo se pierde, el owner no puede entrar ni registrarse de nuevo, porque el registro con un correo existente responde igual que uno exitoso (CA-005). Decisión del responsable de producto del 2026-10-17.

**Prueba independiente**: En la pantalla de verificar correo se reenvía el correo, se comprueba que llega un enlace nuevo que funciona y que el botón espera antes de permitir otro intento. Se repite con un correo no registrado y con uno ya verificado.

**Referencia**: regla de negocio de HU-014 añadida el 2026-10-17; DEC-12.

**Escenarios de aceptación**:

1. **Dado** la pantalla de verificar correo, **cuando** el owner pide reenviar, **entonces** recibe un correo de verificación nuevo y ve un mensaje de confirmación.
2. **Dado** que acaba de reenviar, o que acaba de registrarse (el registro ya envió un correo), **cuando** quiere reenviar, **entonces** el botón indica cuánto falta para poder hacerlo y no envía antes de tiempo.
3. **Dado** un correo no registrado o una cuenta ya verificada, **cuando** se pide reenviar, **entonces** el mensaje es el mismo que para una cuenta pendiente de verificar (DEC-12).
4. **Dado** que el servidor rechaza el envío por exceso de intentos, **cuando** se pide reenviar, **entonces** se muestra un mensaje en español que pide esperar, sin revelar si la cuenta existe.
5. **Dado** que la pantalla no conoce el correo (por ejemplo, se abrió directamente), **cuando** el owner quiere reenviar, **entonces** puede escribir su correo.
6. **Dado** que el owner intenta iniciar sesión sin haber verificado su correo, o abre un enlace de verificación vencido o ya usado, **cuando** ve el aviso correspondiente, **entonces** tiene un enlace directo a reenviar el correo de verificación.

---

### Historia 4 - Registro sin datos a medias (Prioridad: P2)

Como visitante, quiero que un fallo durante el registro no deje mi cuenta o mi academia a medias, para poder reintentar sin problemas.

**Motivo de prioridad**: La base de datos ya lo garantiza (spec 001); falta verificar el mensaje que ve el visitante.

**Prueba independiente**: Se provoca un fallo del registro y se comprueba que no queda ningún dato y que el formulario conserva lo escrito con un mensaje comprensible.

**Referencia**: CA-008 de HU-014; DEC-20.

**Escenarios de aceptación**:

1. **Dado** un fallo durante el registro, **cuando** el sistema no puede completarlo, **entonces** se cumple CA-008 de HU-014: no queda cuenta ni academia, el formulario conserva lo escrito y se muestra un mensaje para reintentar.

---

### Historia 5 - Pantallas de registro revisadas (Prioridad: P2)

Como visitante, quiero que el registro y la verificación sean claros y cómodos en el celular.

**Motivo de prioridad**: Principio XIII; las pantallas no pasaron una revisión formal de experiencia y accesibilidad.

**Prueba independiente**: Se revisan el registro y la verificación del correo a 360 px y en escritorio, en modo claro y oscuro.

**Referencia**: principio XIII; `DESIGN.md`; `docs/architecture/ui.md`.

**Escenarios de aceptación**:

1. **Dado** el registro o la verificación del correo, **cuando** se revisan, **entonces** no hay hallazgos críticos ni altos sin resolver, no hay desplazamiento horizontal a 360 px y los controles miden al menos 44 px.

---

### Edge Cases

- **Doble toque en «Crear cuenta» o en «Reenviar»**: no se registra ni se envía dos veces.
- **Correo con mayúsculas o espacios al inicio o al final**: se trata como el mismo correo; los espacios se ignoran.
- **Nombre de academia repetido**: se permite (regla de HU-014).
- **Documentos legales que no cargan**: el formulario no se muestra y se ofrece reintentar (comportamiento existente).
- **Enlace de verificación abierto en otro navegador**: se explica cómo continuar (comportamiento existente de la spec 002).
- **Enlace de verificación vencido**: se indica que no es válido y se ofrece un enlace a la pantalla de verificar correo para pedir otro (escenario 6 de la Historia 3).
- **Persona que ya tiene sesión**: no ve el registro (comportamiento existente).
- **Sin conexión al registrar o al reenviar**: mensaje en español; el formulario conserva lo escrito.

## Requirements *(mandatory)*

### Functional Requirements

**Registro (HU-014 CA-001 a CA-005, CA-008)**

- **FR-001**: El registro DEBE cumplir CA-001 a CA-005 y CA-008 de HU-014. Lo que la versión básica no cumpla DEBE corregirse en esta spec.
- **FR-002**: Con un correo ya registrado, el visitante DEBE ver exactamente lo mismo que en un registro exitoso, sin otra academia creada (DEC-12).
- **FR-003**: Ante un fallo del registro, NO DEBE quedar ningún dato parcial, y el formulario DEBE conservar lo escrito, con un mensaje en español para reintentar (DEC-20).
- **FR-004**: Las aceptaciones DEBEN registrar el documento, su versión y la hora del servidor (DEC-19, regla de HU-014).

**Verificación y academia lista (HU-014 CA-006, CA-007)**

- **FR-005**: Abrir el enlace de verificación DEBE dejar la cuenta verificada y permitir el ingreso.
- **FR-006**: En el primer ingreso, la academia DEBE tener el nombre registrado, el plan Free, una sede principal «Sede principal» de tipo lugar de entrenamiento y el correo de contacto del registro (DEC-21, DEC-24).

**Reenviar el correo de verificación (decisión del 2026-10-17)**

- **FR-007**: La pantalla de verificar correo DEBE permitir reenviar el correo de verificación al correo del registro o, si no lo conoce, al que escriba la persona.
- **FR-008**: Tras un reenvío, DEBE pasar al menos 60 segundos antes de permitir otro. El botón DEBE mostrar el tiempo restante.
- **FR-009**: El mensaje tras reenviar DEBE ser el mismo exista o no la cuenta y esté o no verificada (DEC-12).
- **FR-010**: Si el servidor rechaza el envío por exceso de intentos, DEBE mostrarse un mensaje en español que pida esperar, sin revelar si la cuenta existe.
- **FR-010a**: El reenvío DEBE poder alcanzarse desde el aviso de correo sin verificar del inicio de sesión (con el correo ya escrito) y desde la pantalla de enlace no válido del retorno de los correos.

**Experiencia, accesibilidad y verificación**

- **FR-011**: El registro y la verificación del correo DEBEN cumplir `DESIGN.md` y `ui.md`, con controles de al menos 44 px y sin desplazamiento horizontal a 360 px, en modo claro y oscuro.
- **FR-012**: Ambas pantallas DEBEN pasar la revisión de experiencia y accesibilidad (principio XIII).
- **FR-013**: Cada criterio de aceptación de HU-014 y cada escenario del reenvío DEBEN tener al menos una prueba automática o un paso de validación documentado.

### Key Entities

- **Registro**: academia, cuenta del owner, perfil, membresía, suscripción Free, sede principal y dos aceptaciones legales, creados juntos o ninguno (spec 001).
- **Correo de verificación**: enlace que activa la cuenta. Puede reenviarse con espera entre intentos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un visitante completa el registro desde el celular en menos de 3 minutos, desde abrir el formulario hasta ver el aviso de verificar su correo.
- **SC-002**: El 100 % de los registros incompletos o inválidos se rechazan con el problema indicado junto al campo y sin crear datos.
- **SC-003**: Ningún mensaje del registro ni del reenvío permite saber si un correo está registrado.
- **SC-004**: El 100 % de las academias registradas y verificadas tienen, en el primer ingreso, nombre, plan Free, sede principal y correo de contacto.
- **SC-005**: Un owner cuyo correo no llegó puede recibir uno nuevo sin ayuda en menos de 2 minutos.
- **SC-006**: A 360 px no hay desplazamiento horizontal en el registro ni en la verificación del correo, todos los controles miden al menos 44 px y la auditoría de accesibilidad no deja hallazgos críticos.
- **SC-007**: Las pruebas existentes siguen en verde y cada criterio de HU-014 y cada escenario del reenvío tienen al menos una prueba automática o un paso de validación documentado.

## Assumptions

- La función de registro de la spec 001 ya es atómica y está cubierta por pgTAP (`020-registration`). No se esperan migraciones.
- El reenvío usa el mecanismo nativo de reenvío de verificación del proveedor de autenticación (ADR-014), que ya limita los envíos por correo. La espera de 60 segundos en la interfaz se suma a ese límite.
- El correo se verifica con el buzón local de desarrollo; el SMTP real queda para el entorno en la nube (ADR-016).
- Durante el desarrollo se corren solo las pruebas de las zonas tocadas; el conjunto completo, una vez antes del commit.
- Quedan fuera de alcance, por decisión del responsable de producto: pedir datos de la sede en el registro e invitar a completarla al terminar (la invitación la cubre HU-032; pedir la dirección queda como `feat` futura). También: captcha, selección de país o zona horaria, onboarding guiado, limpieza de registros no verificados (MVP+) y SMTP real.
