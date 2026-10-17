# Contrato: errores de aplicación

Los repositorios convierten cualquier error del proveedor en un `AppError` con un `code` estable (FR-015). Las pantallas muestran `message` y nunca detalles técnicos.

| `code` | Origen típico en Supabase | Mensaje (es-CO) |
|---|---|---|
| `invalid_credentials` | Auth `invalid_credentials` | El correo o la contraseña no son correctos. |
| `email_not_confirmed` | Auth `email_not_confirmed` | Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada. |
| `weak_password` | Auth `weak_password` | La contraseña debe tener al menos 8 caracteres. |
| `link_invalid` | Auth `otp_expired`, `bad_code_verifier` o código rechazado; parámetros `error` en la URL | El enlace venció o ya fue usado. |
| `other_browser` | Auth `flow_state_not_found` o `pkce_code_verifier_not_found` (falta el verificador PKCE en este navegador) | Abriste el enlace en otro navegador. (Texto completo en [routes.md](routes.md)) |
| `rate_limited` | Auth `over_email_send_rate_limit`, `over_request_rate_limit` | Hiciste demasiados intentos. Espera unos minutos y vuelve a intentarlo. |
| `network` | Fallo de `fetch` (sin conexión) | No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo. |
| `forbidden` | PostgreSQL `42501` (RLS o privilegios) | No tienes permiso para realizar esta acción. |
| `unknown` | Cualquier otro | Ocurrió un error inesperado. Inténtalo de nuevo. |

Reglas:
- `cause` conserva el error original para el registro en consola; nunca se muestra.
- El registro de una cuenta con un correo ya existente no produce un error distinguible (DEC-12): la pantalla de HU-014 muestra el mismo mensaje que en un registro correcto.
- El `GlobalErrorHandler` usa el mensaje de `unknown` para cualquier error no controlado.
