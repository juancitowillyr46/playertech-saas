# Guía de validación: Aviso de inasistencia

## Requisitos

- Supabase local con la migración nueva (`npx supabase migration up`) y `npm run db:types`.
- En la academia C local: un entrenamiento de hoy sin convocatoria y un partido de hoy convocado, ambos ya empezados, con acudientes con celular.

## Pruebas automáticas (solo las de la spec)

- `npm run db:test`.
- `npx ng test --watch=false --include src/app/features/absences --include src/app/features/activities/pages/activity-page`.

## 1. Entrenamiento sin convocatoria (CA-001 a CA-003 y CA-005)

Antes del inicio, la sección no aparece. Ya empezado: «¿Quién no llegó?» → elegir Sub-12 y Sub-14 (los jugadores en los dos aparecen una vez) → tocar a dos jugadores → volver a la actividad: «2 no llegaron · 0 avisados». Desmarcar a uno: «1». Medir: 3 ausentes de 20 en menos de 20 s (SC-001).

## 2. Partido convocado (CA-002)

La lista muestra «Dijeron Sí» primero y «Avisaron que no» aparte. Marcar a uno que dijo «Sí»: sus respuestas de la convocatoria no cambian.

## 3. Avisar (CA-004)

Con un jugador marcado, «Avisar» → elegir acudiente → editar el mensaje → «Abrir WhatsApp»: se abre el chat con el texto; vuelve «Avisado h:mm». Medir: 3 toques como máximo desde la marca hasta el chat (SC-002). Un jugador sin celular: solo «Copiar».

## 4. Plazo, aislamiento y experiencia

Al día siguiente: solo lectura. El owner de la academia B no ve nada de A. Pantallas a 360 px y en escritorio, en claro y oscuro; 44 px; revisión con Impeccable; maquetas aprobadas.

## Resultados

*(se completa al implementar)*
