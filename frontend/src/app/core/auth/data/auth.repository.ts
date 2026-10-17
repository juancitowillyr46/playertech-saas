import { AuthSession, SignUpInput } from '../models/auth.models';

/**
 * Contrato de autenticación independiente del proveedor (contracts/repositories.md).
 * Ante un fallo, toda operación rechaza con `AppError`.
 */
export abstract class AuthRepository {
    abstract signUp(input: SignUpInput): Promise<void>;

    abstract signIn(email: string, password: string): Promise<AuthSession>;

    abstract signOut(): Promise<void>;

    /** Resuelve igual exista o no la cuenta (DEC-12). */
    abstract requestPasswordReset(email: string): Promise<void>;

    /** Requiere la sesión temporal de recuperación. */
    abstract updatePassword(newPassword: string): Promise<void>;

    /** Completa el retorno de los enlaces de correo (flujo PKCE). */
    abstract exchangeCodeForSession(code: string): Promise<AuthSession>;

    abstract getSession(): Promise<AuthSession | null>;

    /** Devuelve la función que cancela la suscripción. */
    abstract onSessionChange(listener: (session: AuthSession | null) => void): () => void;
}
