import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AcademyContextService } from '../academy-context/academy-context.service';
import { AuthRepository } from './data/auth.repository';
import { AuthSession, SignUpInput } from './models/auth.models';

/**
 * Estado de la sesión para toda la aplicación (research R9). Los guards esperan
 * a `ready()` antes de decidir.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly repository = inject(AuthRepository);
    private readonly academyContext = inject(AcademyContextService);
    private readonly router = inject(Router);
    private readonly state = signal<AuthSession | null>(null);
    private readonly restored = signal(false);

    readonly session = this.state.asReadonly();
    readonly user = computed(() => this.state()?.user ?? null);
    readonly isAuthenticated = computed(() => this.state() !== null);
    readonly ready = this.restored.asReadonly();

    constructor() {
        const unsubscribe = this.repository.onSessionChange((session) => this.applySession(session));

        inject(DestroyRef).onDestroy(unsubscribe);
    }

    /** Restaura la sesión guardada al iniciar la aplicación. */
    async restore(): Promise<void> {
        try {
            this.applySession(await this.repository.getSession());
        } catch {
            this.applySession(null);
        } finally {
            this.restored.set(true);
        }
    }

    async signIn(email: string, password: string): Promise<void> {
        this.applySession(await this.repository.signIn(email, password));
    }

    signUp(input: SignUpInput): Promise<void> {
        return this.repository.signUp(input);
    }

    requestPasswordReset(email: string): Promise<void> {
        return this.repository.requestPasswordReset(email);
    }

    updatePassword(newPassword: string): Promise<void> {
        return this.repository.updatePassword(newPassword);
    }

    /** Completa el retorno de un enlace de correo e inicia la sesión. */
    async completeEmailLink(code: string): Promise<void> {
        this.applySession(await this.repository.exchangeCodeForSession(code));
    }

    async signOut(): Promise<void> {
        try {
            await this.repository.signOut();
        } finally {
            this.applySession(null);
            await this.router.navigateByUrl('/auth/login');
        }
    }

    private applySession(session: AuthSession | null): void {
        if (session?.user.id !== this.state()?.user.id) {
            // Otro usuario o cierre de sesión: el contexto anterior ya no aplica.
            this.academyContext.clear();
        }

        this.state.set(session);
    }
}
