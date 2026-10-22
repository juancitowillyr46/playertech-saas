# Guía de validación: Avisos en la aplicación

## Requisitos

- Supabase local con la migración nueva (`npx supabase migration up`) y `npm run db:types`.
- La academia C local con una convocatoria abierta y respuestas de la spec 013; un navegador o una ventana privada para identificarse como acudientes nuevos.

## Pruebas automáticas (solo las de la spec)

- `npm run db:test`.
- `npx ng test --watch=false --include src/app/core/notices --include src/app/layout --include src/app/features/home --include src/app/features/players --include src/app/features/call-ups`.

## 1. Contador (CA-001)

Identificarse desde un enlace como dos acudientes nuevos. En el celular, la barra inferior muestra «2» en «Actividades»; en escritorio, el menú lateral. Validar a uno desde su ficha y navegar: «1». Sin pendientes, sin número.

## 2. Avisos del inicio (CA-002 y CA-003)

Responder desde el enlace por dos jugadores. El inicio muestra «N acudientes por validar» y «2 respuestas nuevas · …». Tocar el aviso: abre la actividad. Volver al inicio: ese aviso ya no está. Registrar una respuesta como owner: no genera aviso.

## 3. Drawer de pendientes (CA-004)

Con pendientes de dos jugadores distintos, tocar «N acudientes por validar»: el drawer los agrupa por jugador. Validar uno y rechazar otro (con confirmación). El contador y el aviso se actualizan. Medir: 3 pendientes en menos de 1 minuto (SC-002).

## 4. Aislamiento y experiencia

El owner de la academia B no ve nada de A. Pantallas a 360 px y en escritorio, en claro y oscuro; 44 px; revisión con Impeccable; maquetas aprobadas.

## Resultados

*(se completa al implementar)*
