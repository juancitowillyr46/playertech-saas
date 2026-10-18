# Especificación de funcionalidad: Acceso y sesión

**Feature Branch**: `005-access-and-session`

**Created**: 2026-10-17

**Status**: Draft

**Origen**: Épica **EP-01 — Acceso y sesión**: HU-001 (iniciar sesión), HU-015 (cerrar sesión) y HU-016 (recuperar contraseña)

**Input**: Descripción del usuario: "access-and-session: Completar la épica EP-01 con HU-001, HU-015 y HU-016, referenciando sus criterios de aceptación sin copiarlos. La spec 002 ya construyó una versión básica funcional; esta spec la completa: cierre por inactividad (DEC-28), botón atrás tras cerrar sesión, verificación formal de los demás criterios y revisión de experiencia y accesibilidad de las pantallas de acceso."

> Esta spec cubre tres HU de la misma épica (principio I) y referencia sus criterios de aceptación en `docs/backlog/user-stories/`. Su usuario es el **owner de la academia**, que trabaja sobre todo desde el celular. Parte de la versión básica que construyó la spec 002 (`specs/002-frontend-foundation/`, Historia 7): inicio de sesión, recuperación y restablecimiento de contraseña, retorno de los enlaces de correo, y las pantallas de acceso denegado y academia suspendida. Esta spec **completa** esa versión, no la reemplaza. Lo único que no existe es el cierre por inactividad, cuyas reglas fijan DEC-28 y ADR-014.

## Escenarios de usuario y pruebas *(mandatory)*

### Historia 1 - Cierre de sesión por inactividad (Prioridad: P1)

Como owner, quiero que mi sesión se cierre sola si dejo de usar PlayerTech durante una hora, para que nadie vea ni cambie los datos de mi academia si dejo el celular o el computador sin vigilancia.

**Motivo de prioridad**: Es el único criterio de la épica que no existe. Además, sin él, la sesión del celular queda abierta por días.

**Prueba independiente**: Con el tiempo de inactividad configurado en un valor corto en desarrollo, el owner deja el celular quieto, lo bloquea o cierra la aplicación, y comprueba que al volver se le pide ingresar con el aviso de inactividad. También comprueba que mientras interactúa la sesión no se cierra.

**Referencia**: CA-003 y CA-004 de HU-015; CA-006 de HU-001 («sesión vigente»); DEC-28.

**Escenarios de aceptación**:

1. **Dado** el owner con sesión iniciada y la aplicación abierta, **cuando** pasa el tiempo de inactividad sin ninguna interacción, **entonces** se cumple CA-003 de HU-015: la sesión se cierra y se muestra el inicio de sesión con un aviso de que se cerró por inactividad.
2. **Dado** el owner que interactúa con la aplicación (toca, hace clic, escribe o se desplaza), **cuando** transcurre el tiempo, **entonces** se cumple CA-004 de HU-015: el periodo se reinicia con cada interacción y la sesión no se cierra mientras trabaja.
3. **Dado** el celular bloqueado o la aplicación en segundo plano durante más que el tiempo de inactividad, **cuando** el owner vuelve a ella, **entonces** la sesión se cierra antes de mostrar datos de la academia y se muestra el inicio de sesión con el aviso.
4. **Dado** el owner que cerró la aplicación, **cuando** la abre de nuevo después del tiempo de inactividad, **entonces** se le piden las credenciales con el aviso de inactividad. Si la abre antes, continúa sin credenciales (CA-006 de HU-001, DEC-28).
5. **Dado** el owner con la aplicación abierta en dos pestañas, **cuando** solo interactúa con una de ellas, **entonces** ninguna de las dos cierra la sesión por inactividad.
6. **Dado** que la aplicación solo hace actividad técnica (renovar la sesión, cargar datos), **cuando** no hay interacción del usuario, **entonces** esa actividad no reinicia el periodo de inactividad (regla de HU-015).

---

### Historia 2 - Cerrar sesión de forma segura (Prioridad: P1)

Como owner, quiero cerrar mi sesión y estar seguro de que nadie puede volver a ver la información de mi academia desde ese dispositivo.

**Motivo de prioridad**: En un celular o computador compartido, el botón «atrás» del navegador no debe mostrar datos después de cerrar sesión.

**Prueba independiente**: El owner cierra sesión desde el menú de usuario, en el celular y en el escritorio, y luego usa el botón «atrás» del navegador y abre directamente una dirección privada.

**Referencia**: CA-001 y CA-002 de HU-015.

**Escenarios de aceptación**:

1. **Dado** el owner con sesión iniciada, **cuando** elige cerrar sesión, **entonces** se cumple CA-001 de HU-015: la sesión termina y se muestra el inicio de sesión.
2. **Dado** el owner que cerró sesión, **cuando** usa el botón «atrás» del navegador o abre una dirección privada, **entonces** se cumple CA-002 de HU-015: no se muestra información de la academia y se pide iniciar sesión.
3. **Dado** el owner con sesión en dos dispositivos, **cuando** cierra sesión en uno, **entonces** el otro sigue con su sesión (regla de HU-015).

---

### Historia 3 - Iniciar sesión (Prioridad: P1)

Como owner, quiero ingresar a PlayerTech con mi correo y contraseña, para gestionar mi academia.

**Motivo de prioridad**: Es la puerta de entrada al producto. Existe en versión básica y falta verificarla contra todos sus criterios.

**Prueba independiente**: Con las cuentas del seed (owner de academia activa, owner de academia suspendida, cuenta sin membresía, cuenta sin verificar) se recorren todos los casos desde el celular.

**Referencia**: CA-001 a CA-008 de HU-001.

**Escenarios de aceptación**:

1. **Dado** un owner verificado con academia activa, **cuando** ingresa sus credenciales, **entonces** se cumple CA-001 de HU-001: entra al inicio de su academia.
2. **Dado** un correo o una contraseña incorrectos, **cuando** se intenta ingresar, **entonces** se cumple CA-002 de HU-001: el mensaje es el mismo para ambos casos y no revela si el correo está registrado.
3. **Dado** uno o ambos campos vacíos, **cuando** se intenta ingresar, **entonces** se cumple CA-003 de HU-001: se indican los campos obligatorios y no se intenta autenticar.
4. **Dado** un correo sin verificar, **cuando** se intenta ingresar, **entonces** se cumple CA-004 de HU-001: no se permite el acceso y se indica que debe verificar su correo.
5. **Dado** una persona sin sesión, **cuando** abre una dirección privada, **entonces** se cumple CA-005 de HU-001: se muestra el inicio de sesión y, tras ingresar, vuelve a la dirección que pidió.
6. **Dado** una sesión vigente, **cuando** el owner vuelve a abrir PlayerTech, **entonces** se cumple CA-006 de HU-001: continúa sin credenciales.
7. **Dado** un owner de una academia suspendida, **cuando** ingresa, **entonces** se cumple CA-007 de HU-001: ve el aviso de academia suspendida y no puede operar.
8. **Dado** una cuenta válida sin membresía activa, **cuando** ingresa, **entonces** se cumple CA-008 de HU-001: ve el aviso de acceso denegado y no puede operar.

---

### Historia 4 - Recuperar la contraseña (Prioridad: P2)

Como owner, quiero definir una nueva contraseña si olvidé la mía, para volver a entrar sin ayuda.

**Motivo de prioridad**: Existe en versión básica y depende del correo. Se verifica con el buzón de correo local de desarrollo.

**Prueba independiente**: Se solicita la recuperación con un correo registrado y con uno no registrado; se usa el enlace recibido para definir una contraseña nueva; se reutiliza el enlace; se ingresa con la nueva y con la anterior.

**Referencia**: CA-001 a CA-006 de HU-016.

**Escenarios de aceptación**:

1. **Dado** un correo registrado o no registrado, **cuando** se solicita la recuperación, **entonces** se cumplen CA-001 y CA-002 de HU-016: el mensaje es el mismo y genérico.
2. **Dado** un enlace de recuperación vigente, **cuando** el owner ingresa una nueva contraseña válida y su confirmación, **entonces** se cumple CA-003 de HU-016: se actualiza y se le confirma.
3. **Dado** una contraseña de menos de 8 caracteres o una confirmación distinta, **cuando** intenta guardarla, **entonces** se cumple CA-004 de HU-016: se indica el problema y no se actualiza.
4. **Dado** un enlace caducado o ya usado, **cuando** el owner lo abre, **entonces** se cumple CA-005 de HU-016: se indica que el enlace no es válido y se ofrece solicitar uno nuevo.
5. **Dado** que cambió su contraseña, **cuando** ingresa, **entonces** se cumple CA-006 de HU-016: entra con la nueva y no con la anterior.

---

### Historia 5 - Pantallas de acceso revisadas (Prioridad: P2)

Como owner, quiero que las pantallas de acceso sean claras, cómodas en el celular y accesibles, para entrar sin dudas ni errores.

**Motivo de prioridad**: Las pantallas tienen el estilo del sistema de diseño (spec 003), pero no pasaron la revisión de experiencia y accesibilidad que exige el principio XIII.

**Prueba independiente**: Se revisan a 360 px y en escritorio, en modo claro y oscuro, el inicio de sesión, la recuperación y el restablecimiento de contraseña, el aviso de verificar el correo, el retorno de los enlaces, el acceso denegado y la academia suspendida.

**Referencia**: principio XIII; `DESIGN.md`; `docs/architecture/ui.md`.

**Escenarios de aceptación**:

1. **Dado** cualquier pantalla de acceso, **cuando** se revisa con la auditoría de experiencia y accesibilidad, **entonces** no quedan hallazgos críticos ni altos sin resolver.
2. **Dado** el celular a 360 px, **cuando** se usa cualquier pantalla de acceso, **entonces** no hay desplazamiento horizontal y los controles miden al menos 44 px.

---

### Edge Cases

- **Reloj del dispositivo cambiado**: si la hora del dispositivo retrocede o avanza bruscamente, la sesión no debe quedar abierta indefinidamente; ante una hora de última interacción imposible (en el futuro), se trata como inactividad vencida.
- **Almacenamiento del navegador no disponible** (navegación privada estricta): el cierre por inactividad sigue funcionando mientras la aplicación esté abierta; solo se pierde la comprobación al reabrir y entre pestañas.
- **Inactividad vencida mientras se guarda un formulario**: en la práctica no ocurre, porque tocar «Guardar» es una interacción que reinicia el tiempo. Si coincidiera, la operación termina o falla con su mensaje normal y luego se cierra la sesión.
- **Cierre de sesión sin conexión**: la sesión se cierra en el dispositivo aunque el servidor no responda, y se muestra el inicio de sesión.
- **Aviso de inactividad**: desaparece al ingresar de nuevo y no se muestra si la persona cerró sesión de forma manual.
- **Pantallas públicas** (inicio de sesión, recuperación, restablecimiento, verificación): no cuentan inactividad porque no hay sesión.
- **Enlace de recuperación abierto con otra sesión iniciada**: se aplica el comportamiento existente de la spec 002 y se verifica que no mezcle cuentas.
- **Doble toque en Ingresar o en Cerrar sesión**: no se envía dos veces.

## Requirements *(mandatory)*

### Functional Requirements

**Cierre por inactividad (HU-015 CA-003 y CA-004, DEC-28)**

- **FR-001**: La sesión DEBE cerrarse cuando pasen 60 minutos desde la última interacción del usuario con PlayerTech.
- **FR-002**: Solo DEBEN contar como interacción las acciones del usuario (tocar, hacer clic, escribir, desplazarse). La actividad técnica de la aplicación NO DEBE reiniciar el periodo.
- **FR-003**: El cierre DEBE ocurrir aunque la aplicación haya estado en segundo plano, con la pantalla bloqueada o cerrada: al volver o al reabrirla después del tiempo de inactividad, la sesión DEBE cerrarse antes de mostrar datos de la academia.
- **FR-004**: La interacción en cualquier pestaña abierta de PlayerTech DEBE mantener la sesión de todas las pestañas del mismo navegador.
- **FR-005**: Tras un cierre por inactividad, el inicio de sesión DEBE mostrar un aviso en español que explique que la sesión se cerró por inactividad. Tras un cierre manual, NO DEBE mostrarse.
- **FR-006**: NO DEBE haber aviso previo ni cuenta regresiva antes del cierre (DEC-28).
- **FR-007**: El tiempo de inactividad DEBE ser de 60 minutos en producción y configurable en desarrollo, para poder verificarlo desde el celular con un valor corto.

**Cerrar sesión (HU-015 CA-001 y CA-002)**

- **FR-008**: El owner DEBE poder cerrar sesión desde el menú de usuario en el celular y en el escritorio. Al hacerlo, DEBE ver el inicio de sesión.
- **FR-009**: Después de cerrar sesión, ni el botón «atrás» del navegador ni una dirección privada DEBEN mostrar información de la academia.
- **FR-010**: Cerrar sesión en un dispositivo NO DEBE cerrar las sesiones de otros dispositivos.

**Iniciar sesión (HU-001)**

- **FR-011**: El inicio de sesión DEBE cumplir CA-001 a CA-008 de HU-001. Lo que la versión básica no cumpla DEBE corregirse en esta spec.
- **FR-012**: Una sesión es vigente (CA-006 de HU-001) mientras no pasen 60 minutos desde la última interacción (DEC-28).
- **FR-013**: Los mensajes de error NO DEBEN revelar si un correo está registrado (DEC-12).

**Recuperar contraseña (HU-016)**

- **FR-014**: La recuperación DEBE cumplir CA-001 a CA-006 de HU-016. Lo que la versión básica no cumpla DEBE corregirse en esta spec.

**Experiencia, accesibilidad y verificación**

- **FR-015**: Las pantallas de acceso DEBEN cumplir `DESIGN.md` y `ui.md`, con controles de al menos 44 px y sin desplazamiento horizontal a 360 px, en modo claro y oscuro.
- **FR-016**: Las pantallas de acceso DEBEN pasar la revisión de experiencia y accesibilidad (principio XIII).
- **FR-017**: Cada criterio de aceptación de HU-001, HU-015 y HU-016 DEBE tener al menos una prueba automática o un paso de validación documentado.

### Key Entities

- **Sesión**: el acceso iniciado de una persona en un navegador. Termina por cierre manual o por inactividad.
- **Última interacción**: el momento de la última acción del usuario en cualquier pestaña de PlayerTech de ese navegador. Define si la sesión sigue vigente.
- **Motivo de cierre**: manual o por inactividad. Decide si el inicio de sesión muestra el aviso.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de las pruebas, la sesión se cierra al vencer el tiempo de inactividad: con la aplicación abierta, en segundo plano, con la pantalla bloqueada y al reabrirla.
- **SC-002**: En ningún caso se muestran datos de la academia después de vencer la inactividad ni después de cerrar sesión, incluido el botón «atrás».
- **SC-003**: Mientras el owner interactúa, la sesión nunca se cierra por inactividad, aunque use varias pestañas.
- **SC-004**: El owner puede verificar el cierre por inactividad desde su celular en menos de 15 minutos, con el tiempo configurado en un valor corto.
- **SC-005**: Ningún mensaje de inicio de sesión ni de recuperación permite saber si un correo está registrado.
- **SC-006**: A 360 px de ancho no hay desplazamiento horizontal en las pantallas de acceso y todos sus controles miden al menos 44 px. La auditoría de accesibilidad no deja hallazgos críticos.
- **SC-007**: Las pruebas automáticas existentes siguen en verde y cada criterio de aceptación de HU-001, HU-015 y HU-016 tiene al menos una prueba automática o un paso de validación documentado.

## Assumptions

- La versión básica de la spec 002 funciona. Esta spec la verifica criterio a criterio y corrige solo lo que no cumpla.
- No se esperan migraciones: la autenticación y la sesión son de Supabase Auth, y la membresía y el estado de la academia ya existen (spec 001).
- El cierre por inactividad se hace en la aplicación del navegador (ADR-014). Mientras el proyecto use el plan gratuito, el servidor no lo refuerza. Es un límite aceptado.
- Si el navegador no permite guardar datos, la regla se cumple con la aplicación abierta y se pierde solo la comprobación al reabrir y entre pestañas.
- La recuperación de contraseña se verifica con el buzón de correo local de desarrollo; el SMTP real queda para el entorno en la nube (ADR-016).
- El seed de desarrollo ya tiene o puede tener las cuentas necesarias (academia activa, academia suspendida, sin membresía, sin verificar). Si falta alguna, el plan lo resuelve sin cambiar el esquema.
- Durante el desarrollo se corren solo las pruebas de las zonas tocadas. El conjunto completo se corre una vez antes del commit.
- Quedan fuera de alcance: cerrar sesión en todos los dispositivos, aviso previo con cuenta regresiva, la opción «Recordarme», el cierre por inactividad en el servidor (plan Pro de Supabase), el SMTP real y el registro de academia (HU-014, EP-00).
