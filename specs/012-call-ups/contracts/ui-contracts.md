# Contratos de interfaz

Aprobado por el responsable el 2026-10-19 sobre las maquetas de `mockups/` (R8). Drawers con `FormDrawer`.

## Detalle de la actividad: sección «Convocatoria»

- **Sin convocatoria** (actividad próxima y programada): «Convocar».
- **Con convocatoria**:
  - estado: «Abierta · responde hasta lunes 8:00 p. m.» o «Cerrada»;
  - por lista: nombre del grupo, «N convocados» y el botón «Mensaje»;
  - convocados: nombre corto · apodo, y el botón «Enviar» (al acudiente o al jugador; sin celular, «Copiar»);
  - abierta: «Ajustar convocados», «Fecha límite» y «Cerrar convocatoria» (con confirmación).

## Drawer «Convocar» y «Ajustar convocados»

- Grupos con casilla y su número de jugadores.
- Lista resultante por grupo, con «Quitar» por jugador.
- «Sumar jugador»: buscador de todos los jugadores activos; si hay varias listas, se elige en cuál queda.
- Fecha límite opcional: fecha y hora, con las mismas listas de horas que la actividad.
- El botón dice «Convocar N jugadores».

## Drawer «Mensaje» (por lista)

- «Tu texto» (textarea, 500 caracteres), que se guarda al compartir o copiar.
- Vista previa del bloque generado, en un recuadro de solo lectura.
- Botón principal «Copiar mensaje» (tu texto y el bloque), para pegarlo en el grupo (ajuste del 2026-10-19: «Compartir en el grupo» se retiró).

## «Enviar» a un convocado

Si tiene un solo acudiente, abre WhatsApp en su chat. Si tiene varios, primero un menú para elegir («Diana Gómez · Mamá», «Carlos Vargas · Papá»). Sin acudientes y con celular propio, «Enviar al jugador». Sin ninguno, «Copiar mensaje».

## Aviso de cambio o cancelación

Al guardar un cambio de fecha, hora o lugar, o al cancelar, se abre un drawer «Avisar a los convocados»: el aviso de cada lista con «Copiar aviso», y «Ahora no».

## Página pública `/c/:token`

Marca PlayerTech y «Pronto podrás responder aquí». Sin datos de la academia ni de los jugadores.
