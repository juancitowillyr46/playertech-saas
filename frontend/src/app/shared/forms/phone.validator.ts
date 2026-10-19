import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Celular colombiano: 10 dígitos que empiezan por 3 (spec 009, FR-002). */
const COLOMBIAN_MOBILE = /^3\d{9}$/;

/** Quita espacios, guiones y paréntesis: «300 123-4567» → «3001234567». */
export function normalizePhone(value: string | null | undefined): string {
    return (value ?? '').replace(/[\s\-()]/g, '');
}

/** Acepta el vacío (lo obligatorio va con `Validators.required`); si hay valor, exige un celular válido. */
export function phoneValidator(control: AbstractControl<string | null>): ValidationErrors | null {
    const phone = normalizePhone(control.value);

    return !phone || COLOMBIAN_MOBILE.test(phone) ? null : { phone: true };
}

export const PHONE_ERROR = 'Escribe un celular de 10 dígitos que empiece por 3.';
