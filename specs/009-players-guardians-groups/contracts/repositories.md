# Contratos de repositorios y servicios

Patrón de la spec 004: repositorio abstracto, implementación Supabase (snake_case → camelCase solo aquí), servicio con señales `status` y `busy`, `run()` que ignora llamadas con `busy`, refresca tras cada operación y relee ante `not_found`.

## features/players

```ts
interface PlayerInput { firstNames: string; lastNames: string; nickname: string | null; birthDate: string; phone: string | null; groupIds: string[] }
interface PlayerSummary { id; firstNames; lastNames; nickname; birthDate; phone; isActive; groups: { id: string; name: string }[]; guardianCount: number }

abstract class PlayerRepository {
    listPlayers(): Promise<PlayerSummary[]>;               // no eliminados, con grupos y conteo de acudientes
    getPlayer(id: string): Promise<PlayerSummary>;
    findByIdentity(firstNames: string, lastNames: string, birthDate: string): Promise<PlayerSummary | null>;
    createPlayer(input: PlayerInput): Promise<PlayerSummary>;   // inserta y crea las integraciones a grupos
    updatePlayer(id: string, input: PlayerInput): Promise<PlayerSummary>; // actualiza y sincroniza grupos
    setActive(id: string, active: boolean): Promise<void>;
    deletePlayer(id: string): Promise<void>;                  // borrado lógico
}

interface Guardian { linkId; guardianId; fullName; phone; relationship: 'mother' | 'father' | 'grandparent' | 'other' }
abstract class GuardianRepository {
    listByPlayer(playerId: string): Promise<Guardian[]>;   // con los otros jugadores que acompaña («También de…»)
    findByPhone(phone: string): Promise<{ guardianId: string; fullName: string } | null>; // aviso anticipado
    addToPlayer(playerId: string, input: { fullName; phone; relationship; consent: true }): Promise<{ guardianExisted: boolean; guardianName: string }>;
    updateGuardian(guardianId: string, input: { fullName: string; phone: string }): Promise<void>;
    updateRelationship(linkId: string, relationship: Guardian['relationship']): Promise<void>;
    removeFromPlayer(linkId: string): Promise<void>;          // deleted_at en el vínculo
}
```

- **`PlayersService`**:
  - `players`, `visiblePlayers` (búsqueda sin tildes y filtros por grupo y estado; activos por defecto);
  - `save(input, id?)` que antes de crear consulta `findByIdentity`: si existe, devuelve `{ duplicate: PlayerSummary }` sin guardar, para que la página ofrezca actualizarlo o reactivarlo;
  - `setActive`, `remove`.
- **`PlayerDetailService`**: el jugador y sus acudientes, con las operaciones de acudientes.

## features/groups

```ts
interface GroupSummary { id; name; activePlayerCount: number }
interface GroupDetail extends GroupSummary { members: { playerId; firstNames; lastNames; nickname; isActive }[] }

abstract class GroupRepository {
    listGroups(): Promise<GroupSummary[]>;
    getGroup(id: string): Promise<GroupDetail>;
    createGroup(name: string): Promise<GroupSummary>;
    renameGroup(id: string, name: string): Promise<void>;
    deleteGroup(id: string): Promise<void>;                   // borrado lógico; los integrantes se borran físicamente
    addMembers(groupId: string, playerIds: string[]): Promise<void>;
    removeMember(groupId: string, playerId: string): Promise<void>;
}
```

## shared

`phoneValidator`: quita espacios y guiones y exige `^3\d{9}$`. `normalizePhone(value)` devuelve los 10 dígitos.
