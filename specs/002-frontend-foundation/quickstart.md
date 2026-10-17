# Validación rápida: Base del frontend y esqueleto de PlayerTech

Guía para comprobar de punta a punta que la spec funciona. No contiene implementación.

## Prerrequisitos

- **Node 24 LTS** (`node --version`; ver `research.md`, R1).
- Docker Desktop en ejecución y Supabase local levantado con los datos de la spec 001: desde la raíz, `npm run db:start` y `npm run db:reset`.
- Dependencias del frontend: `cd frontend && npm install`.
- Visor de correo local: la URL `MAILPIT_URL` de `npm run db:status` (normalmente http://127.0.0.1:54324).

## 1. Controles de calidad (Historia 1, CA-009)

Desde `frontend/`:

```bash
npm run build        # compilación de producción
npm run lint         # análisis estático
npm run test:ci      # pruebas (sin navegador)
npm run check:bundle # sin claves privilegiadas ni demos en dist/
```

**Resultado esperado:** los cuatro terminan sin errores. La compilación informa un bundle inicial menor de 1 MB.

## 2. Pantallas de autenticación (Historia 7)

Con `npm start` (http://localhost:4200):

| Paso | Resultado esperado |
|---|---|
| Abrir `/auth/register` | Formulario con nombre de la academia, tu nombre, correo, contraseña, confirmación y las dos aceptaciones con enlaces a sus versiones vigentes |
| Enviar con la contraseña de 7 caracteres, confirmación distinta o sin una aceptación | Error bajo el campo correspondiente; no se envía |
| Registrar `prueba.1@playertech.test` con datos válidos | Pantalla "Verifica tu correo" con el correo indicado |
| En `/auth/login`, intentar entrar antes de verificar | "Debes verificar tu correo antes de iniciar sesión…" |
| En `/auth/login`, entrar con `owner.a@playertech.test` y una contraseña incorrecta | "El correo o la contraseña no son correctos." |
| Entrar con `owner.a@playertech.test` y la contraseña del seed (`supabase/README.md`) | Llega a `/home` con "Academia A" en la barra superior |
| En `/auth/forgot-password`, pedir recuperación de un correo inexistente y de uno existente | El mismo mensaje de confirmación en ambos casos (DEC-12) |

## 3. Retorno desde los enlaces de correo (Historia 3)

1. En el visor de correo, abrir el correo de verificación de `prueba.1@playertech.test` y pulsar el enlace **en el mismo navegador** → "Verificando…" y llegada a `/home` en menos de 5 segundos; la barra de direcciones ya no contiene `code` (SC-006). La academia "nueva" aparece en la barra superior.
2. Abrir de nuevo el mismo enlace → "El enlace venció o ya fue usado." con enlace al inicio de sesión.
3. Abrir `/auth/callback` sin parámetros → mismo mensaje.
4. Cerrar sesión, registrar `prueba.2@playertech.test` y abrir su enlace en **otro navegador** (o en una ventana privada) → mensaje de "otro navegador". Después, en el navegador original, iniciar sesión con esa cuenta funciona: el correo sí quedó verificado.
5. Cerrar sesión, pedir la recuperación de `prueba.1@playertech.test`, abrir el enlace en el mismo navegador → llega a `/auth/reset-password`; establecer una contraseña nueva con su confirmación → llega a `/home`; cerrar sesión e iniciar con la nueva contraseña funciona.

## 4. Acceso protegido (Historia 2, CA-008)

| Paso | Resultado esperado |
|---|---|
| Sin sesión, abrir `/settings/venues` | Llega a `/auth/login?returnUrl=%2Fsettings%2Fvenues`; tras iniciar sesión vuelve a `/settings/venues` |
| Abrir `/` sin sesión | Llega a `/auth/login` |
| Abrir `/ruta-que-no-existe` | Página no encontrada de PlayerTech, con enlace al inicio |
| Con sesión, abrir `/auth/login` | Vuelve a `/home` |
| Suspender la academia A (`update public.academies set status = 'suspended' where slug = 'academia-a';` en Studio) y **recargar** `/home` con la sesión de owner A | Pantalla de academia suspendida, con **Cerrar sesión** |
| Reactivarla, desactivar la membresía (`update public.academy_members set status = 'disabled' where user_id = 'aaaaaaaa-0000-4000-8000-00000000000a';`) y recargar | Pantalla de acceso denegado, con **Cerrar sesión** |

Al terminar, `npm run db:reset` (desde la raíz) restaura el estado del seed.

## 5. Navegación base (Historia 4)

Con sesión de owner A, en escritorio y con las herramientas del navegador en **360 px** de ancho:

- Menú con **Inicio** y **Configuración → Academia, Sedes**; cada entrada abre su marcador en máximo 2 toques (SC-007). En desarrollo aparece además la sección **Demos**.
- Sin desplazamiento horizontal en ninguna pantalla, incluidas las de autenticación.
- Botón claro/oscuro cambia el modo; tras recargar, se conserva.
- No aparece el configurador de temas.
- **Cerrar sesión** desde el menú de usuario lleva a `/auth/login`.
- Textos en español; el título de la pestaña es "PlayerTech".
- En 360 px, las pantallas públicas ocultan el panel de marca.

## 6. Demos solo en desarrollo (Historia 6)

- Con `npm start`: `/dev` muestra las demos de SakaiNG, y solo ellas.
- Producción: `npm run build` y `npm run check:bundle` confirman que las demos y la sección "Demos" del menú no están en `dist/`. La verificación es estática: la configuración de producción no tiene conexión hasta crear el entorno en la nube (ADR-016) y la aplicación no arranca sin ella (FR-007), que es el comportamiento esperado.

## 7. Arquitectura (Historia 5)

- `npm run lint` falla si una pantalla o servicio importa el cliente de Supabase o los tipos generados (prueba: añadir temporalmente una importación en `features/home` y ejecutar `lint`; después retirarla).
- `npm run test:ci` incluye las pruebas de guards, retorno de enlaces, repositorios, contexto de academia, pantallas de autenticación y traducción de errores (FR-033).
