# Contratos de interfaz

Aprobado por el responsable el 2026-10-18 sobre las maquetas de `mockups/` (R6). Drawers con `FormDrawer`, como en la spec 009.

## Ficha del jugador (cambia)

- Sección Acudientes:
  - **«Agregar acudiente»**: abre el selector si la academia tiene acudientes; si no, el formulario de registro (HU-034);
  - **«Copiar de un hermano»**: acción secundaria, solo si hay otros jugadores con acudientes.

## Selector de acudientes (A, DEC-43)

- Título «Agregar acudiente de [jugador]». Buscador por nombre o celular.
- Fila: nombre, celular y «Papá de Samuel V. · Mamá de…». Los que ya son de este jugador aparecen deshabilitados, con «Ya es acudiente de [jugador]».
- Al tocar una fila, se marca y aparece el **parentesco** (Mamá, Papá, Abuelo o abuela, Otro). El botón del drawer: «Asignar a [jugador]».
- Al final de la lista: «Registrar un acudiente nuevo», que cierra el selector y abre el formulario de registro.

## Copiar acudientes de un hermano (B)

- Paso 1: buscador de jugadores con acudientes (sin el actual).
- Paso 2: el hermano elegido («Cambiar» vuelve al paso 1) y sus acudientes con casilla, marcados por defecto, y un selector de parentesco por fila. Los que ya son de este jugador aparecen deshabilitados.
- El botón dice «Asignar N acudientes». Aviso: «N acudientes asignados a [jugador]».
