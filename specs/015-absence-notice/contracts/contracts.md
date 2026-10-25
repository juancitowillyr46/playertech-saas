# Contratos: Aviso de inasistencia

## Base de datos

Ver `data-model.md`. Pruebas pgTAP (`130-player-absences.test.sql`):

- **Marcar y desmarcar** en el plazo; volver a marcar conserva `notified_at`.
- **Antes del inicio**, **al día siguiente** y **una actividad que empezó a las 11:00 p. m. de ayer** (hora de Colombia): `absence_window_closed`, también al desmarcar y en `mark_absence_notified`.
- **Actividad cancelada**: `activity_not_scheduled`.
- **`mark_absence_notified`** pone la hora; sin marca falla.
- **Un jugador de la academia B** no se marca en una actividad de A.
- **Aislamiento:** el owner B no ve ni marca ausencias de A; `anon` no accede.
- **La convocatoria** y sus respuestas no cambian al marcar.

## Repositorios y servicios (`features/absences`)

```ts
export abstract class AbsenceRepository {
    abstract list(activityId: string): Promise<readonly Absence[]>;          // ausencias vigentes y desmarcadas con aviso, con el nombre del jugador
    abstract setAbsent(activityId: string, playerId: string, absent: boolean): Promise<void>;
    abstract markNotified(activityId: string, playerId: string): Promise<string>; // devuelve notified_at
}
```

`AbsenceService`:
- `load(activity)`: lee las ausencias, la convocatoria, las respuestas o los grupos (R3);
- `candidates(groupIds)`: la lista para marcar;
- `toggle(player)`: marca o desmarca de forma optimista, y si falla, revierte y avisa;
- `notified(player)`;
- `summary`: «N no llegaron · M avisados»;
- `window`: `before`, `open` o `closed`.

Función pura `absenceMessage({ recipientFirstName, playerFirstName, activity })` en `messages/absence-message.ts`, con su prueba: saluda al destinatario por su nombre.

## Interfaz

- **Sección en el detalle de la actividad**, después de «Convocatoria»:
  - **antes del inicio:** no aparece;
  - **en el plazo:** «¿Quién no llegó?» y el resumen;
  - **después:** solo el resumen y la lista, en modo lectura.
- **Drawer «¿Quién no llegó?»:**
  - **sin convocatoria:** chips de grupo (selección múltiple), buscador si hay más de 12 y filas de 52 px con el nombre completo y el apodo. El toque marca o desmarca, con la etiqueta «No llegó» y el botón «Avisar»;
  - **con convocatoria:** secciones «Dijeron Sí», «Provisional o sin respuesta» y «Avisaron que no».
- **Drawer «Avisar»:**
  - destinatario: elegir acudiente si hay varios, o «el jugador»;
  - «Tu mensaje», editable, con el texto sugerido;
  - «Abrir WhatsApp», y «Copiar» como secundario. Sin celular, solo «Copiar».
  - Al abrir el chat o copiar, el jugador queda «Avisado h:mm».

## Cobertura de criterios

| Criterio | pgTAP | Vitest | Quickstart |
|---|---|---|---|
| CA-001 plazo | Antes del inicio, al día siguiente, cancelada | Sección según el plazo | 1 |
| CA-002 lista | — | Por grupos sin repetir; convocados ordenados | 1 y 2 |
| CA-003 marcar | Marcar, desmarcar, volver a marcar | Toque, desmarcar y error con reversión | 1 |
| CA-004 avisar | `mark_absence_notified` | Mensaje, destinatario, WhatsApp, «Avisado» | 3 |
| CA-005 resumen | — | «N no llegaron · M avisados» | 1 |
| Aislamiento (FR-009) | Owner B y `anon` | — | 4 |
