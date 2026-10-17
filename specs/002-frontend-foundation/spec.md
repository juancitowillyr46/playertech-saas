# Especificación de funcionalidad: Base del frontend y esqueleto de PlayerTech

**Feature Branch**: `002-frontend-foundation`

**Created**: 2026-10-16

**Status**: Draft

**Origen**: Habilitador técnico **T-00** — áreas 7 y 8 (`docs/backlog/enablers/T-00-saas-foundation.md`)

**Input**: Descripción del usuario: "frontend-foundation: Base técnica del frontend y esqueleto de la aplicación PlayerTech. Implementa las áreas 7 y 8 del habilitador técnico T-00 y sus criterios de aceptación técnicos CA-007 (en lo relativo al frontend), CA-008 y CA-009."

> Esta spec proviene de un habilitador técnico (principio I de la Constitución). Sus usuarios son el **equipo de desarrollo**, que construirá las HU de la Fase 1 sobre esta base, y el **owner de la academia**, que recorre la navegación base. La estructura de referencia está en `docs/architecture/frontend.md` y `docs/architecture/ui.md`; las decisiones, en ADR-002, ADR-009, ADR-013, ADR-014, ADR-015 (FE-01 a FE-14) y ADR-016. La base de datos y su contrato provienen de la spec 001 (`specs/001-database-foundation/contracts/`).

## Escenarios de usuario y pruebas *(mandatory)*

### Historia 1 - Proyecto con controles de calidad funcionando (Prioridad: P1)

Como equipo de desarrollo, necesito que el proyecto del frontend se identifique como PlayerTech y que la compilación, el análisis estático y las pruebas funcionen con un solo comando cada uno, para detectar errores antes de integrar cualquier cambio.

**Motivo de prioridad**: Hoy el análisis estático no funciona y las pruebas usan una herramienta que el proyecto decidió reemplazar (ADR-015, FE-07 y FE-10). Sin estos controles, nada de lo que siga puede verificarse.

**Prueba independiente**: Desde un clon limpio del repositorio, se instalan las dependencias y se ejecutan la compilación de producción, el análisis estático y las pruebas; los tres terminan sin errores.

**Referencia**: CA-009 de T-00.

**Escenarios de aceptación**:

1. **Dado** un clon limpio con las dependencias instaladas, **cuando** se ejecuta la compilación de producción, **entonces** termina sin errores.
2. **Dado** el código del frontend, **cuando** se ejecuta el análisis estático, **entonces** termina sin errores y aplica las reglas del proyecto (prefijo de selectores propio, buenas prácticas del framework, accesibilidad de plantillas).
3. **Dado** el código del frontend, **cuando** se ejecutan las pruebas, **entonces** se ejecutan sin abrir un navegador y todas pasan.
4. **Dado** el proyecto, **cuando** se revisan su nombre y sus metadatos, **entonces** se identifica como PlayerTech y no quedan restos de configuración ajena (por ejemplo, referencias a submódulos inexistentes).

---

### Historia 2 - Acceso protegido según sesión y membresía (Prioridad: P1)

Como owner de una academia, necesito que la aplicación me lleve siempre a la pantalla que corresponde a mi situación (sin sesión, sin academia, academia suspendida o academia activa), para no ver pantallas que no puedo usar ni quedar en un estado confuso.

**Motivo de prioridad**: Es la experiencia base de seguridad de toda la aplicación y el criterio CA-008 de T-00.

**Prueba independiente**: Con los usuarios del seed (spec 001) y variando su situación, se abre cada tipo de ruta y se comprueba la pantalla de destino.

**Referencia**: CA-008 de T-00; ADR-015 (FE-09, FE-11, FE-13).

**Escenarios de aceptación**:

1. **Dado** una persona sin sesión, **cuando** abre cualquier ruta privada, **entonces** es dirigida a la pantalla de inicio de sesión.
2. **Dado** una persona con sesión, **cuando** abre una pantalla pública de autenticación (inicio de sesión, registro, recuperación), **entonces** es dirigida al inicio de la aplicación.
3. **Dado** un usuario con sesión y sin membresía activa, **cuando** abre una ruta privada, **entonces** ve la pantalla de acceso denegado, con la opción de cerrar sesión.
4. **Dado** un owner cuya academia está suspendida, **cuando** abre una ruta privada, **entonces** ve la pantalla de academia suspendida, con la opción de cerrar sesión, y no ve ningún dato de la academia.
5. **Dado** un owner de una academia activa, **cuando** abre una ruta privada, **entonces** accede a ella.
6. **Dado** cualquier persona, **cuando** abre una dirección que no existe, **entonces** ve una página propia de "página no encontrada" con un enlace para volver.
7. **Dado** la raíz de la aplicación, **cuando** se abre, **entonces** dirige al inicio (y, sin sesión, al inicio de sesión).

---

### Historia 3 - Retorno desde los enlaces de correo (Prioridad: P1)

Como owner que acaba de registrarse o que pidió recuperar su contraseña, necesito que el enlace del correo me devuelva a la aplicación y me deje en el lugar correcto, para completar el proceso sin pasos extra.

**Motivo de prioridad**: Sin este retorno, la verificación de correo (HU-014) y la recuperación de contraseña (HU-016) no pueden completarse; el flujo de la spec 001 terminó en una dirección de la aplicación que aún no existe.

**Prueba independiente**: Con Supabase local, se registra una cuenta, se abre el enlace del correo capturado en el visor local y se comprueba el destino; se repite con un enlace de recuperación y con un enlace caducado o alterado.

**Referencia**: ADR-014; ADR-015 (FE-09).

**Escenarios de aceptación**:

1. **Dado** un enlace de verificación válido, **cuando** el owner lo abre, **entonces** ve un indicador de "verificando", queda con la sesión iniciada y llega al inicio de la aplicación.
2. **Dado** un enlace de recuperación válido, **cuando** el owner lo abre, **entonces** queda con una sesión temporal y llega a la pantalla para establecer una nueva contraseña.
3. **Dado** un enlace caducado, ya usado o alterado, **cuando** se abre, **entonces** se muestra un mensaje claro en español, sin detalles técnicos, con un enlace para volver al inicio de sesión.
4. **Dado** cualquier retorno, **cuando** se completa, **entonces** la dirección del navegador ya no contiene el código de un solo uso del enlace.

---

### Historia 4 - Navegación base de PlayerTech (Prioridad: P2)

Como owner de una academia activa, necesito una estructura de navegación clara con la marca de PlayerTech y el nombre de mi academia, que funcione bien en el celular, para moverme entre las secciones a medida que se construyan.

**Motivo de prioridad**: Es el chasis donde se montan las HU de la Fase 1; no bloquea a las historias P1.

**Prueba independiente**: Con la sesión de un owner del seed, en un ancho de celular y en escritorio, se recorren todas las entradas del menú y del menú de usuario.

**Referencia**: ADR-015 (FE-01, FE-05, FE-06, FE-13); `docs/architecture/ui.md` (arquitectura de información).

**Escenarios de aceptación**:

1. **Dado** un owner con sesión, **cuando** abre la aplicación, **entonces** ve la marca "PlayerTech", el nombre de su academia en la barra superior y un menú con **Inicio** y la sección **Configuración** (Academia y Sedes).
2. **Dado** el menú, **cuando** el owner elige cualquier entrada, **entonces** llega a su pantalla; las pantallas aún no construidas muestran un marcador que indica que estarán disponibles pronto.
3. **Dado** el menú de usuario de la barra superior, **cuando** el owner elige **Cerrar sesión**, **entonces** la sesión termina y llega a la pantalla de inicio de sesión.
4. **Dado** el botón de modo claro/oscuro, **cuando** el owner lo pulsa, **entonces** la interfaz cambia de modo; el configurador de temas no está disponible.
5. **Dado** un ancho de pantalla de celular, **cuando** el owner navega, **entonces** el menú se abre y se cierra sin desbordar la pantalla y todas las acciones son alcanzables con el dedo.
6. **Dado** cualquier pantalla, **cuando** se muestran textos, fechas o componentes con mensajes propios (por ejemplo, calendarios o tablas vacías), **entonces** aparecen en español de Colombia.
7. **Dado** las pantallas públicas, **cuando** se abren, **entonces** comparten un mismo layout de autenticación propio de PlayerTech, con el panel de marca oculto en el celular.

---

### Historia 5 - Capa de datos lista para las historias de usuario (Prioridad: P2)

Como equipo de desarrollo, necesito contratos de acceso a la autenticación, al almacenamiento de archivos y al contexto de academia, independientes del proveedor, para construir las HU sin repetir infraestructura y poder cambiar de proveedor sin tocar las pantallas.

**Motivo de prioridad**: Habilita HU-001, HU-014, HU-015, HU-016 y HU-017; se verifica con pruebas automáticas sin necesitar pantallas.

**Prueba independiente**: Las pruebas automáticas ejercitan cada contrato con una implementación simulada y verifican la traducción de errores; una revisión automática confirma que ninguna pantalla accede directamente al proveedor.

**Referencia**: ADR-002, ADR-009, ADR-013, ADR-014; `docs/architecture/frontend.md` (acceso a datos, autenticación y sesión, manejo de errores).

**Escenarios de aceptación**:

1. **Dado** el contrato de autenticación, **cuando** se revisa, **entonces** cubre registro (con los datos del contrato de la spec 001), inicio y cierre de sesión, solicitud de recuperación, cambio de contraseña, restauración de la sesión al recargar y el intercambio del retorno de los enlaces de correo.
2. **Dado** el contrato de almacenamiento, **cuando** se revisa, **entonces** cubre subir, obtener la dirección de visualización y retirar un archivo, usando la clave relativa de la spec 001 y sin construir direcciones del proveedor fuera de su implementación (ADR-013).
3. **Dado** un owner con sesión, **cuando** se resuelve el contexto de academia, **entonces** se obtiene su academia (identificador y nombre) y su situación: activa, suspendida o sin academia; el identificador de academia nunca proviene de la interfaz.
4. **Dado** un error del proveedor (credenciales inválidas, correo no confirmado, contraseña débil, enlace caducado, sin conexión, permiso denegado u otro), **cuando** llega a la aplicación, **entonces** se convierte en un error de aplicación estable con un mensaje en español sin detalles técnicos.
5. **Dado** un error no controlado, **cuando** ocurre, **entonces** se registra y el usuario ve un aviso genérico, sin que la aplicación quede bloqueada.
6. **Dado** el código de las pantallas y servicios, **cuando** se revisa, **entonces** ninguno usa directamente el cliente del proveedor ni los tipos generados de la base de datos.

---

### Historia 6 - Demos de la plantilla solo en desarrollo (Prioridad: P3)

Como equipo de desarrollo, necesito conservar las demos de la plantilla base como catálogo de referencia sin que lleguen a producción, para consultar componentes sin exponerlos a los usuarios.

**Motivo de prioridad**: Útil durante el desarrollo, pero no bloquea nada.

**Prueba independiente**: En desarrollo se abren las demos bajo `/dev`; en la compilación de producción esas rutas muestran la página no encontrada.

**Referencia**: ADR-015 (FE-02); CA-008 de T-00.

**Escenarios de aceptación**:

1. **Dado** el entorno de desarrollo, **cuando** se abre `/dev`, **entonces** se accede a las demos de la plantilla.
2. **Dado** la compilación de producción, **cuando** se abre cualquier ruta bajo `/dev`, **entonces** se muestra la página no encontrada y las demos no forman parte de lo que se descarga.
3. **Dado** el entorno de desarrollo y la base de datos local, **cuando** el equipo abre `/dev/login` e ingresa con un usuario del seed, **entonces** queda con la sesión iniciada y llega al inicio, lo que permite recorrer el esqueleto privado antes de HU-001.

---

### Casos límite

- La sesión caduca o se cierra en otra pestaña mientras el owner navega: la siguiente navegación a una ruta privada lo dirige al inicio de sesión.
- La academia se suspende mientras el owner tiene la aplicación abierta: al recargar o navegar a otra ruta privada, ve la pantalla de academia suspendida.
- La conexión con el proveedor falla al resolver la sesión o el contexto de academia: se muestra un mensaje de error recuperable (reintentar), no una pantalla en blanco ni un bucle de redirecciones.
- Se abre `/auth/callback` directamente, sin código: se trata como enlace inválido.
- El enlace del correo se abre en un navegador o dispositivo distinto al que inició el proceso (por ejemplo, registro en el computador y enlace abierto en el celular): el correo puede quedar verificado aunque la sesión no se inicie en ese navegador. Se muestra un mensaje que lo explica: si era una verificación, ya puede iniciar sesión; si era una recuperación, debe solicitar un enlace nuevo desde el navegador donde la pidió.
- Un usuario abre una ruta privada concreta sin sesión: tras iniciar sesión (cuando exista HU-001), vuelve a esa ruta y no al inicio genérico.
- La configuración pública del proveedor falta o es inválida: la aplicación falla al iniciar con un mensaje claro para el equipo, no con errores dispersos.
- El usuario prefiere el modo oscuro y recarga: se conserva su elección en ese navegador.

## Requisitos *(mandatory)*

### Requisitos funcionales

**Proyecto y calidad**

- **FR-001**: El proyecto del frontend DEBE identificarse como PlayerTech en su nombre, metadatos y título de la aplicación.
- **FR-002**: El proyecto DEBE ofrecer comandos únicos para compilar, ejecutar el análisis estático y ejecutar las pruebas, y los tres DEBEN terminar sin errores.
- **FR-003**: El análisis estático DEBE aplicar el prefijo de selectores propio del proyecto, las reglas recomendadas del framework y las de accesibilidad de plantillas.
- **FR-004**: Las pruebas DEBEN ejecutarse sin navegador gráfico, con la herramienta decidida en ADR-015 (FE-10).
- **FR-005**: El repositorio NO DEBE contener configuración huérfana de otros proyectos.

**Configuración y conexión**

- **FR-006**: La configuración de conexión con el proveedor DEBE definirse por entorno y contener solo valores públicos; ninguna clave privilegiada DEBE estar en el código ni en lo que se descarga en el navegador.
- **FR-007**: La aplicación DEBE validar la configuración al iniciar y fallar con un mensaje claro si falta o es inválida.
- **FR-008**: La autenticación DEBE usar el flujo de intercambio de código con verificación (PKCE) decidido en ADR-015 (FE-09).

**Capa de datos**

- **FR-009**: DEBE existir un contrato de autenticación independiente del proveedor que cubra: registro con los metadatos de `contracts/registration-metadata.md` de la spec 001, inicio y cierre de sesión, solicitud de recuperación, cambio de contraseña, restauración de la sesión y el intercambio del retorno de los enlaces de correo.
- **FR-010**: DEBE existir un contrato de almacenamiento de archivos independiente del proveedor que cubra subir, obtener la dirección de visualización y retirar un archivo, según ADR-013.
- **FR-011**: Cada contrato DEBE tener una implementación para el proveedor actual, registrada de modo que pueda sustituirse sin modificar pantallas ni servicios.
- **FR-012**: El contexto de academia DEBE resolverse a partir de la membresía del usuario y exponer la academia actual (identificador y nombre) y su situación: activa, suspendida o sin academia.
- **FR-013**: Los tipos generados de la base de datos DEBEN usarse solo dentro de las implementaciones del proveedor.
- **FR-014**: Las pantallas y servicios NO DEBEN usar directamente el cliente del proveedor.
- **FR-015**: Los errores del proveedor DEBEN traducirse a un conjunto estable de errores de aplicación, cada uno con un mensaje en español sin detalles técnicos.
- **FR-016**: DEBE existir un manejador global que registre los errores no controlados y muestre un aviso genérico al usuario.

**Rutas y protección**

- **FR-017**: La aplicación DEBE registrar las rutas públicas y privadas definidas en `docs/architecture/frontend.md`. Las pantallas que pertenecen a una HU posterior DEBEN mostrar un marcador dentro de su layout.
- **FR-018**: Las rutas privadas DEBEN exigir una sesión válida; sin ella, DEBEN dirigir al inicio de sesión conservando la ruta solicitada.
- **FR-019**: Las rutas privadas DEBEN exigir una membresía activa en una academia activa; DEBEN dirigir a acceso denegado si no hay academia y a academia suspendida si está suspendida.
- **FR-020**: Las pantallas públicas de autenticación DEBEN dirigir al inicio si ya existe una sesión, salvo el retorno de enlaces, la pantalla de nueva contraseña (que usa la sesión temporal de recuperación), acceso denegado y academia suspendida.
- **FR-021**: La pantalla de retorno de enlaces DEBE completar el intercambio, limpiar el código de la dirección y dirigir al inicio (verificación) o a la pantalla de nueva contraseña (recuperación); ante un enlace inválido DEBE mostrar un mensaje con un enlace al inicio de sesión.
- **FR-022**: Las pantallas de acceso denegado y de academia suspendida DEBEN explicar la situación en lenguaje claro y ofrecer cerrar sesión.
- **FR-023**: DEBE existir una página propia de "página no encontrada" para cualquier dirección inexistente.
- **FR-024**: Las demos de la plantilla base DEBEN registrarse solo en desarrollo, bajo `/dev`, y NO DEBEN incluirse en la compilación de producción.
- **FR-025**: Cada sección DEBE cargarse bajo demanda, para que la primera carga solo incluya lo necesario.
- **FR-035**: DEBE existir un inicio de sesión provisional solo para desarrollo en `/dev/login` (correo y contraseña), que use el contrato de autenticación de FR-009 y dirija al inicio tras iniciar sesión. Está sujeto a FR-024: NO DEBE existir en la compilación de producción.

**Esqueleto y presentación**

- **FR-026**: El layout de la aplicación DEBE mostrar la marca PlayerTech (texto mientras no exista logo), el nombre de la academia actual, el menú definido por PlayerTech (Inicio; Configuración: Academia y Sedes), el botón de modo claro/oscuro y el menú de usuario con Cerrar sesión.
- **FR-027**: El configurador de temas de la plantilla NO DEBE estar disponible para el usuario final.
- **FR-028**: El tema DEBE usar el preset y el color primario definidos en ADR-015 (FE-06), con menú estático, aplicado a través del preset de tokens (sin sobrescribir estilos internos de los componentes).
- **FR-029**: La interfaz DEBE estar en español de Colombia: idioma de la aplicación, formatos de fecha y número, y textos propios de los componentes.
- **FR-030**: Las pantallas públicas DEBEN compartir un layout de autenticación propio según `docs/architecture/ui.md`, con el panel de marca oculto en el celular.
- **FR-031**: Todas las pantallas de esta spec DEBEN funcionar sin desbordamiento horizontal desde un ancho de 360 px y cumplir los criterios de accesibilidad del principio XIII (contraste, foco visible, etiquetas, áreas táctiles).
- **FR-032**: La preferencia de modo claro/oscuro DEBE conservarse en el navegador.

**Verificación**

- **FR-033**: DEBEN existir pruebas automáticas de los guards (cada situación de sesión y membresía), de la pantalla de retorno de enlaces (éxito de cada tipo y enlace inválido), del contexto de academia y de la traducción de errores.
- **FR-034**: DEBE existir una verificación automática o reproducible de que el código del navegador no contiene claves privilegiadas y de que las pantallas no usan el cliente del proveedor.

### Entidades principales

- **Sesión**: estado de autenticación del usuario (sin sesión, con sesión) y su identidad.
- **Contexto de academia**: academia actual del usuario (identificador, nombre) y su situación (activa, suspendida, sin academia); derivado de la membresía, nunca elegido en la interfaz.
- **Error de aplicación**: categoría estable de error (credenciales inválidas, correo no confirmado, contraseña débil, enlace inválido, sin conexión, permiso denegado, desconocido) con su mensaje en español.
- **Archivo almacenado**: clave relativa portable, tipo y tamaño, según el modelo `files` de la spec 001.
- **Entrada de navegación**: etiqueta, ruta e icono de cada opción del menú.

## Criterios de éxito *(mandatory)*

### Resultados medibles

- **SC-001**: La compilación de producción, el análisis estático y las pruebas terminan con 0 errores desde un clon limpio.
- **SC-002**: El 100% de las rutas privadas dirige al inicio de sesión cuando no hay sesión, y el 100% de las situaciones de membresía (activa, sin academia, suspendida) llega a su pantalla de destino, verificado por pruebas automáticas.
- **SC-003**: 0 claves privilegiadas en el código y en los archivos que descarga el navegador.
- **SC-004**: 0 rutas de demostración accesibles en la compilación de producción.
- **SC-005**: 0 pantallas o servicios que usen directamente el cliente del proveedor o los tipos generados.
- **SC-006**: Tras abrir un enlace de verificación válido, el owner llega al inicio con la sesión iniciada en menos de 5 segundos en el entorno local.
- **SC-007**: En un celular de 360 px de ancho, el owner llega a cualquier sección del menú en un máximo de 2 toques, sin desplazamiento horizontal.
- **SC-008**: Las HU de la Fase 1 (HU-001, HU-014 a HU-017, HU-029 a HU-032) pueden desarrollarse sin cambiar los contratos ni la estructura de esta spec, salvo por nuevas decisiones de producto.

## Supuestos

- La base de datos local de la spec 001 está disponible y sus usuarios de prueba (owners A y B) sirven para validar la navegación.
- Las herramientas concretas (análisis estático, pruebas, cliente del proveedor) son las decididas en ADR-015; el plan técnico fija sus versiones.
- Las pantallas funcionales de inicio de sesión, registro, verificación, recuperación, nueva contraseña, perfil de la academia, sedes e inicio con tareas pendientes se construyen en sus HU; aquí solo existen sus rutas con un marcador. La pantalla de retorno de enlaces, acceso denegado, academia suspendida y página no encontrada sí se construyen aquí.
- El cierre por inactividad pertenece a HU-015 y no se incluye.
- El aspecto visual es el de la base adoptada con el color primario de ADR-015; la identidad visual propia llega con T-01. Las pantallas de esta spec pasan una revisión básica de experiencia y accesibilidad, no la revisión completa de diseño de T-01.
- `docs/architecture/frontend.md` todavía describe la adopción del layout como excepción al principio V; desde la Constitución 3.1.0 ya no lo es, y se corregirá en esta spec.
- La lista de redirecciones permitidas en la configuración local de Auth (spec 001) se ajusta a los retornos reales que use esta spec.
- Validar la navegación privada exige una sesión iniciada, pero la pantalla de inicio de sesión pertenece a HU-001. **Decisión (2026-10-16):** se crea un inicio de sesión provisional **solo para desarrollo** en `/dev/login`, que usa el contrato de autenticación real con los usuarios del seed; sigue las mismas reglas que las demos (FR-024) y desaparece de la validación cuando exista HU-001.
