# Guía de validación: Gestión de la academia

## Requisitos

- Supabase local en marcha. **No** hace falta `db:reset`.
- Servidor de desarrollo en `frontend/` (`npm start`).
- Cuentas del seed: `owner.a@playertech.test` y `owner.b@playertech.test`, contraseña `PlayerTech-Local-2026`.
- Imágenes de prueba: un PNG con transparencia, una foto JPG de 2 a 5 MB (por ejemplo, del celular), un JPG de más de 5 MB y un archivo `.png` que en realidad sea texto.

## Pruebas automáticas

Durante el desarrollo: `npx ng test --watch=false --include src/app/features/academy-profile --include src/app/features/home --include src/app/core/academy-context`. Una vez antes del commit: `npm run test:ci`, `lint`, `check:styles`, `build`, `check:bundle` y `npm run db:test` desde la raíz.

## 1. Perfil (HU-017 CA-001 a CA-005)

| # | Pasos (owner A, 360 px) | Resultado esperado |
|---|---|---|
| 1.1 | Abrir Configuración → Academia | Nombre, logo o iniciales, teléfono, correo de contacto, dirección, ciudad y plan |
| 1.2 | Cambiar teléfono, dirección y ciudad y guardar | «Cambios guardados.»; al recargar, los datos siguen |
| 1.3 | Cambiar el correo de contacto, guardar, cerrar sesión y entrar con `owner.a@playertech.test` | Entra; el correo de inicio de sesión no cambió |
| 1.4 | Vaciar el nombre y guardar; luego un correo inválido | Error junto al campo; no se guarda |
| 1.5 | Cambiar un dato y volver al inicio sin guardar | Confirmación de cambios sin guardar |
| 1.6 | Desde el inicio, tocar «Teléfono y dirección de la academia», completar ambos y guardar; medir el tiempo | Menos de 2 minutos (SC-001); el campo de dirección explica que es la de contacto y enlaza a Sedes |

## 2. Logo (HU-017 CA-006 a CA-008)

| # | Pasos | Resultado esperado |
|---|---|---|
| 2.1 | Subir el PNG; luego reemplazarlo por la foto JPG | Se ve el nuevo logo en el perfil, la barra superior y el inicio. Por SQL: un registro vigente y el anterior con `deleted_at`. En el almacenamiento: solo existe la imagen vigente |
| 2.2 | Subir el JPG de más de 5 MB y el falso `.png` | Mensajes de tamaño y de formato; el logo actual se conserva |
| 2.3 | Retirar el logo y confirmar | Iniciales en el perfil y el inicio; por SQL: `logo_file_id` nulo y el registro con `deleted_at`; la imagen ya no está en el almacenamiento |
| 2.4 | Revisar lo guardado de la foto JPG y del PNG | Lado mayor de 512 px como máximo; JPG de menos de 200 KB y PNG de menos de 500 KB (SC-003a); el PNG conserva la transparencia |

## 3. Aislamiento (HU-017 CA-009)

Con el owner B, el perfil muestra solo la academia B. Por la API, con la sesión de B, un `update` sobre la academia A no afecta ninguna fila.

## 4. Inicio (HU-032)

| # | Pasos | Resultado esperado |
|---|---|---|
| 4.1 | Con la academia A sin logo, sin teléfono y con la sede principal sin dirección, abrir el inicio | «1 de 4»; Academia creada completa y las otras tres pendientes con su enlace |
| 4.2 | Tocar cada tarea pendiente | Llega a Sedes o al perfil, según la tarea |
| 4.3 | Completar la dirección de la sede, el logo y los datos de contacto, y volver al inicio | El progreso avanza y, con 4 de 4, la tarjeta desaparece |

Al terminar, restaurar los datos de la academia A como estaban (registrarlos antes de empezar).

## 5. Experiencia y accesibilidad

Perfil e inicio a 360 px y en escritorio, en claro y oscuro: detector de Impeccable, sin desbordamiento, controles de al menos 44 px, revisión visual del logo, de los errores y de la tarjeta en sus estados.

## Resultados

*(se completa al implementar)*
