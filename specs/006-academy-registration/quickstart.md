# Guía de validación: Alta de academia

## Requisitos

- Supabase local en marcha. **No** hace falta `db:reset`.
- Servidor de desarrollo en `frontend/` y Mailpit en `http://localhost:54324`.
- Cada enlace de correo se abre **en el mismo navegador** que lo pidió (PKCE).

## Pruebas automáticas

Durante el desarrollo: `npx ng test --watch=false --include src/app/features/auth --include src/app/core/auth`. Una vez antes del commit: `npm run test:ci`, `lint`, `check:styles`, `build`, `check:bundle` y `npm run db:test` desde la raíz.

## 1. Registro (CA-001, CA-005)

| # | Pasos | Resultado esperado |
|---|---|---|
| 1.1 | Registrar `qa.<marca>@playertech.test` con todos los datos | Pantalla de verificar correo con ese correo; llega el correo a Mailpit |
| 1.2 | Registrar de nuevo con `owner.a@playertech.test` y luego con `  OWNER.A@playertech.test ` (mayúsculas y espacios) | Exactamente la misma pantalla que en 1.1 en ambos casos; por SQL, el owner A sigue con una sola academia |
| 1.3 | Medir el tiempo desde abrir el registro hasta ver verificar correo | Menos de 3 minutos (SC-001) |

## 2. Verificación y academia lista (CA-006, CA-007)

| # | Pasos | Resultado esperado |
|---|---|---|
| 2.1 | Abrir el enlace de 1.1 en el mismo navegador | Entra al inicio de su academia |
| 2.2 | SQL sobre la academia de la cuenta de 1.1 | Nombre registrado, plan Free, una sede «Sede principal» de tipo lugar de entrenamiento y correo de contacto igual al del registro |

## 3. Reenvío

| # | Pasos | Resultado esperado |
|---|---|---|
| 3.1 | Registrar otra cuenta de prueba; en verificar correo, esperar a que termine la cuenta regresiva y tocar «Reenviar correo» | Mensaje genérico; llega un segundo correo; su enlace activa la cuenta |
| 3.2 | Justo después de 3.1 | Botón deshabilitado con «Reenviar en m:ss» |
| 3.3 | Abrir `/auth/verify-email` sin parámetro, escribir un correo no registrado y luego el del owner A (ya verificado), reenviando cada vez tras la espera | El mismo mensaje genérico; ningún correo para cuentas inexistentes |
| 3.4 | Con una cuenta sin verificar, intentar iniciar sesión y tocar «Reenviar el correo de verificación»; luego abrir un enlace de verificación ya usado y tocar el mismo enlace | Ambos llevan a verificar correo (el primero con el correo ya puesto) |
| 3.5 | Medir desde tocar «Reenviar correo» hasta tener el correo en Mailpit | Menos de 2 minutos (SC-005) |

## 4. Registro atómico (CA-008)

Llamar a la API de registro de Auth local con metadatos inválidos (por ejemplo, sin `academy_name`) para un correo nuevo. Esperado: error y, por SQL, ningún usuario, academia ni aceptación con ese correo.

## 5. Experiencia y accesibilidad

Registro y verificar correo a 360 px y en escritorio, en modo claro y oscuro: detector de Impeccable, sin desbordamiento, controles de al menos 44 px, revisión visual de la cuenta regresiva y los mensajes.

Al terminar, eliminar solo las cuentas `qa.*@playertech.test` creadas y comprobar que las academias A y B siguen `active`.

## Resultados

*(se completa al implementar)*
