# Contratos de interfaz

Aprobado por el responsable el 2026-10-18 sobre las maquetas de `mockups/` (R8), con la **opción A** para las canchas. Formularios en `FormDrawer`.

## Navegación

- La barra inferior queda Inicio · Jugadores · **Actividades** · Academia · Sedes.
- Catálogo de canchas: **opción A**, pestañas Actividades | Canchas (como Jugadores | Grupos).

## Rutas

| Ruta | Pantalla |
|---|---|
| `/activities` | Pestaña Actividades: listado |
| `/activities/fields` | Pestaña Canchas: catálogo |
| `/activities/:id` | Detalle |

## Listado

- Selector Próximas | Pasadas y filtro por tipo.
- Grupos por día («Hoy», «Mañana», «Martes 20 de octubre»).
- Fila: hora · tipo · lugar, y en competencia «vs. [rival]». Las canceladas llevan el sello «Cancelada».
- Acción principal «Nueva actividad». Estado vacío con la misma acción.

## Detalle

- Tipo, fecha, inicio, fin, citación, lugar con dirección e indicaciones, rival, torneo, observaciones y estado.
- **Próxima**: Editar, Cancelar o Reactivar, y en ⋮ Eliminar.
- **Pasada**: solo Eliminar, con el aviso «Esta actividad ya pasó: no se puede modificar».

## Formulario (drawer)

- Tipo (dos botones: Entrenamiento y Competencia), fecha, hora de inicio, hora de fin y hora de citación.
- Lugar: selector agrupado en Sedes y Canchas, con «Nueva cancha» al final, que abre el drawer de cancha y vuelve con ella elegida.
- En competencia: rival y torneo. Observaciones.
- **Repetir** (solo al crear): interruptor, días de la semana (L M X J V S D, de 44 px) y fecha final. Resumen: «Se crearán N actividades».

## Canchas

Lista de nombre y ciudad, con «Nueva cancha» y ⋮ (Editar, Retirar con confirmación). Nombre repetido: error junto al campo.
