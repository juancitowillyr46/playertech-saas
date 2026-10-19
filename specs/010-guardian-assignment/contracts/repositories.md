# Contratos de repositorios y servicios

Cambios sobre `specs/009-players-guardians-groups/contracts/repositories.md`.

```ts
/** Acudiente de la academia con los jugadores activos que acompaña. */
interface GuardianOption {
    guardianId: string;
    fullName: string;
    phone: string;
    players: { playerId: string; name: string; relationship: Relationship }[]; // name = shortName
}

interface GuardianAssignment { guardianId: string; relationship: Relationship }

abstract class GuardianRepository {
    // … métodos de la spec 009
    listGuardians(): Promise<readonly GuardianOption[]>;                    // no eliminados, ordenados por nombre
    assign(playerId: string, assignments: readonly GuardianAssignment[]): Promise<number>; // RPC assign_guardians; 42501 → not_found
}
```

## PlayerDetailService (se amplía)

| Miembro | Qué hace |
|---|---|
| `guardianOptions()` | `listGuardians()`; cada opción indica si ya es de este jugador (`alreadyLinked`) |
| `siblings()` | Jugadores con `guardianCount > 0`, excepto el actual (`PlayerRepository.listPlayers`) |
| `siblingGuardians(playerId)` | `GuardianRepository.listByPlayer` del hermano |
| `assignGuardians(assignments)` | `assign` con el patrón `run()` y refresco de la ficha; devuelve cuántos asignó |
