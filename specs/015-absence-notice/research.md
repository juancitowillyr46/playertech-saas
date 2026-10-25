# Investigación: Aviso de inasistencia

Decisiones técnicas de la spec 015. Las de producto están en DEC-48 (ADR-018).

## R1 — Una tabla de ausencias, una fila por jugador y actividad

- **Decisión**: tabla `player_absences` (`academy_id`, `activity_id`, `player_id`, `marked_by`, `marked_at`, `notified_at`, `deleted_at`), única por actividad y jugador. Desmarcar es borrado lógico (`deleted_at`); volver a marcar limpia `deleted_at` y conserva `notified_at` (supuesto de la spec). Solo existen filas de ausentes (DEC-48).
- **Motivo**: «por excepción» se representa con la ausencia de fila; la tabla queda pequeña y no hay lista de presentes que mantener.
- **Alternativa descartada**: una fila por convocado con estado presente o ausente: es la asistencia formal de la Etapa 2.

## R2 — Reglas en la base de datos

- **Decisión**:
  - Las funciones `set_absence(p_activity_id, p_player_id, p_absent)` y `mark_absence_notified(p_activity_id, p_player_id)` son `security invoker` y comprueban al owner.
  - Un trigger exige tres condiciones: la actividad está programada (no cancelada); `now()` está entre el inicio y el final de ese día en Colombia (`date_trunc('day', starts_at at time zone 'America/Bogota') + 1 day`); y el jugador es de la academia.
  - `notified_at` usa la hora del servidor.
- **Motivo**: FR-009 pide garantizar el plazo y la actividad cancelada fuera de la pantalla. Sin `auth.uid()` nuevos: `current_user_id()` (ADR-017).

## R3 — De dónde sale la lista

- **Decisión**:
  - **Con convocatoria:** convocados activos y respuestas vigentes de `CallUpRepository` (`getByActivity` y `responses`, specs 012 y 013), ordenados así: primero «Sí», luego provisional y sin respuesta, y aparte «No».
  - **Sin convocatoria:** grupos y jugadores activos de `PlayerRepository` (`listGroups` y `listPlayers`, spec 009), filtrados por los grupos elegidos y sin repetir.
  - **Celulares para avisar:** con convocatoria vienen en los convocados; sin ella, `GuardianRepository.listByPlayer` al abrir el aviso.
- **Motivo**: no se duplica la regla de quién está convocado ni la de los grupos (principio IV).

## R4 — Mensaje y WhatsApp

- **Decisión**: función pura `absenceMessage({ recipientFirstName, playerFirstName, activity })`, por ejemplo «Hola, Juan. Mateo no llegó hoy al entrenamiento de las 4:00 p. m. en Sede principal. ¿Está todo bien?». Reutiliza `whatsappChat`, `openWhatsapp` y `copyText` de la spec 012. Los destinatarios siguen la misma regla de «Enviar»: los acudientes validados y, si no tiene, el celular del jugador. Al abrir el chat o copiar, `mark_absence_notified`.
- **Motivo**: DEC-31 y DEC-45 (sin envío automático); el mensaje no se guarda (DEC-48).

## R5 — Frontend: feature `absences`

- **Decisión**: `features/absences` con modelos, repositorio abstracto y su implementación Supabase, un servicio y estos componentes:
  - la sección «¿Quién no llegó?» en el detalle de la actividad, con el resumen;
  - el drawer de la lista, con grupos, buscador y marcas;
  - el drawer del aviso, con destinatario, mensaje editable, «Abrir WhatsApp» y «Copiar».
- **Motivo**: es un flujo propio del owner en la cancha, separado de la convocatoria (principio III).

## R6 — Maquetas

- **Decisión**: cuatro pantallas de baja fidelidad a 360 px, publicadas en un artifact privado y copiadas en `mockups/`:
  - el detalle de la actividad, con la sección y el resumen;
  - la lista sin convocatoria, con chips de grupo y buscador;
  - la lista de un partido con convocatoria (grupos «Dijeron Sí», «Provisional o sin respuesta» y «Avisaron que no»);
  - el drawer del aviso.
