# Cobertura de los criterios de aceptación

**pgTAP**: `070-players-groups-guardians.test.sql`. **QS n**: paso del `quickstart.md`. El resto, pruebas Vitest de la feature.

| HU | Criterio | Cobertura |
|---|---|---|
| HU-002 | CA-001 Registro | Página y servicio; QS 1.1 |
| | CA-002 Obligatorios | Página |
| | CA-003 Fecha válida | Página; pgTAP (trigger) |
| | CA-004 Opcionales | Página; QS 1.1 |
| | CA-005 Grupos | Repositorio; QS 1.2 |
| | CA-006 Ya registrado | Servicio (`findByIdentity`); página (aviso, actualizar, reactivar); pgTAP (índice normalizado); QS 1.3 |
| | CA-007 Celular | Validador compartido; pgTAP (check) |
| HU-003 | CA-001 a CA-004 Listado, búsqueda, filtros, acudientes | Servicio (`visiblePlayers`); página; QS 2 |
| | CA-005 Vacío | Página |
| | CA-006 Aislamiento | pgTAP; QS 6 |
| HU-033 | CA-001 Ficha | Página |
| | CA-002 Editar | Servicio y página |
| | CA-003 Desactivar | Servicio; QS 3 |
| | CA-004 Eliminar | Página (confirmación); pgTAP (sin borrado físico) |
| | CA-005 Sin guardar | Página |
| HU-004 | CA-001, CA-002, CA-005 Crear, renombrar, nombre único | Página; pgTAP (índice) |
| | CA-003, CA-004 Listado, integrantes | Servicio y página; pgTAP (clave compuesta); QS 4 |
| | CA-006 Eliminar | Repositorio; QS 4 |
| | CA-007 Vacío y aislamiento | Página; pgTAP |
| HU-034 | CA-001, CA-002, CA-004 Agregar, validaciones, varios | Página; pgTAP (`add_player_guardian`); QS 5 |
| | CA-003 Hermanos | pgTAP (reutiliza la persona); página (aviso); QS 5 |
| | CA-005 Editar, retirar | Repositorio y página |
| | CA-006 Autorización | pgTAP (rechaza sin autorización, guarda la versión); página |
| | CA-007 Aislamiento | pgTAP |
