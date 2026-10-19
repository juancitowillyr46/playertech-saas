# Guía de validación: Actividades y canchas externas

## Requisitos

- Supabase local con la migración nueva (`npx supabase migration up`, sin `db:reset`) y `npm run db:types`.
- Servidor de desarrollo; tu cuenta local (owner) y el owner B del seed para el aislamiento.

## Pruebas automáticas (solo las de la spec)

- `npm run db:test`.
- `npx ng test --watch=false --include src/app/features/activities --include src/app/shared/text`.

## 1. Programar (HU-005, HU-037)

Crear un entrenamiento mañana a las 4:00 p. m. en una sede, con citación a las 3:30 p. m. Crear una competencia el sábado contra «Club Norte», en una **cancha nueva** creada desde el formulario. Medir: menos de 1 minuto (SC-001). Probar fecha pasada, fin antes del inicio y citación después del inicio: errores junto al campo.

## 2. Repetir (HU-005)

Entrenamiento martes y jueves durante 3 meses: «Se crearán N actividades» y luego aparecen en el listado. Medir: menos de 90 segundos (SC-002). Editar una sola: las demás no cambian.

## 3. Consultar (HU-006)

Próximas agrupadas por día; filtrar por Competencia; ver Pasadas; abrir un detalle con las indicaciones del lugar.

## 4. Gestionar (HU-036)

Cancelar y reactivar una próxima; eliminar otra (confirmación). Por SQL, mover una al pasado (`update activities set starts_at = now() - interval '1 day'`, con el trigger desactivado en una transacción) y comprobar que en la interfaz solo se puede eliminar.

## 5. Canchas (HU-037)

En el catálogo: editar, repetir un nombre (error) y retirar la cancha del paso 1; la competencia conserva su lugar.

## 6. Aislamiento

Con el owner B: no ve nada de lo anterior.

## 7. Experiencia

Maquetas aprobadas; pantallas a 360 px y en escritorio, en claro y oscuro; controles de al menos 44 px; revisión con Impeccable.

## Resultados

**2026-10-18, Supabase local:**

| Paso | Resultado |
|---|---|
| Automáticas | pgTAP 220/220 (26 nuevas); Vitest de `activities`, `players`, `groups`, `shared`, `core` y `layout` en verde; lint, `check:styles` y compilación de producción en verde |
| 1 a 6 | El responsable validó desde su celular: «Mi validación está conforme» |
| Ajustes de la validación | Horas con listas desplegables cada 15 minutos (sin teclado ni botón de aceptar); si la fecha es hoy, solo horas futuras; fin solo después del inicio y citación antes o igual; el formulario ya no se reinicia al elegir un valor (`untracked` en los cinco drawers con formulario); botón «Cancelar» de una línea y con contorno activo; «Nueva cancha» también al editar |
| 7 | Detector de Impeccable sin hallazgos (solo código) |
| Seed | La academia A no tiene actividades ni canchas; pgTAP en verde |
