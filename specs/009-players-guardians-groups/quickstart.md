# Guía de validación: Jugadores, acudientes y grupos

## Requisitos

- Supabase local en marcha y la migración nueva aplicada (`npx supabase migration up`, sin `db:reset`).
- `npm run db:types` tras la migración.
- Servidor de desarrollo; cuentas del seed (owner A y owner B).
- **Al terminar**: eliminar por SQL todo lo creado en la academia A (jugadores, grupos, acudientes y vínculos) y confirmar `npm run db:test` con todas las pruebas en verde.

## Pruebas automáticas (solo las de la spec)

- `npm run db:test`: la prueba nueva y las existentes, porque la migración puede afectarlas.
- `npx ng test --watch=false --include src/app/features/players --include src/app/features/groups --include src/app/shared/forms`.

## 1. Registrar jugadores (HU-002)

| # | Pasos (owner A, 360 px) | Resultado esperado |
|---|---|---|
| 1.1 | Registrar «Samuel Vargas», 2014-05-10, apodo «Samu», celular «300 123 4567» | Aviso de confirmación; aparece en el listado como «Samuel V. · Samu», con 12 años. Medir: menos de 1 minuto con un grupo (SC-001) |
| 1.2 | Crear el grupo «Sub-12» y registrar otro jugador eligiéndolo | El jugador queda en el grupo |
| 1.3 | Registrar «samuel  vargas» (minúsculas, espacios dobles) con la misma fecha | «Este jugador ya está registrado»; actualizar el apodo actualiza al existente; no se duplica |
| 1.4 | Fecha futura; celular «2001234567» | Errores junto al campo |

## 2. Encontrar (HU-003)

Con jugadores en dos grupos, uno inactivo: buscar «samu» y «vargas» sin tilde, y filtrar por grupo y por estado. Con 200 jugadores (insertados por SQL y borrados en T042), encontrar uno en menos de 5 segundos (SC-002).

## 3. Gestionar (HU-033)

Editar los grupos de un jugador; desactivarlo y reactivarlo; eliminar otro (confirmación con su nombre).

## 4. Grupos (HU-004)

Crear «Sub-10» y repetir el nombre (error); agregar 15 jugadores con el buscador y medir el tiempo (SC-004); quitar uno; renombrar; eliminar el grupo: sus jugadores siguen registrados.

## 5. Acudientes (HU-034)

Agregar a la mamá y al papá de Samuel con la autorización marcada; agregar al papá a un hermano usando su celular (aviso «ya registrado», misma persona); editar y retirar. Por SQL: un solo registro del papá en `guardians`, dos vínculos con `consent_document_id`.

## 6. Aislamiento

Con el owner B: no ve nada de lo anterior.

## 7. Experiencia

Maquetas aprobadas (R9) y pantallas implementadas a 360 px y en escritorio, en claro y oscuro: detector de Impeccable, sin desbordamiento, controles de al menos 44 px.

## Resultados

*(se completa al implementar)*
