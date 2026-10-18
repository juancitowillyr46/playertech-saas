# Cobertura de los criterios de aceptación

Para cada criterio, la prueba automática o el paso de validación que lo demuestra (SC-007, FR-017).

- **Existe**: ya cubierto por la spec 002.
- **Nueva**: se añade en esta spec.
- **QS n**: paso del `quickstart.md`.

## HU-001 — Iniciar sesión

| Criterio | Cobertura |
|---|---|
| CA-001 Inicio válido | Existe: `login.spec` «inicia sesión y navega al inicio». QS 3 |
| CA-002 Credenciales inválidas, mensaje genérico | Existe: `supabase-auth.repository.spec` «traduce las credenciales inválidas»; `login.spec` «muestra el mensaje del error». QS 3 |
| CA-003 Campos obligatorios | Existe: `login.spec` «exige correo y contraseña antes de enviar» |
| CA-004 Correo sin verificar | Existe: `supabase-error.mapper.spec` (`email_not_confirmed`). QS 3 |
| CA-005 Acceso protegido | Existe: `auth.guard.spec` «sin sesión dirige al inicio de sesión»; `login.spec` «vuelve a la ruta solicitada» |
| CA-006 Sesión vigente | Nueva: `auth.service.spec` (restaura la sesión no vencida); `inactivity.service.spec` (regla de vigencia). QS 1 |
| CA-007 Academia suspendida | Existe: `membership.guard.spec` (`it.each`, `suspended` → `/auth/suspended`). QS 3.4 |
| CA-008 Sin membresía activa | Existe: `membership.guard.spec` (`it.each`, `none` → `/auth/access-denied`). QS 3.5 |

## HU-015 — Cerrar sesión

| Criterio | Cobertura |
|---|---|
| CA-001 Cierre manual | Nueva: `auth.service.spec` (sesión nula, navega a `/auth/login`, motivo manual). QS 2 |
| CA-002 Acceso tras cerrar sesión, botón «atrás» | Existe: `auth.guard.spec`. QS 2 en el celular y el escritorio |
| CA-003 Cierre por inactividad con aviso | Nueva: `inactivity.service.spec` (abierta, al volver de segundo plano, reloj en el futuro); `auth.service.spec` (al restaurar); `login.spec` (aviso). QS 1 |
| CA-004 La interacción reinicia el tiempo | Nueva: `inactivity.service.spec` (interacción, otra pestaña, actividad técnica no cuenta). QS 1 |
| Regla: otros dispositivos siguen | Nueva: `supabase-auth.repository.spec` (alcance local). QS 2 |

## HU-016 — Recuperar contraseña

| Criterio | Cobertura |
|---|---|
| CA-001 y CA-002 Mensaje genérico | Existe: `forgot-password.spec` y `supabase-auth.repository.spec` (DEC-12). QS 4 |
| CA-003 Nueva contraseña | Existe: `reset-password.spec` «cambia la contraseña». QS 4 |
| CA-004 Validación de la contraseña | Existe: `reset-password.spec` «exige al menos 8 caracteres…» |
| CA-005 Enlace caducado o usado | Existe: `callback.spec` (código rechazado, error en la URL); `reset-password.spec` (sin sesión de recuperación). QS 4 |
| CA-006 Acceso con la nueva contraseña | QS 4 (lo garantiza Supabase Auth) |
