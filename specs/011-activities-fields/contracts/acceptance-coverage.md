# Cobertura de los criterios de aceptación

**pgTAP**: `090-activities-fields.test.sql`. **QS n**: paso del `quickstart.md`. El resto, pruebas Vitest de `features/activities`.

| HU | Criterio | Cobertura |
|---|---|---|
| HU-005 | CA-001, CA-002 Crear entrenamiento o competencia | Página y servicio; QS 1 |
| | CA-003 Obligatorios y horas | Drawer; pgTAP (fecha pasada, horas, rival) |
| | CA-004 Opcionales | Drawer; QS 1 |
| | CA-005 Lugar | Drawer (sedes y canchas, «Nueva cancha»); pgTAP (lugar único, vigente, misma academia) |
| | CA-006 Repetir | `colombia-time` (`weeklyDates`); servicio (un solo `create`); QS 2 |
| | CA-007 Confirmación | Página |
| HU-006 | CA-001 a CA-003 Próximas, identificación, filtros | Servicio (grupos por día); página; QS 3 |
| | CA-004 Detalle | Página de detalle |
| | CA-005 Vacío | Página |
| | CA-006 Aislamiento | pgTAP; QS 6 |
| HU-036 | CA-001 Editar | Detalle y servicio |
| | CA-002 Cancelar y reactivar | Detalle; QS 4 |
| | CA-003 Eliminar | Detalle (confirmación); pgTAP (sin borrado físico) |
| | CA-004 Sin guardar | `FormDrawer` |
| | CA-005 Repetida | pgTAP (cada fila independiente); QS 2 |
| | CA-006 Pasada | pgTAP (no se edita ni se cancela, sí se elimina); detalle |
| HU-037 | CA-001 Crear desde la actividad | Drawer de actividad; QS 1 |
| | CA-002 Nombre único | pgTAP; drawer de cancha |
| | CA-003, CA-004 Catálogo, retirar | Página de canchas; pgTAP (la actividad conserva su lugar); QS 5 |
| | CA-005 Aislamiento | pgTAP |
