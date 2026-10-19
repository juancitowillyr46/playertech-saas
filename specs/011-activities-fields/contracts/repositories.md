# Contratos de repositorios y servicios

Patrón de las specs 004 y 009.

```ts
type ActivityType = 'training' | 'competition';
type ActivityStatus = 'scheduled' | 'cancelled';
interface Place { kind: 'venue' | 'field'; id: string; name: string; address: string | null; city: string | null; directions: string | null }

interface ActivityInput {
    type: ActivityType;
    startsAt: string;            // ISO con -05:00
    endsAt: string | null;
    callAt: string | null;
    place: { kind: 'venue' | 'field'; id: string };
    notes: string | null;
    opponent: string | null;     // null en entrenamiento
    tournament: string | null;
}
interface Activity extends Omit<ActivityInput, 'place'> { id: string; status: ActivityStatus; place: Place; seriesId: string | null }

abstract class ActivityRepository {
    list(when: 'upcoming' | 'past'): Promise<readonly Activity[]>;   // no eliminadas, con el lugar embebido
    get(id: string): Promise<Activity>;
    create(inputs: readonly ActivityInput[], seriesId: string | null): Promise<number>;  // un solo insert
    update(id: string, input: ActivityInput): Promise<void>;
    setStatus(id: string, status: ActivityStatus): Promise<void>;
    delete(id: string): Promise<void>;
}

interface ExternalField { id: string; name: string; address: string | null; city: string | null; directions: string | null }
abstract class ExternalFieldRepository {
    list(): Promise<readonly ExternalField[]>;                      // no retiradas, por nombre
    create(input: Omit<ExternalField, 'id'>): Promise<ExternalField>;
    update(id: string, input: Omit<ExternalField, 'id'>): Promise<void>;
    retire(id: string): Promise<void>;
}
```

## Servicios

- **`ActivitiesService`**:
  - `when` (próximas o pasadas), `typeFilter`;
  - `days`: grupos por día de Colombia;
  - `create(form)`: genera la serie si hay repetición (`weeklyDates` de `colombia-time`) y devuelve cuántas creó;
  - `update`, `cancel`, `reactivate`, `remove`;
  - `placeOptions()`: sedes activas (`VenueRepository`) y canchas.
- **`ExternalFieldsService`**: catálogo con `isNameTaken`, `create`, `update`, `retire`.

## shared/text/colombia-time.ts

- `toInstant(date, time)`: de `yyyy-mm-dd` y `HH:mm` de Colombia a un ISO con `-05:00`.
- `fromInstant(iso)`: `{ date, time }` en Colombia.
- `dayKey(iso)`: el día de Colombia.
- `weeklyDates(from, until, weekdays)`: las fechas entre ambas en los días de la semana elegidos.
