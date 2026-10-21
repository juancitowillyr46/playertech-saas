import { Answer } from '../models/public-call-up.models';

/** Respuestas, motivos y textos de la convocatoria (DEC-33 y DEC-38). Funciones puras. */

export interface Option<T extends string> {
    readonly value: T;
    readonly label: string;
}

export const ANSWER_OPTIONS: readonly Option<Answer>[] = [
    { value: 'yes', label: 'Sí' },
    { value: 'maybe', label: 'Sí, provisional' },
    { value: 'no', label: 'No' }
];

/** Etiquetas cortas para el seguimiento y las tarjetas estrechas. */
export const ANSWER_SHORT_LABELS: Readonly<Record<Answer, string>> = { yes: 'Sí', maybe: 'Provisional', no: 'No' };

/** Lista fija de motivos, igual para todas las academias (DEC-38). «Sí» no lleva motivo. */
export const REASON_OPTIONS: Readonly<Record<Exclude<Answer, 'yes'>, readonly Option<string>[]>> = {
    no: [
        { value: 'illness', label: 'Enfermedad o lesión' },
        { value: 'school', label: 'Compromiso académico' },
        { value: 'family', label: 'Compromiso familiar' },
        { value: 'travel', label: 'Viaje' },
        { value: 'transport', label: 'Transporte' },
        { value: 'other', label: 'Otro' }
    ],
    maybe: [
        { value: 'schedule', label: 'Horario (colegio o trabajo)' },
        { value: 'transport', label: 'Transporte' },
        { value: 'health', label: 'Salud' },
        { value: 'other', label: 'Otro' }
    ]
};

export const REASON_TEXT_MAX = 200;

export function reasonOptions(answer: Answer | null): readonly Option<string>[] {
    return answer === 'no' || answer === 'maybe' ? REASON_OPTIONS[answer] : [];
}

/** «Enfermedad o lesión», o el texto de «Otro»; vacío sin motivo. */
export function reasonLabel(answer: Answer | null, reason: string | null, reasonText: string | null): string {
    if (reason === 'other') {
        return reasonText ?? 'Otro';
    }

    return reasonOptions(answer).find((option) => option.value === reason)?.label ?? '';
}

/** «Te quedan 3 cambios», «Te queda 1 cambio» o, sin cambios, a quién acudir. */
export function changesLeftLabel(changesLeft: number): string {
    if (changesLeft <= 0) {
        return 'Escríbele a la academia para cambiarla.';
    }

    return changesLeft === 1 ? 'Te queda 1 cambio.' : `Te quedan ${changesLeft} cambios.`;
}
