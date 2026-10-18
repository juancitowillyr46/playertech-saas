# Investigación: Alta de academia

## R1 — Sin migraciones

- **Decisión**: no se toca la base de datos.
- **Motivo**: la función de registro de la spec 001 ya crea en una sola transacción la cuenta, el perfil, la academia (con el correo de contacto del registro), la membresía de owner, la suscripción Free, la sede principal y las aceptaciones legales. `supabase/tests/database/020-registration.test.sql` lo cubre.
- **Qué falta**: comprobar de punta a punta lo que ve el visitante (CA-005, CA-007, CA-008).

## R2 — Reenvío con el mecanismo nativo

- **Decisión**: `SupabaseAuthRepository.resendVerification(email)` llama a `auth.resend({ type: 'signup', email, options: { emailRedirectTo: <origen>/auth/callback } })`.
- **Motivo**: con el flujo PKCE, `resend` envía el desafío de código igual que el registro. El enlace reenviado llega a `/auth/callback` con `code` y lo maneja el retorno existente. Como el verificador queda en el navegador que pidió el reenvío, el enlace debe abrirse ahí, igual que hoy.
- **Alternativas**: una función propia en el servidor, innecesaria porque Auth ya lo resuelve y limita los envíos.

## R3 — Errores del reenvío sin revelar cuentas (DEC-12)

- **Decisión**: el mismo patrón que `requestPasswordReset`. Solo se muestran los errores `rate_limited` y `network`; cualquier otro (cuenta inexistente o ya verificada) se resuelve como éxito.
- **Motivo**: FR-009 y FR-010. El mapeo de `over_email_send_rate_limit` y `over_request_rate_limit` a `rate_limited` ya existe.

## R4 — Pantalla de verificar correo

- **Decisión**:
  - El correo viene del parámetro `email` (lo pone el registro). Si falta, se muestra un campo de correo con validación.
  - Botón «Reenviar correo». Tras un envío, o al llegar desde el registro (que acaba de enviar uno), se deshabilita 60 s y muestra «Reenviar en 0:59…». Al terminar vuelve a «Reenviar correo».
  - Mensaje tras el envío, siempre igual: «Si tu cuenta está pendiente de verificar, te enviamos un enlace nuevo. Ábrelo desde este mismo navegador. Si ya la verificaste, inicia sesión.»
  - `rate_limited`: «Espera un momento antes de pedir otro correo.», o el mensaje existente del catálogo si ya lo cubre. `network`: el mensaje del catálogo.
  - El contador vive en la pantalla (signal más intervalo de 1 s, limpiado al destruir). No se guarda entre recargas: el límite del servidor sigue protegiendo.
- **Motivo**: la espera inicial evita un segundo envío inmediato tras el registro, que el servidor rechazaría (límite por correo), y anticipa ese rechazo con un mensaje claro.

## R4b — Caminos al reenvío

- **Decisión**: enlaces a `/auth/verify-email` desde el aviso de correo sin verificar del inicio de sesión (con el correo escrito) y desde la pantalla de enlace no válido del retorno.
- **Motivo**: sin ellos, el reenvío solo sirve justo después del registro. Además, el enlace «Solicitar un enlace nuevo» del retorno llevaba a recuperar contraseña, lo que confunde a quien tenía un enlace de verificación vencido; se renombra a «Recuperar mi contraseña».

## R5 — Verificación de los criterios existentes

Se añaden solo las pruebas que faltan según `contracts/acceptance-coverage.md`:

- `verify-email.spec` (nueva): muestra el correo, reenvía, espera y mensajes;
- `supabase-auth.repository.spec`: `resend` con el retorno a `/auth/callback` y errores ocultos.

Lo que depende del servidor (CA-005, CA-006, CA-007, CA-008) se recorre en el quickstart:
- CA-005, con un correo existente;
- CA-007, consultando la academia por SQL;
- CA-008, provocando un fallo de la función de registro con metadatos inválidos enviados directamente a Auth (sin interfaz) y comprobando que no queda nada. El mensaje de la interfaz se cubre con la prueba existente «muestra el error del registro».

## R6 — Revisión de experiencia y accesibilidad

El detector de Impeccable más la medición a 360 px (desbordamiento, controles de al menos 44 px) en claro y oscuro, y la revisión visual de ambas pantallas. Se corrigen los hallazgos críticos y altos en los tres sitios de estilos.
