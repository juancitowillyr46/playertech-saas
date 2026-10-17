export type AcademyContextStatus = 'loading' | 'active' | 'suspended' | 'none' | 'error';

export interface CurrentAcademy {
    readonly id: string;
    readonly name: string;
    readonly logoFileId: string | null;
}

/**
 * Situación del usuario respecto a su academia (research R6). `academy` solo
 * existe cuando `status` es `active`.
 */
export interface AcademyContext {
    readonly status: AcademyContextStatus;
    readonly academy?: CurrentAcademy;
}
