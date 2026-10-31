# Guía de validación: Documentos legales en la aplicación

## Requisitos

Supabase local con la migración nueva (`npx supabase migration up`) y `npm run db:types`; frontend con `npm start`.

## Pruebas automáticas (solo las de la spec)

- `npm run db:test`.
- `npx ng test --watch=false --include src/app/core/legal --include src/app/shared/components/legal-document-dialog --include src/app/features/auth/register --include src/app/features/players/components/guardian-drawer --include src/app/features/call-up-response/pages`.

## 1. Registro (CA-001 a CA-003)

En `/auth/register`, escribe los datos y toca «Términos y Condiciones»: se abre el dialog con la versión 2026-10-v2 y el texto completo. Ciérralo: los datos siguen y la casilla, sin marcar. Igual con la política. Regístrate: la aceptación queda con la v2.

## 2. Acudiente (CA-001)

En la ficha de un jugador, al agregar un acudiente, y en el enlace público de una convocatoria (sin sesión), la política se abre en el dialog.

## 3. Sin conexión (CA-004)

Con la red cortada en el navegador, abre un documento: mensaje y «Abrir en otra pestaña».

## 4. Página propia y experiencia

`/legal/terms/2026-10-v2.html` abre el documento como página. Dialog a 360 px y en escritorio, en claro y oscuro; Escape cierra; foco dentro; revisión con Impeccable; maqueta aprobada.

## Resultados

- Automáticas: pgTAP 340/340 (6 nuevas) y Vitest 134/134 (2026-10-25).
- Pasos 1 a 4 en el celular: validados por el responsable (2026-10-31).
