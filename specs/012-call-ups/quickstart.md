# Guía de validación: Convocatoria y mensaje de WhatsApp

## Requisitos

- Supabase local con la migración nueva (`npx supabase migration up`) y `npm run db:types`.
- Tu cuenta local con jugadores en dos grupos (por ejemplo, 2017 y 2018), acudientes con celular y una actividad próxima.

## Pruebas automáticas (solo las de la spec)

- `npm run db:test`.
- `npx ng test --watch=false --include src/app/features/call-ups --include src/app/features/activities`.

## 1. Convocar (HU-007)

En el amistoso de 2017: «Convocar», elegir 2017, quitar a uno, sumar a Mateo (2018) en la lista de 2017 y poner una fecha límite. Medir: menos de 1 minuto hasta compartir (SC-001).

## 2. Ajustar (HU-008)

Sumar a otro jugador, cambiar la fecha límite y, al final, cerrar la convocatoria: no se puede ajustar más.

## 3. Mensaje (HU-012)

Abrir el mensaje de 2017, escribir un saludo, compartir; cambiar la hora de la actividad y volver a abrir el mensaje: el saludo sigue, con la hora nueva.

## 4. Compartir (HU-013)

Desde el celular: «Copiar mensaje» copia el mensaje completo y se pega en el grupo de WhatsApp. «Enviar» de Mateo abre el chat de su papá con el mensaje personal. Medir: menos de 30 segundos (SC-002). Un jugador sin acudientes ni celular: solo «Copiar».

## 5. Avisos (HU-038)

Cambiar la hora: se ofrece el aviso de cambio. Cancelar otra actividad convocada: aviso de cancelación, y la convocatoria queda cerrada.

## 6. Aislamiento y enlace

Con el owner B: no ve nada. Abrir un enlace `/c/…` sin sesión: «Pronto podrás responder aquí», sin datos.

## 7. Experiencia

Maquetas aprobadas; pantallas a 360 px y en escritorio, en claro y oscuro; controles de al menos 44 px; revisión con Impeccable.

## Resultados

Validado por el responsable desde su iPhone el 2026-10-21, con la academia C local (5 grupos, 43 jugadores, 14 acudientes y 11 actividades próximas).

- **Automáticas**: pgTAP 246/246; Vitest de `call-ups`, `activities` y `players` en verde; lint y `check:styles` en verde.
- **1 y 2. Convocar y ajustar**: conforme; un jugador de dos grupos aparece una sola vez; al cerrar, no se ajusta más.
- **3. Mensaje**: conforme, con la narrativa nueva y los convocados en viñetas; el texto propio se conserva con los datos actuales.
- **4. Compartir**: «Copiar mensaje» y pegar en el grupo funciona, también en la URL no segura de la red local; «Enviar» abre el chat del acudiente elegido; sin acudientes ni celular, solo «Copiar».
- **5. Avisos**: conforme (cambio de hora y cancelación; la convocatoria cancelada queda cerrada).
- **6. Enlace**: «Pronto podrás responder aquí», sin datos.
- **7. Experiencia**: revisión con Impeccable 18/20, con sus hallazgos corregidos; revisado en el celular en claro y oscuro.
