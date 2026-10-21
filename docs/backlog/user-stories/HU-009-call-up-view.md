# HU-009 — Abrir la convocatoria e identificarse

**Épica:** EP-06 — Respuesta del acudiente · **Fase:** 2 — Negocio · **Prioridad:** MVP · **Estado:** Definida
**Spec:** 013 (respuesta y seguimiento)

## Historia de usuario

> Como **acudiente**, quiero abrir el enlace de la convocatoria que llegó al grupo de WhatsApp, ver los datos de la actividad e indicar por quién respondo, para poder responder sin crear una cuenta.

## Criterios de aceptación

### CA-001 — Primera vez: elegir al jugador
**Dado** un enlace vigente abierto desde un dispositivo que PlayerTech no reconoce,
**cuando** se carga,
**entonces** se ven el nombre de la academia, los datos de la actividad (los mismos del mensaje) y la lista de convocados de esa lista solo con nombre, inicial del apellido y apodo («Samuel V. · Samu»), para elegir por quién responde; un jugador adulto sin acudiente elige «Soy el jugador».

### CA-002 — Identificarse
**Dado** el jugador elegido,
**cuando** la persona escribe cómo se llama (basta un nombre), su celular y su parentesco y acepta la autorización de datos (DEC-39),
**entonces** queda registrada como acudiente con un vínculo **pendiente de validar**, el dispositivo queda recordado y pasa a responder (HU-010). Si el celular coincide con un acudiente de la academia, no se crea otra persona: el vínculo pendiente se asocia a ese acudiente, sin cambiar su nombre registrado (DEC-46). Con «Soy el jugador» no se pide el nombre: se usa el de su ficha.

### CA-003 — Siguientes veces: dispositivo recordado
**Dado** un dispositivo recordado con vínculos no rechazados,
**cuando** abre el enlace de una lista donde están sus jugadores,
**entonces** va directo a responder por cada uno (hermanos incluidos), sin ver la lista completa, y puede elegir «¿Respondes por alguien más?», que crea un vínculo nuevo pendiente.

### CA-004 — Su jugador no está en la lista
**Dado** la lista de convocados,
**cuando** la persona no encuentra a su jugador,
**entonces** se le indica que escriba a la academia.

### CA-005 — Enlace cerrado, cancelado o inexistente
**Dado** un enlace,
**cuando** la convocatoria está cerrada o la actividad cancelada,
**entonces** se ven la actividad y la respuesta de la persona (si la tiene) en modo lectura, con «La convocatoria está cerrada» o «Se canceló la actividad»; **cuando** el enlace no existe, se ve «Esta convocatoria ya no está disponible», sin datos.

### CA-006 — Jugador quitado
**Dado** un jugador por el que la persona respondió,
**cuando** el owner lo quita de la convocatoria,
**entonces** al abrir el enlace se ve «Ya no está convocado».

## Reglas de negocio

- Sin cuenta ni contraseña. El celular es un dato de contacto, no una verificación: no se envían códigos (DEC-31).
- **Privacidad:** la persona solo ve la actividad y a sus jugadores; nunca las respuestas de otros. La lista completa (nombre e inicial) solo aparece para elegir (DEC-46, SEC-03).
- Todo dispositivo nuevo queda pendiente de validar, aunque el celular coincida con un acudiente registrado (DEC-31).
- Un vínculo rechazado no se anuncia: la persona se trata como un dispositivo desconocido (DEC-46).
- El formulario es siempre el mismo, exista o no el celular, para no revelar qué celulares están registrados (DEC-46).
- Supuestos aprobados: nombre de 1 a 120 caracteres, sin exigir apellidos, con autocompletado del teclado; celular colombiano de 10 dígitos que empieza por 3; parentescos mamá, papá, abuelo o abuela, otro o «Soy el jugador»; la llave del dispositivo vive en el navegador y, si se borra, el dispositivo cuenta como nuevo.

## Decisiones relacionadas

ADR-018: DEC-31, DEC-39, DEC-40 y DEC-46. Flujo: `docs/product/call-up-flow.md`. Riesgo: SEC-03.
