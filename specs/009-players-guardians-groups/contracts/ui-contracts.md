# Contratos de interfaz

Aprobado por el responsable el 2026-10-18 sobre las maquetas de `mockups/` (R9): **navegación B** y **formularios en drawer**. Patrón de página de gestión de `docs/architecture/ui.md`, el mismo de Sedes (spec 004). Textos en español de Colombia. Móvil primero (360 px).

## Navegación (opción B)

- `APP_NAVIGATION` → grupo General: **Inicio** y **Jugadores** (`/players`, icono `pi-users`). Configuración no cambia (Academia y Sedes).
- Navegación inferior en móvil (derivada del menú): Inicio · Jugadores · Academia · Sedes. La spec 2 añade Actividades, y cuando haya más de 5 destinos se aplica «Más» (`ui.md`).
- Dentro de Jugadores, **pestañas** «Jugadores» y «Grupos» (`p-tabs` con enlaces a rutas). El destino Jugadores queda activo en ambas.
- Se actualiza el esquema de navegación de `docs/architecture/ui.md`.

## Rutas

| Ruta | Pantalla | HU |
|---|---|---|
| `/players` | Pestaña Jugadores: listado | HU-003 (registrar: drawer, HU-002) |
| `/players/groups` | Pestaña Grupos: listado | HU-004 |
| `/players/groups/:id` | Grupo con sus integrantes | HU-004 |
| `/players/:id` | Ficha del jugador, con sus acudientes | HU-033, HU-034 |

`groups` se declara antes de `:id`. Todas bajo el guard de academia activa.

## Drawers (formularios)

Todos son `p-drawer` a la derecha: unos 480 px en escritorio y pantalla completa en móvil. Piden confirmación al cerrar con cambios sin guardar (CA-005 de HU-033), como en Sedes.

| Drawer | Dónde se abre | Campos |
|---|---|---|
| Registrar o editar jugador | Listado (Registrar) y ficha (Editar) | Nombres*, apellidos*, apodo, fecha de nacimiento*, celular (opcional), grupos (selección múltiple) |
| Agregar o editar acudiente | Ficha | Celular*, nombre completo*, parentesco* (Mamá, Papá, Abuelo o abuela, Otro) y, al agregar, la casilla obligatoria de autorización con el enlace a la Política |
| Crear o renombrar grupo | Pestaña Grupos y página del grupo | Nombre* |
| Agregar jugadores al grupo | Página del grupo | Buscador y lista con casillas; el botón dice «Agregar N jugadores» |

## Listado de jugadores

- Buscador (nombre, apellido o apodo, sin tildes), filtro por grupo y por estado (activos por defecto) y el conteo de lo visible.
- Fila (móvil): «Nombre I. · Apodo», edad, grupos y número de acudientes; los inactivos, con el sello «Inactivo». En escritorio, la tabla del patrón.
- Acción principal «Registrar jugador». Estado vacío con la misma acción.

## Jugador ya registrado (DEC-42)

Aviso en el drawer «Este jugador ya está registrado», con sus datos (nombre, fecha, grupos, estado), y dos acciones:

- «Actualizar sus datos», o «Reactivarlo y actualizar» si está inactivo: guarda lo escrito sobre el jugador existente;
- «Cancelar».

## Ficha del jugador

- Datos: apodo, edad, fecha, celular, grupos y estado. Acciones Editar y Desactivar o Activar (sin confirmación); en ⋮, Eliminar (confirmación con su nombre).
- Sección «Acudientes»: nombre, parentesco, celular y «También de [jugador]» si acompaña a otros; ⋮ con Editar y Retirar (con confirmación). Acción «Agregar acudiente».
- Celular de acudiente ya registrado: al escribirlo, aviso «Este celular es de [nombre], ya registrado»; el nombre queda de solo lectura y se vincula a esa persona. Al editar un acudiente con el celular de otra persona: «Ese celular ya es de otro acudiente» junto al campo (`duplicate`).

## Grupos

- Listado: nombre y número de jugadores activos; acción «Crear grupo». Nombre repetido: error junto al campo.
- Página del grupo: integrantes con «Quitar» (sin confirmación), y los inactivos con el sello «Inactivo»; ⋮ con Renombrar y Eliminar (confirmación: «los jugadores siguen registrados»); acción «Agregar jugadores».
