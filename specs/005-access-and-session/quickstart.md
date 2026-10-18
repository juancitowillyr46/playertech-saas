# Guía de validación: Acceso y sesión

## Requisitos

- Supabase local en marcha (`npm run db:start` desde la raíz). **No** hace falta `db:reset`.
- Servidor de desarrollo accesible desde el celular (`npx ng serve --host 0.0.0.0` en `frontend/`).
- Buzón de correo local de Supabase (Mailpit) en `http://localhost:54324`.
- Cuentas del seed: `owner.a@playertech.test` y `owner.b@playertech.test`, contraseña `PlayerTech-Local-2026`.

## Pruebas automáticas

Durante el desarrollo, desde `frontend/`:

```bash
npm run test:changed
npx ng test --watch=false --include src/app/core/auth --include src/app/features/auth
```

Una vez, antes del commit: `npm run test:ci`, `npm run lint`, `npm run check:styles`, `npm run build` y `npm run check:bundle`.

## 1. Cierre por inactividad (HU-015 CA-003 y CA-004, HU-001 CA-006)

Preparación: en `frontend/src/environments/environment.development.ts`, `sessionInactivityMinutes: 2`. **Regresarlo a 60 al terminar.**

| # | Pasos en el celular | Resultado esperado |
|---|---|---|
| 1.1 | Ingresar con el owner A y dejar el celular quieto, con la pantalla encendida, 2 minutos y medio | Inicio de sesión con el aviso «Tu sesión se cerró por inactividad…» |
| 1.2 | Ingresar y tocar o desplazarse cada minuto durante 4 minutos | La sesión sigue abierta |
| 1.3 | Ingresar, bloquear el celular 3 minutos y desbloquearlo | Inicio de sesión con el aviso, sin mostrar antes datos de la academia |
| 1.4 | Ingresar, cerrar la pestaña, abrirla de nuevo después de 3 minutos | Inicio de sesión con el aviso |
| 1.5 | Ingresar, cerrar la pestaña y abrirla antes de 2 minutos | Entra sin credenciales (CA-006) |
| 1.6 | En el PC, abrir PlayerTech en dos pestañas y trabajar solo en una durante 4 minutos | Ninguna pestaña cierra la sesión |
| 1.7 | Cerrar sesión de forma manual | Inicio de sesión **sin** el aviso de inactividad |

## 2. Cerrar sesión (HU-015 CA-001 y CA-002)

| # | Pasos | Resultado esperado |
|---|---|---|
| 2.1 | Celular: menú de usuario → «Cerrar sesión» | Inicio de sesión |
| 2.2 | Tras 2.1, botón «atrás» del navegador varias veces | Nunca se ven datos de la academia; se pide iniciar sesión |
| 2.3 | Tras 2.1, abrir `/settings/venues` directamente | Inicio de sesión; tras ingresar, vuelve a Sedes |
| 2.4 | Owner A con sesión en el PC y en el celular; cerrar sesión en el celular y recargar en el PC | El PC sigue con su sesión |

## 3. Iniciar sesión (HU-001)

| # | Pasos | Resultado esperado |
|---|---|---|
| 3.1 | Ingresar con el owner A | Inicio de la academia |
| 3.2 | Contraseña incorrecta; luego un correo no registrado | El mismo mensaje genérico en ambos casos |
| 3.3 | Registrar una cuenta nueva desde la interfaz sin abrir el enlace del correo e intentar ingresar | Mensaje de verificar el correo |
| 3.4 | En SQL: `update academies set status = 'suspended'` en la academia B; ingresar con el owner B. Revertir a `active` | Pantalla de academia suspendida |
| 3.5 | En SQL: `update academy_members set status = 'disabled'` del owner B; ingresar con el owner B. Revertir a `active` | Pantalla de acceso denegado |
| 3.6 | Abrir en Mailpit el correo de verificación de la cuenta de 3.3 e ingresar con ella | Cuenta verificada; se usa en la sección 4 |

## 4. Recuperar contraseña (HU-016)

| # | Pasos | Resultado esperado |
|---|---|---|
| 4.1 | «¿Olvidaste tu contraseña?» con la cuenta de 3.3 (verificada en 3.6) y con un correo no registrado | El mismo mensaje en ambos casos |
| 4.2 | Abrir el enlace de Mailpit y definir una contraseña de 7 caracteres; luego una confirmación distinta | Se indica el problema; no se cambia |
| 4.3 | Definir una contraseña válida | Confirmación del cambio |
| 4.4 | Abrir de nuevo el mismo enlace | «El enlace ya no es válido» con la opción de solicitar uno nuevo |
| 4.5 | Ingresar con la contraseña anterior y luego con la nueva | Falla la anterior; entra con la nueva |
| 4.6 | Con el owner A en sesión, pedir otra recuperación para la cuenta de prueba y abrir su enlace en ese mismo navegador | La nueva contraseña se aplica a la cuenta de prueba y nunca a la del owner A |

Al terminar, eliminar la cuenta de prueba de 3.3 (solo esa) y confirmar que las academias A y B quedan `active`.

## 5. Experiencia y accesibilidad (principio XIII)

`/impeccable audit` y `/impeccable critique` sobre inicio de sesión, recuperación, nueva contraseña, verificar correo, retorno de enlaces, acceso denegado y academia suspendida, a 360 px y en escritorio, en modo claro y oscuro. Sin hallazgos críticos ni altos sin resolver.

## Resultados

*(se completa al implementar)*
