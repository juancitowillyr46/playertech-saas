import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AcademyContextService } from '../academy-context/academy-context.service';
import { AuthRepository } from './data/auth.repository';
import { InactivityService } from './inactivity.service';
import { AuthSession, SignOutReason, SignUpInput } from './models/auth.models';

/**
 * Estado de la sesión para toda la aplicación (research R9). Los guards esperan
 * a `ready()` antes de decidir.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly repository = inject(AuthRepository);
    private readonly academyContext = inject(AcademyContextService);
    private readonly router = inject(Router);
    private readonly inactivity = inject(InactivityService);
    private readonly state = signal<AuthSession | null>(null);
    private readonly restored = signal(false);
    private readonly reason = signal<SignOutReason | null>(null);
    private signingOut = false;

    readonly session = this.state.asReadonly();
    readonly user = computed(() => this.state()?.user ?? null);
    readonly isAuthenticated = computed(() => this.state() !== null);
    readonly ready = this.restored.asReadonly();
    /** Motivo del último cierre de sesión en esta carga; el inicio de sesión avisa si fue por inactividad. */
    readonly signOutReason = this.reason.asReadonly();

    constructor() {
        const unsubscribe = this.repository.onSessionChange((session) => this.applySession(session));

        inject(DestroyRef).onDestroy(unsubscribe);
    }

    /**
     * Restaura la sesión guardada al iniciar la aplicación. Si venció por inactividad
     * mientras la aplicación estaba cerrada, la cierra sin navegar: `authGuard` lleva al
     * inicio de sesión conservando la ruta pedida (research R4 de la spec 005).
     */
    async restore(): Promise<void> {
        try {
            const session = await this.repository.getSession();

            if (session && this.inactivity.isExpired()) {
                this.reason.set('inactivity');
                await this.repository.signOut().catch(() => undefined);
                this.applySession(null);
            } else {
                this.applySession(session);
            }
        } catch {
            this.applySession(null);
        } finally {
            this.restored.set(true);
        }
    }

    /** Vigila la inactividad mientras haya sesión (DEC-28). Se llama una vez al iniciar. */
    startInactivityWatch(): void {
        this.inactivity.start(() => void this.signOut('inactivity'), this.isAuthenticated);
    }

    async signIn(email: string, password: string): Promise<void> {
        this.startSession(await this.repository.signIn(email, password));
    }

    signUp(input: SignUpInput): Promise<void> {
        return this.repository.signUp(input);
    }

    requestPasswordReset(email: string): Promise<void> {
        return this.repository.requestPasswordReset(email);
    }

    resendVerification(email: string): Promise<void> {
        return this.repository.resendVerification(email);
    }

    updatePassword(newPassword: string): Promise<void> {
        return this.repository.updatePassword(newPassword);
    }

    /** Completa el retorno de un enlace de correo e inicia la sesión. */
    async completeEmailLink(code: string): Promise<void> {
        this.startSession(await this.repository.exchangeCodeForSession(code));
    }

    async signOut(reason: SignOutReason = 'manual'): Promise<void> {
        // Un doble toque o un cierre por inactividad simultáneo no repiten el cierre.
        if (this.signingOut) {
            return;
        }

        this.signingOut = true;
        this.reason.set(reason);

        try {
            await this.repository.signOut();
        } finally {
            this.applySession(null);
            this.signingOut = false;
            await this.router.navigateByUrl('/auth/login');
        }
    }

    private startSession(session: AuthSession): void {
        this.reason.set(null);
        this.inactivity.markActivity();
        this.applySession(session);
    }

    private applySession(session: AuthSession | null): void {
        if (session?.user.id !== this.state()?.user.id) {
            // Otro usuario o cierre de sesión: el contexto anterior ya no aplica.
            this.academyContext.clear();
        }

        this.state.set(session);
    }
}
