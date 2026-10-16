# Especificación de funcionalidad: Admin Login

**Feature Branch**: `001-admin-login`

**Created**: 2026-10-03

**Status**: Draft

**Input**: Descripción del usuario: "Implementar HU-001 — Admin Login."

## Escenarios de usuario y pruebas *(mandatory)*

### Historia de usuario 1 - Acceder a la gestión privada (Prioridad: P1)

Como administrador, quiero iniciar sesión con mi correo electrónico y contraseña para acceder de
forma segura a la gestión de mi academia.

**Motivo de prioridad**: El acceso autenticado es la puerta de entrada a todas las funcionalidades
privadas del MVP.

**Prueba independiente**: Un administrador con credenciales válidas inicia sesión y puede acceder a una
funcionalidad privada.

**Escenarios de aceptación**:

1. **Dado** que el administrador tiene credenciales válidas, **cuando** ingresa su correo electrónico
   y contraseña y confirma el inicio de sesión, **entonces** el sistema lo autentica y le permite acceder
   a la aplicación privada.
2. **Dado** que el administrador ya tiene una sesión autenticada, **cuando** accede a una
   funcionalidad privada, **entonces** el sistema le permite continuar sin solicitar credenciales otra vez.

---

### Historia de usuario 2 - Corregir errores de inicio de sesión (Prioridad: P2)

Como administrador, quiero recibir mensajes claros cuando no pueda iniciar sesión para saber cómo
corregir la información ingresada.

**Motivo de prioridad**: Evita intentos ambiguos y permite recuperar el flujo de acceso sin exponer
información sensible.

**Prueba independiente**: El administrador prueba credenciales inválidas y campos incompletos, y observa
un mensaje comprensible sin obtener acceso privado.

**Escenarios de aceptación**:

1. **Dado** que el administrador deja vacío el correo electrónico, la contraseña o ambos, **cuando**
   intenta iniciar sesión, **entonces** el sistema indica los campos obligatorios y no intenta acceder a
   la aplicación privada.
2. **Dado** que el administrador proporciona credenciales incorrectas, **cuando** intenta iniciar
   sesión, **entonces** el sistema rechaza el acceso y muestra un mensaje que indica que las credenciales
   no son válidas.
3. **Dado** que ocurre un error que impide completar el inicio de sesión, **cuando** el sistema no
   puede determinar que las credenciales son válidas, **entonces** mantiene al administrador fuera de las
   funcionalidades privadas y muestra un mensaje comprensible sin revelar detalles sensibles.

---

### Historia de usuario 3 - Proteger funcionalidades privadas (Prioridad: P3)

Como administrador no autenticado, quiero que las funcionalidades privadas soliciten autenticación
para impedir el acceso no autorizado.

**Motivo de prioridad**: La protección de acceso es necesaria para que el inicio de sesión tenga valor
de seguridad.

**Prueba independiente**: Una persona sin sesión intenta abrir una funcionalidad privada directamente y
es dirigida al inicio de sesión sin acceder al contenido protegido.

**Escenarios de aceptación**:

1. **Dado** que no existe una sesión autenticada, **cuando** una persona intenta acceder directamente
   a una funcionalidad privada, **entonces** el sistema impide el acceso y solicita autenticación.
2. **Dado** que una sesión deja de ser válida mientras el administrador usa una funcionalidad
   privada, **cuando** intenta continuar con una acción protegida, **entonces** el sistema impide continuar
   y solicita autenticación nuevamente.

### Casos límite

- El correo electrónico contiene espacios iniciales o finales: el sistema los ignora para evaluar si
  el campo fue proporcionado.
- Una persona intenta acceder repetidamente con credenciales inválidas: cada intento permanece sin
  acceso a funcionalidades privadas y muestra un mensaje comprensible.
- Las credenciales son válidas pero el usuario no tiene una membresía activa: el sistema lo considera
  autenticado, muestra acceso denegado, conserva la sesión y no le permite acceder a funcionalidades
  privadas ni asigna o asume una academia.

## Requisitos *(mandatory)*

### Requisitos funcionales

- **FR-001**: El sistema DEBE permitir que un administrador ingrese correo electrónico y contraseña
  para solicitar el inicio de sesión.
- **FR-002**: El sistema DEBE requerir ambos campos antes de aceptar una solicitud de inicio de
  sesión.
- **FR-003**: El sistema DEBE permitir acceso a funcionalidades privadas únicamente después de un
  inicio de sesión válido.
- **FR-004**: El sistema DEBE rechazar credenciales inválidas y mostrar un mensaje comprensible que
  no revele si un correo electrónico está registrado.
- **FR-005**: El sistema DEBE impedir el acceso directo a funcionalidades privadas sin una sesión
  autenticada y solicitar autenticación.
- **FR-006**: El sistema DEBE conservar al administrador en una funcionalidad privada mientras su
  sesión sea válida.
- **FR-007**: El sistema DEBE solicitar autenticación nuevamente cuando la sesión deje de ser válida
  antes de permitir una nueva acción protegida.
- **FR-008**: El sistema DEBE tratar la autenticación como distinta de la pertenencia a una academia.
- **FR-009**: Cuando una identidad autenticada no tenga una membresía activa, el sistema DEBE mostrar
  acceso denegado, mantener su sesión y no permitirle acceder a funcionalidades privadas ni asignar
  o asumir una academia.

### Entidades principales

- **Administrador autenticado**: Persona cuya identidad fue validada y puede solicitar acceso a las
  funcionalidades privadas.
- **Sesión autenticada**: Estado que representa que el administrador inició sesión y conserva acceso
  mientras siga siendo válida.
- **Membresía de academia**: Relación entre una identidad autenticada y una academia; determina la
  pertenencia al tenant, no la validez de las credenciales.

## Criterios de éxito *(mandatory)*

### Resultados medibles

- **SC-001**: El 100% de intentos con ambos campos vacíos o incompletos permanece fuera de las
  funcionalidades privadas y muestra los campos requeridos.
- **SC-002**: El 100% de intentos con credenciales inválidas permanece fuera de las funcionalidades
  privadas y recibe un mensaje comprensible.
- **SC-003**: El 100% de intentos de acceso directo sin sesión a una funcionalidad privada solicita
  autenticación antes de mostrar contenido protegido.
- **SC-004**: En pruebas de aceptación, un administrador con credenciales válidas puede completar el
  inicio de sesión y llegar a una funcionalidad privada en menos de un minuto.

## Supuestos

- El actor de esta funcionalidad es el administrador definido en HU-001.
- La recuperación de contraseña, registro público y proveedores externos de inicio de sesión están
  fuera del alcance de esta funcionalidad.
- La resolución del contexto de academia y la experiencia para múltiples membresías no forman parte
  de esta especificación. En el MVP, un usuario pertenece a una sola academia mediante una relación
  explícita de membresía.
- Los usuarios de plataforma sin membresía de academia para administración centralizada son una
  evolución futura y están fuera del alcance de HU-001 y del MVP.
