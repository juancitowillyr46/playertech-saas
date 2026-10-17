# Validación rápida: Base del frontend y esqueleto de PlayerTech

Guía para comprobar de punta a punta que la spec funciona. No contiene implementación.

## Prerrequisitos

- **Node 24 LTS** (`node --version`; ver `research.md`, R1).
- Docker Desktop en ejecución y Supabase local levantado con los datos de la spec 001: desde la raíz, `npm run db:start` y `npm run db:reset`.
- Dependencias del frontend: `cd frontend && npm install`.

## 1. Controles de calidad (Historia 1, CA-009)

Desde `frontend/`:

```bash
npm run build        # compilación de producción
npm run lint         # análisis estático
npm test             # pruebas (sin navegador)
npm run check:bundle # sin claves privilegiadas ni demos en dist/
```

**Resultado esperado:** los cuatro terminan sin errores. La compilación informa un bundle inicial menor de 1 MB y ningún fragmento de las demos.

## 2. Acceso protegido (Historia 2, CA-008)

Con `npm start` (http://localhost:4200):

| Paso | Resultado esperado |
|---|---|
| Sin sesión, abrir `/settings/venues` | Llega a `/auth/login?returnUrl=%2Fsettings%2Fvenues` |
| Abrir `/` sin sesión | Llega a `/auth/login` |
| Abrir `/ruta-que-no-existe` | Página no encontrada de PlayerTech, con enlace al inicio |
| En `/dev/login`, iniciar sesión con `owner.a@playertech.test` (contraseña en `supabase/README.md`) | Llega a `/home` con el nombre "Academia A" en la barra superior |
| Con sesión, abrir `/auth/login` | Vuelve a `/home` |
| Suspender la academia A (Studio o SQL: `update academies set status = 'suspended' where slug = 'academia-a'`) y recargar `/home` | Pantalla de academia suspendida, con **Cerrar sesión** |
| Reactivarla y desactivar la membresía (`update academy_members set status = 'disabled' …`) y recargar | Pantalla de acceso denegado, con **Cerrar sesión** |

Al terminar, `npm run db:reset` restaura el estado del seed.

## 3. Retorno desde los enlaces de correo (Historia 3)

1. Registrar una cuenta contra la API local con `emailRedirectTo = http://localhost:4200/auth/callback` (desde la consola del navegador en `/dev` o con el script de la spec 001).
2. Abrir el correo en el visor local (URL en `npm run db:status`) y pulsar el enlace **en el mismo navegador** → "Verificando…" y llegada a `/home` en menos de 5 segundos; la barra de direcciones ya no contiene `code` (SC-006).
3. Abrir de nuevo el mismo enlace → mensaje "El enlace venció o ya fue usado" con enlace al inicio de sesión.
4. Abrir `/auth/callback` sin parámetros → mismo mensaje.
5. Repetir el registro y abrir el enlace en **otro navegador** (o en una ventana privada) → mensaje de "otro navegador"; después, iniciar sesión en `/dev/login` con esa cuenta funciona (el correo sí quedó verificado).
6. Pedir una recuperación de contraseña de esa cuenta y abrir el enlace → llega a `/auth/reset-password` (marcador de HU-016) con sesión iniciada.

## 4. Navegación base (Historia 4)

Con sesión de owner A, en escritorio y con las herramientas del navegador en **360 px** de ancho:

- Menú con **Inicio** y **Configuración → Academia, Sedes**; cada entrada abre su marcador en máximo 2 toques (SC-007).
- Sin desplazamiento horizontal en ninguna pantalla.
- Botón claro/oscuro cambia el modo; tras recargar, se conserva.
- No aparece el configurador de temas.
- **Cerrar sesión** desde el menú de usuario lleva a `/auth/login`.
- Textos en español; el título de la pestaña es "PlayerTech".
- En 360 px, las pantallas públicas ocultan el panel de marca.

## 5. Demos solo en desarrollo (Historia 6)

- Con `npm start`: `/dev` muestra las demos de SakaiNG.
- Con la configuración de producción (`npx ng serve --configuration production`): `/dev` y `/dev/login` muestran la página no encontrada. `npm run check:bundle` lo confirma sobre `dist/` sin servir la aplicación.

## 6. Arquitectura (Historia 5)

- `npm run lint` falla si una pantalla o servicio importa el cliente de Supabase o los tipos generados (prueba: añadir temporalmente una importación en `features/home` y ejecutar `lint`; después retirarla).
- `npm test` incluye las pruebas de guards, retorno de enlaces, contexto de academia y traducción de errores (FR-033).
