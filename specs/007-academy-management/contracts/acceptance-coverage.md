# Cobertura de los criterios de aceptación

**Existe**: cubierto por specs anteriores. **Nueva**: se añade en esta spec. **QS n**: paso del `quickstart.md`.

## HU-017 — Perfil de la academia

| Criterio | Cobertura |
|---|---|
| CA-001 Consultar | Nueva: `academy-profile-page.spec` (muestra datos y plan); `supabase-academy-profile.repository.spec`. QS 1.1 |
| CA-002 Editar | Nueva: `academy-profile.service.spec` y `academy-profile-page.spec` (guarda y avisa). QS 1.2 |
| CA-003 Nombre obligatorio | Nueva: `academy-profile-page.spec` |
| CA-004 Correo válido | Nueva: `academy-profile-page.spec` |
| CA-005 Correo independiente | Nueva: `supabase-academy-profile.repository.spec` (solo actualiza `academies`). QS 1.3 |
| CA-006 Cargar o reemplazar el logo | Nueva: `academy-profile.service.spec` (orden preparar → subir → asignar → purgar); `logo-image.spec` (dimensiones). QS 2.1 y 2.4 |
| CA-007 Logo inválido | Nueva: `logo-file.spec` (tipo, contenido, tamaño); `academy-profile-page.spec` (mensaje y logo conservado). QS 2.2 |
| CA-008 Retirar el logo | Nueva: `academy-profile.service.spec`; `academy-profile-page.spec` (confirmación). QS 2.3 |
| CA-009 Aislamiento | Existe: pgTAP `030-isolation` y `060-storage`. QS 3 |
| Imagen anterior borrada, registro conservado | Nueva: `supabase-file-storage.repository.spec` (`purge`) y `academy-profile.service.spec`. QS 2.1 y 2.3 (SQL y almacenamiento) |

## HU-032 — Inicio

| Criterio | Cobertura |
|---|---|
| CA-001 Inicio tras iniciar sesión | Existe: `home-page.spec` (spec 003). QS 4.1 |
| CA-002 Tarjeta con progreso | Nueva: `home-summary.service.spec` (cálculo de las cuatro tareas) y `home-page.spec` (estado y «n de 4»). QS 4.1 |
| CA-003 Ir a completar | Nueva: `home-page.spec` (enlaces de las pendientes). QS 4.2 |
| CA-004 Academia completa | Nueva: `home-page.spec` (sin tarjeta con 4 de 4). QS 4.3 |
