import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Longitud mínima de contraseña de Supabase Auth (DEC-11, ADR-014). */
export const MIN_PASSWORD_LENGTH = 8;

/** Valida en el grupo que `confirmation` sea igual a `password`; marca el error en la confirmación. */
export function passwordsMatch(passwordKey: string, confirmationKey: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
        const password = group.get(passwordKey)?.value;
        const confirmation = group.get(confirmationKey)?.value;

        return confirmation && password !== confirmation ? { passwordsMismatch: true } : null;
    };
}
