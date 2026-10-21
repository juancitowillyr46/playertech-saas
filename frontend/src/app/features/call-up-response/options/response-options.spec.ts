import { ANSWER_OPTIONS, changesLeftLabel, reasonLabel, reasonOptions } from './response-options';

describe('opciones de respuesta', () => {
    it('ofrece las tres respuestas de DEC-38', () => {
        expect(ANSWER_OPTIONS.map((option) => option.label)).toEqual(['Sí', 'Sí, provisional', 'No']);
    });

    it('cada respuesta tiene su lista de motivos y «Sí» no lleva motivo', () => {
        expect(reasonOptions('yes')).toEqual([]);
        expect(reasonOptions('no').map((option) => option.value)).toEqual(['illness', 'school', 'family', 'travel', 'transport', 'other']);
        expect(reasonOptions('maybe').map((option) => option.value)).toEqual(['schedule', 'transport', 'health', 'other']);
    });

    it('muestra el motivo o el texto de «Otro»', () => {
        expect(reasonLabel('no', 'illness', null)).toBe('Enfermedad o lesión');
        expect(reasonLabel('maybe', 'other', 'Llega tarde')).toBe('Llega tarde');
        expect(reasonLabel('yes', null, null)).toBe('');
    });

    it('indica los cambios restantes y, sin cambios, a quién acudir', () => {
        expect(changesLeftLabel(3)).toBe('Te quedan 3 cambios.');
        expect(changesLeftLabel(1)).toBe('Te queda 1 cambio.');
        expect(changesLeftLabel(0)).toBe('Escríbele a la academia para cambiarla.');
    });
});
