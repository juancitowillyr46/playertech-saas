# Cobertura de criterios de aceptación

Cada criterio tiene al menos una prueba automática o un paso del quickstart (FR-021).

| Criterio | pgTAP | Vitest | Quickstart |
|---|---|---|---|
| HU-009 CA-001 elegir jugador | `public_call_up` abierto: `roster` solo de la lista, sin celulares | Página: estado «Elegir» | 1 |
| HU-009 CA-002 identificarse | `public_identify`: pendientes; celular existente reutiliza; sin autorización falla | Página: formulario, validaciones y llave guardada | 1 |
| HU-009 CA-003 dispositivo recordado | `public_call_up` con llave → `mine`; hermano sin datos | Servicio: carga con llaves; «alguien más» | 3 |
| HU-009 CA-004 no está en la lista | — | Página: texto de ayuda | 1 |
| HU-009 CA-005 cerrado, cancelado o inexistente | `closed`, `cancelled` y `not_found` sin datos | Página: solo lectura y no disponible | 4 |
| HU-009 CA-006 jugador quitado | `removed` | Página: «Ya no está convocado» | 4 |
| HU-010 CA-001 tres respuestas | `public_respond` registra con hora | Página: enviar y «¡Listo!» | 2 |
| HU-010 CA-002 motivo opcional | Motivo inválido y *Otro* sin texto fallan | Opciones por respuesta; *Otro* exige texto | 2 |
| HU-010 CA-003 cambios | La misma no inserta; quinta distinta falla | «Te quedan N cambios» | 2 |
| HU-010 CA-004 varios acudientes | El límite suma a los dos acudientes | — | 2 |
| HU-010 CA-005 sin validar | La vista marca sin validar | Sección: etiqueta «sin validar» | 2, 6 |
| HU-010 CA-006 cierre | Cerrada → `call_up_closed` | Página: solo lectura | 4 |
| HU-011 CA-001 resumen | `call_up_summaries` | Sección: totales | 5 |
| HU-011 CA-002 estado por jugador | `call_up_current_responses` | Sección: etiqueta y motivo | 5 |
| HU-011 CA-003 historial | — | Drawer: historial ordenado | 5 |
| HU-011 CA-004 sin validar | — | Drawer: validar y rechazar | 6 |
| HU-011 CA-005 owner responde | Owner inserta con la convocatoria cerrada sin consumir el límite | Drawer: «Registrar respuesta» | 5 |
| HU-011 CA-006 «12/17» | `call_up_summaries` | Lista de actividades | 5 |
| HU-011 CA-007 actualizar | — | Sección: «Actualizar» recarga | 5 |
| HU-040 CA-001 validar | `review_guardian` validate | Drawer y ficha | 6 |
| HU-040 CA-002 coincidencia | `public_identify` con celular existente | Drawer: texto de coincidencia | 6 |
| HU-040 CA-003 rechazar | `reject`: respuesta fuera del conteo; vínculo con `deleted_at` | Confirmación | 6 |
| HU-040 CA-004 dónde | — | Ficha: bloque «Por validar» | 6 |
| Aislamiento (FR-017, SC-005) | `anon` sin tablas; owner B sin datos de A | — | 7 |
