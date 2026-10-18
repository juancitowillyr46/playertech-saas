import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AcademyContextService } from '../academy-context/academy-context.service';
import { AuthService } from './auth.service';
import { AuthRepository } from './data/auth.repository';
import { InactivityService } from './inactivity.service';
import { AuthSession } from './models/auth.models';

const session = { user: { id: 'user-1', email: 'owner@playertech.test' } } as AuthSession;

function setup({ stored = null as AuthSession | null, expired = false } = {}) {
    const repository = {
        getSession: vi.fn().mockResolvedValue(stored),
        signIn: vi.fn().mockResolvedValue(session),
        signOut: vi.fn().mockResolvedValue(undefined),
        exchangeCodeForSession: vi.fn().mockResolvedValue(session),
        onSessionChange: vi.fn().mockReturnValue(() => undefined)
    };
    const inactivity = { isExpired: vi.fn().mockReturnValue(expired), markActivity: vi.fn(), start: vi.fn() };
    const academyContext = { clear: vi.fn() };

    TestBed.configureTestingModule({
        providers: [
            provideRouter([]),
            { provide: AuthRepository, useValue: repository },
            { provide: InactivityService, useValue: inactivity },
            { provide: AcademyContextService, useValue: academyContext }
        ]
    });

    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    return { auth: TestBed.inject(AuthService), repository, inactivity, academyContext, navigate };
}

describe('AuthService', () => {
    it('restaura una sesión vigente (HU-001 CA-006)', async () => {
        const { auth } = setup({ stored: session });

        await auth.restore();

        expect(auth.isAuthenticated()).toBe(true);
        expect(auth.ready()).toBe(true);
    });

    it('sin sesión guardada queda listo y sin sesión', async () => {
        const { auth } = setup();

        await auth.restore();

        expect(auth.isAuthenticated()).toBe(false);
        expect(auth.ready()).toBe(true);
    });

    it('al restaurar una sesión vencida por inactividad la cierra sin navegar (research R4)', async () => {
        const { auth, repository, navigate } = setup({ stored: session, expired: true });
        repository.signOut.mockRejectedValue(new Error('sin conexión'));

        await auth.restore();

        expect(auth.isAuthenticated()).toBe(false);
        expect(auth.signOutReason()).toBe('inactivity');
        expect(repository.signOut).toHaveBeenCalled();
        expect(navigate).not.toHaveBeenCalled();
        expect(auth.ready()).toBe(true);
    });

    it('cierra la sesión, limpia el contexto y navega al inicio de sesión aunque el servidor falle (HU-015 CA-001)', async () => {
        const { auth, repository, academyContext, navigate } = setup({ stored: session });
        await auth.restore();
        repository.signOut.mockRejectedValue(new Error('sin conexión'));

        await expect(auth.signOut()).rejects.toThrow();

        expect(auth.isAuthenticated()).toBe(false);
        expect(auth.signOutReason()).toBe('manual');
        expect(academyContext.clear).toHaveBeenCalled();
        expect(navigate).toHaveBeenCalledWith('/auth/login');
    });

    it('guarda el motivo de un cierre por inactividad', async () => {
        const { auth } = setup({ stored: session });
        await auth.restore();

        await auth.signOut('inactivity');

        expect(auth.signOutReason()).toBe('inactivity');
    });

    it('ignora un segundo cierre mientras el primero está en curso (doble toque)', async () => {
        const { auth, repository } = setup({ stored: session });
        await auth.restore();

        await Promise.all([auth.signOut(), auth.signOut('inactivity')]);

        expect(repository.signOut).toHaveBeenCalledTimes(1);
        expect(auth.signOutReason()).toBe('manual');
    });

    it('al iniciar sesión borra el motivo anterior y marca la actividad', async () => {
        const { auth, inactivity } = setup({ stored: session });
        await auth.restore();
        await auth.signOut('inactivity');

        await auth.signIn('owner@playertech.test', 'Segura-2026');

        expect(auth.signOutReason()).toBeNull();
        expect(inactivity.markActivity).toHaveBeenCalled();
        expect(auth.isAuthenticated()).toBe(true);
    });

    it('arranca la vigilancia con el cierre por inactividad y la señal de sesión', async () => {
        const { auth, inactivity, repository } = setup({ stored: session });
        await auth.restore();

        auth.startInactivityWatch();
        const [onExpire, isAuthenticated] = inactivity.start.mock.calls[0];
        onExpire();
        await vi.waitFor(() => expect(repository.signOut).toHaveBeenCalled());

        expect(isAuthenticated).toBe(auth.isAuthenticated);
        expect(auth.signOutReason()).toBe('inactivity');
    });
});
