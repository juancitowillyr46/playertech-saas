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
| 1.2 | Registrar de nuevo con `owner.a@playertech.test` y luego con `  OWNER.A@playertech.test ` (mayúsculas y espacios) | Se queda en el registro con «Ya existe una cuenta con este correo.» junto al campo y enlaces a iniciar sesión y recuperar la contraseña; por SQL, el owner A sigue con una sola academia |
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

Ejecución del 2026-10-18 contra Supabase local, sin `db:reset`, con un navegador sin interfaz a 360 px.

| Sección | Resultado |
|---|---|
| 1. Registro | ✓ 1.1. 1.2: primero se encontró que la interfaz mostraba «Ocurrió un error inesperado» con un correo existente. Luego el responsable de producto cambió CA-005 (2026-10-18): ahora el registro muestra «Ya existe una cuenta con este correo.» junto al campo, con enlaces, y no crea nada ✓. 1.3: unos 4 s automatizado; el tiempo humano lo valida el owner (SC-001) |
| 2. Verificación y academia lista | ✓ El enlace activa la cuenta y entra al inicio; la academia tiene el nombre, plan `free`, «Sede principal» `training_ground` principal y el correo de contacto del registro |
| 3. Reenvío | ✓ 3.1 y 3.2: espera inicial de 1:00, segundo correo en Mailpit en unos 1,5 s (SC-005) y el enlace reenviado activa la cuenta. ✓ 3.3: mismo mensaje con un correo inexistente (sin correo enviado) y con una cuenta ya verificada. ✓ 3.4: el inicio de sesión ofrece el reenvío con el correo escrito y el enlace usado lleva a verificar correo |
| 4. Registro atómico | ✓ Registro sin `academy_name` contra Auth: HTTP 500 y ningún usuario ni aceptación restante |
| 5. Experiencia y accesibilidad | ✓ Detector de Impeccable sin hallazgos; sin desbordamiento a 360 px en claro y oscuro. Las casillas de aceptación miden 28 px, pero su fila (etiqueta incluida) mide 44 px y la etiqueta las marca con clic. El toque emulado no fue concluyente: queda para la prueba del owner en el celular |

**Notas**

- Prueba del owner desde el celular (2026-10-18): los enlaces de los correos pedidos desde el celular volvían a la raíz (`http://localhost:4200`) porque el Auth local no aceptó el retorno con la IP de la red, y apuntaban a `127.0.0.1`, que el celular no abre. Un enlace viejo, ya invalidado por el reenvío, terminaba en la raíz sin explicación. **Corregido en la app**: la raíz lleva `code` o `error` a `/auth/callback`, que muestra «Enlace no válido». El servidor sí invalida el enlace anterior al reenviar (registro de Auth: «One-time token not found»), así que no hace falta una lista negra propia.

- Corrección relacionada con la spec 005: la pantalla de «Enlace no válido» solo ofrecía iniciar sesión, aunque HU-016 CA-005 pide poder solicitar un enlace nuevo. Ahora ofrece «Reenviar el correo de verificación» y «Recuperar mi contraseña».
- Cuentas `qa.*@playertech.test` eliminadas; las academias A y B siguen `active`.
- Conjunto completo (una sola vez): 231/231 pruebas, 144 pgTAP, `lint`, `check:styles`, `build` (bundle inicial de 950,1 kB) y `check:bundle` en verde.
