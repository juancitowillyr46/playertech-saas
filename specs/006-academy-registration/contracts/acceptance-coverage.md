# Cobertura de los criterios de aceptación

**Existe**: cubierto por la spec 001 o la 002. **Nueva**: se añade en esta spec. **QS n**: paso del `quickstart.md`.

## HU-014 — Registrar academia y owner

| Criterio | Cobertura |
|---|---|
| CA-001 Registro exitoso | Existe: `register.spec` «registra con las versiones vigentes y navega a verificar el correo»; pgTAP `020-registration`. QS 1.1 |
| CA-002 Campos obligatorios | Existe: `register.spec` «exige todos los campos y ambas aceptaciones» |
| CA-003 Contraseña | Existe: `register.spec` «rechaza una contraseña de menos de 8 caracteres y una confirmación distinta» |
| CA-004 Aceptaciones legales | Existe: `register.spec` «exige todos los campos y ambas aceptaciones» |
| CA-005 Correo ya registrado | QS 1.2 (el servidor responde igual que un registro nuevo) |
| CA-006 Verificación de correo | Existe: `callback.spec`. QS 2.1 |
| CA-007 Academia lista | Existe: pgTAP `020-registration`. QS 2.2 (SQL sobre la academia creada) |
| CA-008 Registro atómico | Existe: pgTAP `020-registration`; `register.spec` «muestra el error del registro». QS 4 |

## Reenvío del correo de verificación (regla de HU-014, FR-007 a FR-010)

| Escenario | Cobertura |
|---|---|
| Reenviar con el correo del registro | Nueva: `verify-email.spec`. QS 3.1 |
| Espera visible entre intentos | Nueva: `verify-email.spec` con reloj simulado. QS 3.2 |
| Mismo mensaje sin cuenta o ya verificada | Nueva: `supabase-auth.repository.spec` (errores ocultos). QS 3.3 |
| Límite del servidor | Nueva: `verify-email.spec` (`rate_limited`) y `supabase-auth.repository.spec` |
| Pantalla sin correo conocido | Nueva: `verify-email.spec` (campo y validación) |
| Caminos al reenvío (FR-010a) | Nueva: `login.spec` (con `email_not_confirmed`) y `callback.spec` (enlace no válido). QS 3.4 |
