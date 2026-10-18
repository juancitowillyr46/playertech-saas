# Contratos de sesión

Contratos internos del frontend que cambia o crea la spec 005. Los de la spec 002 (`specs/002-frontend-foundation/contracts/`) siguen vigentes salvo lo indicado aquí.

## AppConfig (`core/config/app-config.ts`)

```ts
interface AppConfig {
    readonly production: boolean;
    readonly supabaseUrl: string;
    readonly supabasePublishableKey: string;
    /** Minutos sin interacción antes de cerrar la sesión (DEC-28). Entero > 0. */
    readonly sessionInactivityMinutes: number;
}
```

`validateAppConfig` falla al iniciar si el valor no es un entero mayor que 0.

## InactivityService (`core/auth/inactivity.service.ts`, nuevo)

```ts
@Injectable({ providedIn: 'root' })
class InactivityService {
    /** Arranca la vigilancia. La llama AuthService al iniciar la aplicación; onExpire cierra la sesión. */
    start(onExpire: () => void, isAuthenticated: Signal<boolean>): void;
    /** true si la última interacción guardada ya venció (R4). No modifica nada. */
    isExpired(): boolean;
    /** Guarda la hora actual como última interacción. */
    markActivity(): void;
}
```

- Con sesión: escucha `pointerdown`, `keydown`, `wheel` y `scroll` (captura), pasivos, y registra la hora como mucho una vez cada 5 s. Comprueba cada 30 s con la pestaña visible, y en `visibilitychange`, `focus` y `pageshow`.
- Al detectar inactividad vencida llama a `onExpire` una sola vez por sesión.
- Sin sesión: no escucha, no comprueba y borra `playertech.lastActivityAt`.
- **No inyecta `AuthService`** ni conoce Supabase: recibe en `start()` el cierre y la señal de sesión. La dependencia va en un solo sentido, de `AuthService` a `InactivityService` (U2).

## AuthService (`core/auth/auth.service.ts`, cambios)

```ts
type SignOutReason = 'manual' | 'inactivity';

readonly signOutReason: Signal<SignOutReason | null>;
signOut(reason?: SignOutReason): Promise<void>;   // por defecto 'manual'
```

- `restore()`: si hay sesión guardada y `InactivityService.isExpired()`, cierra la sesión **sin navegar**: borra la sesión local en el repositorio (ignorando su error), deja la sesión nula y guarda el motivo `inactivity`, todo antes de marcar `ready`. La redirección la hace `authGuard`, que conserva `returnUrl` (U1).
- Inicia la vigilancia con `inactivity.start(() => this.signOut('inactivity'), this.isAuthenticated)`.
- `signOut()` ignora una segunda llamada mientras la primera está en curso (doble toque).
- `signIn()` y `completeEmailLink()`: borran `signOutReason` y marcan la actividad.
- `signOut()`: siempre deja la sesión nula y navega a `/auth/login`, aunque el servidor falle (comportamiento existente).

## AuthRepository (`core/auth/data/`)

Sin cambios de firma. `SupabaseAuthRepository.signOut()` usa `{ scope: 'local' }` (R7): cierra solo la sesión de este navegador.

## Inicio de sesión (`features/auth/login/login.ts`)

Con `signOutReason() === 'inactivity'`, muestra arriba del formulario un `p-message` de severidad `info`: «Tu sesión se cerró por inactividad. Ingresa de nuevo para continuar.» Tras un cierre manual, no muestra nada.
