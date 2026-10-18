import { AppConfig, validateAppConfig } from './app-config';

const valid: AppConfig = {
    production: false,
    supabaseUrl: 'http://localhost:54321',
    supabasePublishableKey: 'sb_publishable_local',
    sessionInactivityMinutes: 60
};

describe('validateAppConfig', () => {
    it('acepta una configuración completa', () => {
        expect(validateAppConfig(valid)).toBe(valid);
    });

    it('falla sin la conexión con Supabase', () => {
        expect(() => validateAppConfig({ ...valid, supabaseUrl: '' })).toThrow(/Supabase/);
        expect(() => validateAppConfig({ ...valid, supabasePublishableKey: ' ' })).toThrow(/Supabase/);
    });

    it.each([0, -5, 2.5, Number.NaN])('falla con un tiempo de inactividad de %s minutos', (minutes) => {
        expect(() => validateAppConfig({ ...valid, sessionInactivityMinutes: minutes })).toThrow(/sessionInactivityMinutes/);
    });
});
