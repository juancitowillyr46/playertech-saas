export interface AuthUser {
    readonly id: string;
    readonly email: string;
    readonly emailConfirmed: boolean;
}

export interface AuthSession {
    readonly user: AuthUser;
    /** Fecha de caducidad del token de acceso. */
    readonly expiresAt: Date | null;
}

/** Datos del registro de una academia (contrato `registration-metadata.md` de la spec 001). */
export interface SignUpInput {
    readonly email: string;
    readonly password: string;
    readonly academyName: string;
    readonly fullName: string;
    readonly legalAcceptances: {
        readonly terms: string;
        readonly privacyPolicy: string;
    };
}

/** Por qué se cerró la sesión: el inicio de sesión avisa solo tras la inactividad (DEC-28). */
export type SignOutReason = 'manual' | 'inactivity';
