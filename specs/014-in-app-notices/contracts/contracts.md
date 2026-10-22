# Contratos: Avisos en la aplicación

## Base de datos

Ver `data-model.md`. Pruebas pgTAP (`120-in-app-notices.test.sql`):

- **`guardian_pending_reviews`:**
  - un vínculo pendiente es una fila, con su dispositivo;
  - un dispositivo nuevo de un vínculo validado es otra fila;
  - un rechazado o revocado no aparece;
  - el «el jugador» validado no aparece.
- **`call_up_new_responses`:**
  - sin visita cuenta todas las respuestas de acudientes;
  - tras `mark_call_up_seen` cuenta solo las posteriores;
  - no cuenta las del owner, las rechazadas ni las de jugadores quitados.
- **`mark_call_up_seen`:** crea y luego actualiza una sola fila por usuario y convocatoria.
- **Aislamiento:**
  - el owner B no ve pendientes, respuestas nuevas ni visitas de A;
  - no puede marcar visto una convocatoria de A;
  - `anon` no accede.

## Repositorios y servicios

### `core/notices` (nuevo)

```ts
export abstract class NoticesRepository {
    abstract pendingCount(): Promise<number>;                         // count de guardian_pending_reviews
    abstract newResponses(): Promise<readonly NewResponsesNotice[]>; // call_up_new_responses
}
```

`NoticesService` (raíz):

- **Estado:** `pendingCount` (signal) y `newResponses` (signal).
- **`refresh()`:** lee las dos.
- **`refreshOnNavigation()`:** lee como máximo cada 30 segundos.
- **Cuándo se dispara:** en `NavigationEnd` y en `visibilitychange`, solo con sesión y academia actual.

### `features/players`

- `GuardianRepository.pendingByAcademy(): Promise<readonly AcademyPendingGuardian[]>`: las filas de `guardian_pending_reviews`, con el jugador.
- `GuardianRepository.pending(playerId)` pasa a leer la misma vista, filtrada por jugador (R1).
- `review` no cambia.

### `features/call-ups`

- `CallUpRepository.markSeen(callUpId): Promise<void>`: llama a `mark_call_up_seen`.
- `CallUpService.load`: tras leer las respuestas, llama a `markSeen` (sin bloquear si falla) y a `NoticesService.refresh()`.

## Interfaz

- **Navegación** (barra inferior y menú lateral):
  - en «Actividades», un `p-badge` con `pendingCount` («99+» a partir de 100);
  - sin pendientes, nada;
  - nombre accesible: «Actividades, 3 acudientes por validar».
- **Inicio**, sección **«Avisos»** arriba del resumen; solo aparece si hay algo:
  - «3 acudientes por validar», con un botón que abre el drawer;
  - por convocatoria: «5 respuestas nuevas · Partido contra Club Norte · sábado 24», que lleva a `/activities/:id`;
  - hasta 5 avisos y «Ver más» para el resto.
- **Drawer «Por validar»** (`features/players/components/pending-reviews-drawer`):
  - grupos por jugador («Mateo Rodas»);
  - en cada pendiente: nombre declarado, parentesco, celular, cuándo y «Coincide con…»;
  - botones «Validar» y «Rechazar» (con confirmación);
  - aviso breve de éxito;
  - al quedar vacío: «No hay acudientes por validar».

## Cobertura de criterios

| Criterio | pgTAP | Vitest | Quickstart |
|---|---|---|---|
| CA-001 contador | `guardian_pending_reviews` | Navegación con y sin pendientes; «99+» | 1 |
| CA-002 avisos del inicio | `call_up_new_responses` | Inicio con avisos, enlace a la actividad, «Ver más» | 2 |
| CA-003 vistas al abrir | `mark_call_up_seen` | `CallUpService.load` marca visto | 2 |
| CA-004 drawer | — | Drawer agrupado; validar y rechazar | 3 |
| Aislamiento (FR-008, SC-005) | Owner B y `anon` | — | 4 |
