# Contrato de UI: Flujo de Admin Login

## Propósito

Define el comportamiento observable esperado entre el administrador, la pantalla de login, las rutas
privadas y el estado de acceso denegado. Es un contrato de UI/aplicación, no un contrato HTTP o SDK.

## Envío de login

| Condición de entrada | Resultado observable |
|---|---|
| Falta correo electrónico o contraseña | Aparece retroalimentación de campo obligatorio; no procede ningún intento de autenticación. |
| Credenciales inválidas | Login permanece visible; aparece un mensaje genérico de credenciales inválidas; contenido privado permanece oculto. |
| No se puede completar la autenticación | Login permanece visible; aparece un error genérico comprensible; contenido privado permanece oculto. |
| Credenciales válidas y membresía activa | Una ruta privada está disponible dentro del contexto de academia resuelto. |
| Credenciales válidas sin membresía activa | La sesión permanece activa; aparece acceso denegado; no existe contexto de academia ni contenido privado disponible. |

## Entrada a ruta privada

| Estado del visitante | Resultado observable |
|---|---|
| Sin sesión válida | No se muestra el contenido privado solicitado; se solicita iniciar sesión. |
| Sesión válida y membresía activa | Se muestra el contenido privado solicitado. |
| Sesión válida sin membresía activa | No se muestra el contenido privado solicitado; se muestra acceso denegado. |
| La sesión expira antes de una acción protegida | La acción protegida no continúa; se solicita login. |

## Reglas de mensajes de error

- Los fallos de credenciales no deben indicar si un correo electrónico está registrado.
- Los fallos inesperados deben ser comprensibles para un administrador y no deben exponer detalles de
  proveedor, credenciales, tenant o implementación.
- El acceso denegado debe distinguir la falta de autorización de academia de credenciales inválidas.
