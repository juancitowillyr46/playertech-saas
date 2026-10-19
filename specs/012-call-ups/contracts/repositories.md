# Contratos de repositorios, servicios y mensajes

```ts
interface CallUpGuardian { fullName: string; phone: string; relationship: Relationship }
interface CallUpPlayer { playerId: string; firstNames: string; lastNames: string; nickname: string | null; phone: string | null; guardians: CallUpGuardian[] }
interface CallUpList { id: string; groupId: string | null; groupName: string | null; token: string; intro: string | null; players: CallUpPlayer[] }
interface CallUp { id: string; activityId: string; deadline: string | null; closedAt: string | null; lists: CallUpList[] }

abstract class CallUpRepository {
    getByActivity(activityId: string): Promise<CallUp | null>;
    create(activityId: string, deadline: string | null, lists: { groupId: string | null; playerIds: string[] }[]): Promise<void>;
    addPlayers(callUp: CallUp, listId: string, playerIds: string[]): Promise<void>;
    removePlayer(callUpId: string, playerId: string): Promise<void>;     // y borra la lista si queda vacía
    movePlayer(callUpId: string, playerId: string, listId: string): Promise<void>;
    setDeadline(callUpId: string, deadline: string | null): Promise<void>;
    close(callUpId: string): Promise<void>;
    saveIntro(listId: string, intro: string | null): Promise<void>;
}
```

- **`CallUpService`**:
  - `callUp`, `isOpen` (calculado con `closedAt`, `deadline` y el inicio de la actividad);
  - `candidates()`: jugadores activos con sus grupos, para convocar y sumar;
  - las operaciones con `run()` y refresco.
- **Mensajes** (`messages/call-up-messages.ts`): `listMessage`, `personalMessage`, `cancellationNotice` y `changeNotice`. Todas son funciones puras que reciben la actividad, las listas y el enlace.
- **WhatsApp** (`messages/whatsapp.ts`): `whatsappChat(phone, text)`, `shareText(text)` y `copyText(text)`.
