# Contrato de repositorios y servicios

Capas: página → servicio → repositorio abstracto → implementación Supabase (`docs/architecture/frontend.md`). Las filas de Supabase se tipan con interfaces (`coding-standards.md`); los errores en clave se traducen a `AppError` con textos en español.

## Feature nueva `features/call-up-response` (acudiente, ruta pública)

### `PublicCallUpRepository` (abstracto)

```ts
load(token: string, deviceKeys: readonly string[]): Promise<PublicCallUp>;
identify(token: string, input: IdentifyInput, deviceKey: string | null): Promise<string>; // devuelve el secreto del dispositivo
respond(token: string, deviceKey: string, input: ResponseInput): Promise<ResponseResult>;
```

- `PublicCallUp`, `IdentifyInput`, `ResponseInput` y `ResponseResult` reflejan el JSON de `contracts/database.md`.
- `SupabasePublicCallUpRepository` llama a `public_call_up`, `public_identify` y `public_respond`.

### `DeviceKeyStore`

`keys(): string[]` y `remember(key: string): void` sobre `localStorage`, con hasta 10 llaves y `try/catch`. Si el navegador no permite guardar, devuelve una lista vacía y la persona se identifica cada vez.

### `CallUpResponseService`

- **Signals:** `state` (`loading`, `choose`, `identify`, `respond`, `readonly`, `not_found` o `error`), `callUp`, `selectedPlayer` y `busy`.
- **Métodos:** `load(token)`, `choose(player)`, `identify(input)` (guarda la llave y recarga), `respond(playerId, input)` (actualiza `mine` sin recargar la página) y `addSomeone()` (vuelve a `choose` con la llave actual).

### Funciones puras (`response-options.ts`)

- Opciones de respuesta con sus etiquetas: «Sí», «Sí, provisional» y «No».
- Motivos por respuesta (DEC-38) con sus etiquetas en español.
- Texto de cambios restantes: «Te quedan 2 cambios», «Te queda 1 cambio», «Escríbele a la academia para cambiarla».

## Feature `features/call-ups` (owner; se amplía)

### `CallUpRepository`, métodos nuevos

```ts
responses(callUpId: string): Promise<readonly CurrentResponse[]>;       // call_up_current_responses
summaries(activityIds: readonly string[]): Promise<readonly CallUpSummary[]>; // call_up_summaries
history(callUpId: string, playerId: string): Promise<readonly ResponseEntry[]>;
respondAsOwner(callUpId: string, playerId: string, input: ResponseInput): Promise<void>;
```

### `CallUpService`, ampliación

- **Signals nuevas:** `responses` y el computed `totals`, con los totales general y por lista.
- **`load` y `refresh`:** también leen las respuestas.
- **Métodos nuevos:** `respondAsOwner`, `review` (los dos recargan con `run`) e `history`.

### Lista de actividades

`ActivityRepository` (o el servicio de la lista) lee `summaries` por los ids visibles y expone `confirmed` y `total` por actividad para la etiqueta «12/17».

## Feature `features/players` (se amplía)

- `GuardianRepository.pending(playerId)`: devuelve los vínculos y dispositivos pendientes del jugador, con el nombre declarado y si el celular coincide con un acudiente registrado.
- `GuardianRepository.review(linkId, deviceId, decision)`: llama a `review_guardian`. Es la **única** vía de revisión (principio IV): la usan la ficha del jugador y el drawer del seguimiento, porque los acudientes pertenecen a la feature `players`, de la que `call-ups` ya toma sus modelos. Por eso `CallUpRepository` no lleva `reviewGuardian`.
