# Investigación: Avisos en la aplicación

Decisiones técnicas de la spec 014. Las de producto están en DEC-41, DEC-46 y DEC-47 (ADR-018).

## R1 — Pendientes de la academia: una vista

- **Decisión**: vista `guardian_pending_reviews` (`security_invoker`) con un pendiente por fila: un vínculo pendiente (con su último dispositivo pendiente) o un dispositivo pendiente de un vínculo validado. Columnas: jugador, ids del vínculo y del dispositivo, nombre registrado y declarado, parentesco, celular, hora y `phone_match`. Sirve para el contador (`count`) y para el drawer (todas las filas). Filtra por `current_academy_id()` (academia actual), igual que `call_up_new_responses`.
- **Motivo**: es la misma regla que `GuardianRepository.pending(playerId)` de la spec 013, ahora para toda la academia y calculada en un solo sitio. Hereda la RLS de vínculos, dispositivos y acudientes.
- **Alternativa descartada**: repetir en el frontend la lógica de `pending` para cada jugador: N consultas y dos versiones de la misma regla.
- **Consecuencia**: `GuardianRepository.pending(playerId)` pasa a leer la vista filtrada por jugador (una sola regla; principio IV).

## R2 — Respuestas vistas: tabla `call_up_visits`

- **Decisión**: tabla `call_up_visits` (`academy_id`, `call_up_id`, `user_id`, `seen_at`), única por convocatoria y usuario. La función `mark_call_up_seen(p_call_up_id)` (`security invoker`) hace el *upsert* con `user_id = current_user_id()` y la hora del servidor. Vista `call_up_new_responses` (`security_invoker`): por convocatoria de la academia, cuántas respuestas de acudientes que cuentan, de jugadores aún convocados y activos, son posteriores a la visita del usuario actual (o todas si no hay visita), con la actividad (título, fecha y estado).
- **Motivo**: DEC-47 (por convocatoria y vistas al abrir la actividad). Una fila por usuario permite que en el futuro cada miembro tenga sus propios avisos. `current_user_id()` es la función de autorización de ADR-017; no hay usos nuevos de `auth.uid()`.
- **Excepción (principio XII)**: sin borrado lógico; es un dato técnico de lectura que se sobrescribe, sin valor de historia (como `call_up_players`).
- **Alternativas descartadas**: guardar «vista» en cada respuesta (una escritura por respuesta y no sirve para varios usuarios); `localStorage` (se pierde al cambiar de celular y no es multi-dispositivo).

## R3 — Contador en la navegación

- **Decisión**: un servicio raíz `NoticesService` en `core/notices` con un signal `pendingCount`, que carga `count` de `guardian_pending_reviews`:
  - al iniciar la sesión con academia y en cada `NavigationEnd`, con un mínimo de 30 segundos entre lecturas por navegación;
  - al volver a la pestaña (`visibilitychange`);
  - al terminar una validación, con `refresh()` explícito.

  La barra inferior y el menú lateral muestran un `p-badge` en el destino «Inicio» (ajuste del 2026-10-22) cuando `pendingCount > 0`, con «99+» a partir de 100.
- **Motivo**: la navegación es del layout (core) y no puede depender de una feature; el repositorio abstracto vive en `core/notices` como los demás de core (`AcademyContext`, legal). Sin Realtime (DEC-46).
- **Alternativa descartada**: consultar en cada navegación sin límite, que gasta datos móviles (PRODUCT.md, datos limitados).

## R4 — Avisos en el inicio y drawer de pendientes

- **Decisión**: el inicio suma, arriba del resumen actual, una sección «Avisos» con:
  - «N acudientes por validar» (abre el drawer);
  - hasta 5 avisos de respuestas nuevas, ordenados por fecha de la actividad (las próximas primero), con «Ver más» si hay más.

  El drawer `pending-reviews-drawer` vive en `features/players`, la dueña de los acudientes. Agrupa por jugador y reutiliza `GuardianRepository.review`, con «Rechazar» con confirmación. Al validar o rechazar, recarga sus datos y llama a `NoticesService.refresh()`.
- **Motivo**: reutiliza la operación y los textos del bloque «Por validar» de la ficha (spec 013).

## R5 — Marcar visto al abrir la actividad

- **Decisión**: `CallUpService.load` llama a `markSeen(callUp.id)` después de leer las respuestas, sin bloquear la pantalla si falla. Luego pide `NoticesService.refresh()` para que el inicio deje de mostrar el aviso.
- **Motivo**: DEC-47 («vistas al abrirla»); la sección «Convocatoria» es la que muestra las respuestas.

## R6 — Maquetas

- **Decisión**: tres pantallas de baja fidelidad a 360 px en `mockups/`, publicadas en un artifact privado:
  - la barra inferior con el contador;
  - el inicio con los avisos;
  - el drawer de pendientes agrupados por jugador.
