# Guía de validación: Gestión de sedes

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

## Requisitos previos

- Supabase local arriba (`npm run db:start`); `npm run db:reset` restaura el seed (academias A y B).
- `npm start` en `frontend/`.
- Owners: `owner.a@playertech.test` y `owner.b@playertech.test`, contraseña `PlayerTech-Local-2026` (`supabase/README.md`).

## 1. Controles automáticos

Desde `frontend/`: `npm run lint`, `npm run check:styles`, `npm run test:ci`, `npm run build` y `npm run check:bundle`. Desde la raíz: `npm run db:test`.

**Esperado**: todo en verde, incluidas las pruebas nuevas de repositorio, servicio y pantalla (research R8).

## 2. Registrar (HU-029)

Como owner A, en el celular (360 px), en Sedes:

| Paso | Esperado |
|---|---|
| «Nueva sede» → nombre «Cancha Norte» → Guardar | Aviso «Sede creada.»; aparece activa, no principal, como «Lugar de entrenamiento» (CA-001, CA-002) |
| «Nueva sede» con el nombre vacío o «   » | «Ingresa el nombre de la sede.» bajo el campo; no se crea (CA-003) |
| «Nueva sede» → «cancha norte» | «Ya existe una sede con ese nombre.»; no se crea (CA-004) |
| Medir desde «Nueva sede» hasta el aviso | Menos de 1 minuto (SC-001) |

## 3. Editar (HU-031, CA-001)

| Paso | Esperado |
|---|---|
| Editar «Sede principal» → nombre «Sede Chapinero», ciudad «Bogotá» → Guardar | «Cambios guardados.»; el listado y el inicio muestran los datos nuevos |
| Editar «Cancha Norte» → nombre «Sede Chapinero» | Mensaje de nombre en uso |
| Editar sin cambiar el nombre → Guardar | Se guarda sin error de duplicado |
| Escribir y cerrar | «¿Descartar los cambios?» |

## 4. Sede principal (HU-031, CA-005 a CA-007)

| Paso | Esperado |
|---|---|
| Menú de la principal | «Desactivar» y «Eliminar» deshabilitados con «(marca otra como principal)» |
| «Cancha Norte» → «Marcar como principal» | Aviso; pasa a ser la principal y la anterior deja de serlo (CA-006) |
| Desactivar la anterior principal; menú de esa sede | «Marcar como principal» deshabilitada con «(reactívala primero)» (CA-007) |

## 5. Desactivar, reactivar y eliminar (HU-031, CA-002 a CA-004)

| Paso | Esperado |
|---|---|
| Desactivar una sede no principal | Sigue en el listado con el sello «INACTIVA» y sus datos |
| Reactivarla | Vuelve a «ACTIVA» |
| Eliminar una sede no principal → Cancelar | No cambia nada |
| Eliminar → Eliminar | Aviso; desaparece del listado; su nombre puede reutilizarse en una sede nueva |

## 6. Consulta y aislamiento (HU-030)

| Paso | Esperado |
|---|---|
| Owner A en 360 px y 1280 px | Filas regladas en el celular y tabla en escritorio, con principal, activas e inactivas, sin eliminadas (CA-001 a CA-004) |
| Owner B | Solo ve sus sedes, ninguna de A (CA-005, SC-005) |

## 7. Casos límite

| Paso | Esperado |
|---|---|
| Abrir la edición en dos pestañas, eliminar en una y guardar en la otra | Mensaje en español; el listado se actualiza |
| Cortar Supabase (`npm run db:stop`) y guardar | Mensaje de conexión; el formulario conserva lo escrito |
| Doble toque en Guardar | Se crea una sola sede |

## 8. Revisión de experiencia y accesibilidad

Mediciones a 360 y 1280 px en ambos modos (sin desbordes, controles de 44 px o más), detector de Impeccable y revisión con `/impeccable audit` y `/impeccable polish` de la pantalla y el formulario (FR-019, SC-006).

## Resultados

*Se completa al terminar la implementación.*
