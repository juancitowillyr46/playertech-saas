import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom } from 'rxjs';
import { AuthService } from '../auth.service';

/** Espera a que la sesión esté restaurada. Debe llamarse en un contexto de inyección (guards). */
export function whenSessionReady(auth: AuthService): Promise<unknown> {
    if (auth.ready()) {
        return Promise.resolve();
    }

    return firstValueFrom(toObservable(auth.ready).pipe(filter(Boolean)));
}
