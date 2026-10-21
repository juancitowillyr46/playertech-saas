# Cobertura de los criterios de aceptación

**pgTAP**: `100-call-ups.test.sql`. **QS n**: paso del `quickstart.md`. El resto, pruebas Vitest de `features/call-ups`.

| HU | Criterio | Cobertura |
|---|---|---|
| HU-007 | CA-001 Por grupos | Drawer «Convocar»; pgTAP (`create_call_up`); QS 1 |
| | CA-002 Quitar | Drawer; repositorio |
| | CA-003 Sumar de otros grupos | Drawer (lista destino); pgTAP (un jugador por convocatoria); QS 1 |
| | CA-004 Solo sueltos | Drawer; pgTAP (lista sin grupo) |
| | CA-005 Fecha límite | Drawer; pgTAP (futura y antes del inicio) |
| | CA-006 Sin convocados | Drawer; pgTAP |
| | CA-007 No convocable | Sección; pgTAP (cancelada, pasada, ya convocada) |
| HU-008 | CA-001 Abierta con enlaces | Sección; pgTAP (tokens únicos) |
| | CA-002, CA-003 Ajustar y fecha límite | Servicio y drawer; QS 2 |
| | CA-004 Cerrar | Sección; pgTAP (cerrada inmutable) |
| | CA-005 Cierre automático | Servicio (`isOpen`); pgTAP (`call_up_is_open`) |
| | CA-006 Aislamiento | pgTAP; QS 6 |
| HU-012 | CA-001, CA-002 Mensajes | `call-up-messages.spec.ts` |
| | CA-003, CA-004 Texto propio y bloque | Drawer «Mensaje»; mensajes; QS 3 |
| HU-013 | CA-001 a CA-004 Compartir, enviar, copiar | `whatsapp.spec.ts`; sección; QS 4 |
| | CA-005 Sin envío automático | Revisión (sin API) |
| HU-038 | CA-001, CA-002 Avisos | Mensajes (lo que cambió); detalle de la actividad; QS 5 |
| | CA-003 Opcional | Drawer de aviso |
| | CA-004 Cancelar cierra | pgTAP (trigger) |
