# Cobertura de los criterios de aceptación

**pgTAP**: `080-guardian-assignment.test.sql`. **QS n**: paso del `quickstart.md`. El resto, pruebas Vitest de `features/players`.

| HU | Criterio | Cobertura |
|---|---|---|
| HU-035 | CA-001 Elegir y asignar | Selector y ficha; pgTAP (`assign_guardians` de uno); QS 2 |
| | CA-002 A quién acompaña | Repositorio (`listGuardians`); selector |
| | CA-003 Sin repetir la autorización | pgTAP (autorización en `guardians`); selector sin casilla; QS 1 y QS 2 |
| | CA-004 Ya asignado | Servicio (`alreadyLinked`); selector; pgTAP (omite repetidos) |
| | CA-005 Copiar de un hermano | Drawer de copiar; pgTAP (varios en una operación); QS 3 |
| | CA-006 Registrar uno nuevo | Ficha (sin acudientes abre el formulario); selector |
| | CA-007 Aislamiento | pgTAP (acudiente de otra academia, owner B); QS 4 |
| HU-034 | CA-006 Autorización al registrar | pgTAP (`add_player_guardian` la guarda en la persona) |
