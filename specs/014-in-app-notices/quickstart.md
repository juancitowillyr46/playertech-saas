# Guía de validación: Avisos en la aplicación

## Requisitos

- Supabase local con la migración nueva (`npx supabase migration up`) y `npm run db:types`.
- La academia C local con una convocatoria abierta y respuestas de la spec 013; un navegador o una ventana privada para identificarse como acudientes nuevos.

## Pruebas automáticas (solo las de la spec)

- `npm run db:test`.
- `npx ng test --watch=false --include src/app/core/notices --include src/app/layout --include src/app/features/home --include src/app/features/players --include src/app/features/call-ups`.

## 1. Contador (CA-001)

Identificarse desde un enlace como dos acudientes nuevos. En el celular, la barra inferior muestra «2» en «Inicio»; en escritorio, el menú lateral. Validar a uno desde su ficha y navegar: «1». Sin pendientes, sin número.

## 2. Avisos del inicio (CA-002 y CA-003)

Responder desde el enlace por dos jugadores. El inicio muestra «N acudientes por validar» y «2 respuestas nuevas · …». Tocar el aviso: abre la actividad. Volver al inicio: ese aviso ya no está. Registrar una respuesta como owner: no genera aviso.

## 3. Drawer de pendientes (CA-004)

Con pendientes de dos jugadores distintos, tocar «N acudientes por validar»: el drawer los agrupa por jugador. Validar uno y rechazar otro (con confirmación). El contador y el aviso se actualizan. Medir: 3 pendientes en menos de 1 minuto (SC-002).

## 4. Aislamiento y experiencia

El owner de la academia B no ve nada de A. Pantallas a 360 px y en escritorio, en claro y oscuro; 44 px; revisión con Impeccable; maquetas aprobadas.

## Resultados

Validado por el responsable desde su celular el 2026-10-22, con la academia C local.

- **Automáticas**: pgTAP 315/315 (18 nuevas); Vitest de `core/notices`, `layout`, `home`, `players`, `call-ups`, `call-up-response` y `activities` en verde; lint, `check:styles` y compilación en verde.
- **1. Contador**: conforme, en «Inicio» (se movió desde «Actividades» durante la validación); desaparece sin pendientes.
- **2. Avisos del inicio**: conforme; respuestas nuevas por convocatoria que llevan a la actividad y desaparecen al abrirla; las respuestas del owner no generan aviso.
- **3. Drawer de pendientes**: conforme, agrupado por persona (ajuste durante la validación: el mismo celular aparecía una vez por jugador); validar confirma el celular y todos sus vínculos nuevos.
- **4. Aislamiento y experiencia**: pgTAP de aislamiento A/B; detector de Impeccable sin hallazgos en el código nuevo; pantallas validadas en el celular.
