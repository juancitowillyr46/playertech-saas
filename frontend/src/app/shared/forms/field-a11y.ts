/**
 * Asociación accesible entre un campo y su mensaje de error (WCAG 1.3.1 y 3.3.1):
 * `aria-invalid` y `aria-describedby` apuntando al mensaje, cuyo id es `<campo>-error`.
 *
 * `pInputText` recibe los atributos directamente. En `p-password` y `p-checkbox`, la
 * caja de texto o casilla real está dentro del componente; se le pasan con la API
 * pass-through (`pt`) de PrimeNG.
 */
export interface FieldA11y {
    readonly 'aria-invalid': 'true' | null;
    readonly 'aria-describedby': string | null;
}

export function fieldA11y(field: string, invalid: boolean): FieldA11y {
    return { 'aria-invalid': invalid ? 'true' : null, 'aria-describedby': invalid ? `${field}-error` : null };
}

/** Pass-through para la caja de texto interna de `p-password`. */
export function passwordPt(field: string, invalid: boolean) {
    return { pcInputText: { root: fieldA11y(field, invalid) } };
}

/** Pass-through para la casilla interna de `p-checkbox`. */
export function checkboxPt(field: string, invalid: boolean, labelledBy: string | null = null) {
    return { input: { ...fieldA11y(field, invalid), 'aria-labelledby': labelledBy } };
}
