# Guía de validación: Asignar acudientes ya registrados

## Requisitos

- Supabase local con la spec 009 y su servidor de desarrollo.
- **Antes de aplicar la migración nueva** (paso 1): datos de la spec 009 en la academia A.
- **Al terminar**: borrar por SQL lo creado en la academia A y confirmar `npm run db:test` en verde.

## Pruebas automáticas (solo las de la spec)

- `npm run db:test`.
- `npx ng test --watch=false --include src/app/features/players`.

## 1. Traslado de la autorización (FR-007, SC-003)

| # | Pasos | Resultado esperado |
|---|---|---|
| 1.1 | Con la versión de la spec 009, crear a Samuel con su mamá y su papá, y a Mateo con el mismo papá | 2 acudientes y 3 vínculos |
| 1.2 | `npx supabase migration up` | La migración se aplica sin errores |
| 1.3 | Por SQL: `select full_name, consent_document_id, consent_at from guardians` | Los 2 con la autorización de su primer vínculo |

## 2. Elegir un acudiente (HU-035)

En la ficha de Tomás: «Agregar acudiente» → buscar «carlos» → aparece con «Papá de Samuel V. · Papá de Mateo R.» → elegir Papá → «Asignar a Tomás». Sin casilla de autorización. Medir: menos de 20 s (SC-001). Al abrirlo de nuevo, Carlos aparece como «Ya es acudiente de Tomás».

## 3. Copiar de un hermano (HU-035)

En la ficha de un jugador nuevo, Sara: «Copiar de un hermano» → Samuel → los dos marcados → cambiar uno a «Otro» → «Asignar 2 acudientes». Medir: menos de 30 s (SC-002). Repetir: no hay nada nuevo que asignar.

## 4. Aislamiento

Con el owner B: no ve acudientes de A en el selector.

## 5. Experiencia

Maquetas aprobadas y pantallas a 360 px y en escritorio, en claro y oscuro; controles de al menos 44 px; revisión con Impeccable.

## Resultados

*(se completa al implementar)*
