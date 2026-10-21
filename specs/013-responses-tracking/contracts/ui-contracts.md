# Contrato de interfaz

Sistema visual: `DESIGN.md`. Patrones: `docs/architecture/ui.md`. Textos en español de Colombia con tuteo y el vocabulario del glosario. Móvil primero (360 px), controles de al menos 44 px, claro y oscuro. Maquetas: `mockups/`.

## Página del enlace `/c/:token` (acudiente, sin cuenta)

Una sola columna, sin la navegación de la aplicación. Arriba van el nombre de la academia y la ficha de la actividad: tipo y rival, fecha, hora de llegada, inicio, lugar con su dirección e indicaciones, torneo, observaciones y «Responde hasta…».

| Estado | Contenido |
|---|---|
| **Elegir** | «¿Por quién respondes?» y la lista de convocados de esa lista («Samuel V. · Samu»), en filas de 44 px como mínimo. Al final, «Soy el jugador» como ayuda, «¿No ves a tu jugador? Escríbele a la academia» y un buscador si hay más de 12 |
| **Identificarte** | El jugador elegido y «Cambiar». Campos «¿Cómo te llamas?» (ayuda: «Basta tu nombre»; `autocomplete="name"`), «Tu celular» (`autocomplete="tel"`, teclado numérico) y «Parentesco» (Mamá, Papá, Abuelo o abuela, Otro, Soy el jugador). Con «Soy el jugador» se oculta el nombre. El formulario es igual exista o no el celular. La casilla de autorización con enlace a la Política de Tratamiento de Datos. Botón «Continuar» |
| **Responder** | Una tarjeta por jugador del dispositivo con tres botones grandes: «Sí», «Sí, provisional» y «No». En provisional y No, «Motivo (opcional)» con las opciones de DEC-38, y si se elige «Otro», el campo «Cuéntanos» (200). Botón «Enviar». Con el dispositivo recordado (varias tarjetas), «Sí» se registra al tocarlo y la tarjeta confirma «Registrado: Sí · te quedan N cambios»; «Sí, provisional» y «No» abren el motivo opcional y «Enviar» (aprobado el 2026-10-21). Muestra la respuesta actual y «Te quedan N cambios». Al final, «¿Respondes por alguien más?» |
| **Listo** | «¡Listo! Registramos que Samuel V. asiste.», con los cambios restantes y «Cambiar respuesta» |
| **Solo lectura** | «La convocatoria está cerrada» o «Se canceló la actividad», con la ficha y la respuesta propia, sin controles |
| **No disponible** | «Esta convocatoria ya no está disponible», sin ningún dato |
| **Ya no convocado** | En la tarjeta del jugador: «Ya no está convocado» |

- **Errores:** junto al campo o como mensaje arriba, sin perder lo escrito. Si llega `change_limit_reached`, aparece «Escríbele a la academia para cambiarla».
- **Privacidad:** la página nunca muestra respuestas de otros ni celulares.

## Sección «Convocatoria» (owner; se amplía)

- **Resumen** bajo el estado: «12 Sí · 2 Provisional · 1 No · 2 Sin respuesta», con «Actualizar» (icono, 44 px).
- **Por lista:** «Sub-12 · 17 convocados · 12/17». El desglose completo va solo en el resumen general (FR-010).
- **Por jugador:** una etiqueta con la respuesta (Sí, Provisional, No o Sin respuesta), el motivo abreviado y «sin validar» cuando corresponde. «Enviar» se mantiene. Al tocar el nombre se abre el drawer del jugador.

## Drawer del jugador `response-drawer` (owner)

- **Título:** «Samuel Vargas · Samu».
- **Respuesta actual:** quién la dio («Carlos Pérez · papá», o «Registrada por ti»), la hora y el motivo.
- **Pendiente:** «Carlos Pérez (papá) respondió desde un celular sin validar», más «Coincide con Claudia Restrepo, mamá de Santiago D.» si aplica. Botones «Validar» y «Rechazar» (con confirmación).
- **Historial:** de la respuesta más reciente a la más antigua, con quién y la hora. Las respuestas que no cuentan se ven tachadas.
- **«Registrar respuesta»:** las tres opciones, el motivo y «Guardar». Aviso: «No cuenta para los cambios del acudiente.»

## Ficha del jugador (owner; se amplía)

Un bloque **«Por validar»** arriba de «Acudientes», con cada pendiente (nombre declarado, parentesco, celular y la coincidencia si la hay) y los botones «Validar» y «Rechazar».

## Lista de actividades (owner; se amplía)

En las convocadas, la columna de estado muestra «12/17» (confirmados sobre convocados) en lugar de «Convocada». «Cancelada» y «Por convocar» no cambian.
