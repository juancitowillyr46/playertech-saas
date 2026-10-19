import { FormControl } from '@angular/forms';
import { normalizePhone, phoneValidator } from './phone.validator';

describe('phoneValidator', () => {
    it('normaliza espacios, guiones y paréntesis', () => {
        expect(normalizePhone(' (300) 123-4567 ')).toBe('3001234567');
        expect(normalizePhone(null)).toBe('');
    });

    it.each(['', '300 123 4567', '3001234567'])('acepta «%s»', (value) => {
        expect(phoneValidator(new FormControl(value))).toBeNull();
    });

    it.each(['2001234567', '300123456', '30012345678', '300abc4567'])('rechaza «%s»', (value) => {
        expect(phoneValidator(new FormControl(value))).toEqual({ phone: true });
    });
});
