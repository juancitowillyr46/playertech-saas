# Guía de validación: Respuesta del acudiente y seguimiento

## Requisitos

- Supabase local con la migración nueva (`npx supabase migration up`) y `npm run db:types`.
- La academia C local con una convocatoria abierta de dos listas (por ejemplo, Sub-12 y Sub-14) y una actividad cancelada convocada.
- Dos navegadores o un navegador normal y una ventana privada, para simular a dos acudientes. El celular del responsable, en la red local.

## Pruebas automáticas (solo las de la spec)

- `npm run db:test`.
- `npx ng test --watch=false --include src/app/features/call-up-response --include src/app/features/call-ups --include src/app/features/activities/pages/activities-page --include src/app/features/players/pages/player-page`.

## 1. Primera vez (HU-009)

Copiar el mensaje de Sub-12 y abrir su enlace en la ventana privada. Se ven la academia y la actividad, y los convocados solo con nombre, inicial y apodo, sin celulares. Elegir a Samuel, escribir nombre, celular y «Papá», aceptar la autorización y continuar. Probar sin autorización: no deja. Medir: menos de 1 minuto hasta responder (SC-001).

## 2. Responder y cambiar (HU-010)

Responder «Sí»; cambiar a «No» con «Enfermedad o lesión»; luego a «Sí, provisional» con «Otro» (sin texto no deja). Ver «Te quedan N cambios» hasta «Escríbele a la academia». Desde el otro navegador, como mamá, responder por el mismo jugador: vale la última y suma al límite.

## 3. Dispositivo recordado (HU-009)

Volver a abrir el enlace en el primer navegador: va directo a Samuel. «¿Respondes por alguien más?» → elegir a un hermano sin volver a escribir datos. Medir: menos de 15 segundos (SC-002).

## 4. Situaciones especiales (HU-009)

Abrir el enlace de la actividad cancelada (solo lectura), uno inventado («ya no está disponible», sin datos) y cerrar la convocatoria de Sub-12 (solo lectura con la respuesta). Quitar a un jugador con respuesta: «Ya no está convocado».

## 5. Seguimiento (HU-011)

Como owner, en la actividad: totales y estado por jugador; «Actualizar» trae una respuesta nueva. Abrir a Samuel: historial con papá y mamá. Registrar «No» para otro jugador, también tras cerrar la convocatoria; no consume sus cambios. Ver «12/17» en la lista de actividades. Medir: encontrar a los que no han respondido en menos de 10 segundos (SC-003).

## 6. Validar y rechazar (HU-040)

En el seguimiento, validar al papá: deja de verse «sin validar». Identificarse en otro navegador con el celular de una mamá registrada: el owner ve la coincidencia. Rechazar a uno: su respuesta deja de contar y ese navegador vuelve a «Elegir», sin aviso de rechazo. Ver el bloque «Por validar» en la ficha del jugador.

## 7. Aislamiento y experiencia

El owner de la academia B no ve nada de la A. Pantallas a 360 px y en escritorio, en claro y oscuro; controles de al menos 44 px; revisión con Impeccable; maquetas aprobadas.

## Resultados

Validado por el responsable desde su celular el 2026-10-21, con la academia C local (Sub-12 del 25/10, Sub-8 del 24/10, una convocatoria cerrada y una cancelada).

- **Automáticas**: pgTAP 297/297 (51 nuevas); Vitest de `call-up-response`, `call-ups`, `activities` y `players`: 156/156; lint, `check:styles`, `check:bundle` y compilación en verde.
- **1. Primera vez**: conforme; la lista muestra solo nombre, inicial y apodo; sin autorización no continúa; con el celular de un acudiente registrado no se duplica la persona.
- **2. Responder y cambiar**: conforme; «Sí» directo, motivo opcional y «Otro» con texto; tras 3 cambios, «Escríbele a la academia»; dos acudientes suman al mismo límite.
- **3. Dispositivo recordado**: conforme; entra directo y responde por los hermanos; en otra actividad de otro hijo solo pide el parentesco (corregido durante la validación).
- **4. Situaciones especiales**: conforme; cerrada y cancelada en modo lectura; enlace inexistente sin datos.
- **5. Seguimiento**: conforme; totales, «Actualizar», historial, respuesta registrada por el owner y «N/M» en la lista de actividades.
- **6. Validar y rechazar**: conforme; coincidencia de celular, rechazo silencioso y bloque «Por validar» en la ficha.
- **Jugador que responde por sí mismo**: conforme; se muestra como «Responde él mismo», no como su acudiente (ajuste de DEC-46 durante la validación).
- **7. Experiencia**: maquetas aprobadas; detector de Impeccable sin hallazgos en la página del enlace (360 px, escritorio y enlace inexistente); pantallas del owner validadas en el celular.
