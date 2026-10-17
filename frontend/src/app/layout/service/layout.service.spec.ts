import { TestBed } from '@angular/core/testing';
import { LayoutService } from './layout.service';

const KEY = 'playertech.darkTheme';

describe('LayoutService', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.classList.remove('app-dark');
    });

    afterEach(() => vi.restoreAllMocks());

    it('usa el primario tinta del preset y el menú estático', () => {
        const service = TestBed.inject(LayoutService);

        expect(service.getPrimary()).toBe('tinta');
        expect(service.layoutConfig().menuMode).toBe('static');
    });

    it('recupera el modo oscuro guardado y lo aplica al iniciar', () => {
        localStorage.setItem(KEY, 'true');

        const service = TestBed.inject(LayoutService);

        expect(service.isDarkTheme()).toBe(true);
        expect(document.documentElement.classList.contains('app-dark')).toBe(true);
    });

    it('sin preferencia guardada sigue el modo oscuro del sistema, sin guardarlo', () => {
        vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(prefers-color-scheme: dark)' }));

        const service = TestBed.inject(LayoutService);
        TestBed.tick();

        expect(service.isDarkTheme()).toBe(true);
        expect(document.documentElement.classList.contains('app-dark')).toBe(true);
        expect(localStorage.getItem(KEY)).toBeNull();
        vi.unstubAllGlobals();
    });

    it('la elección guardada prevalece sobre la preferencia del sistema', () => {
        vi.stubGlobal('matchMedia', () => ({ matches: true }));
        localStorage.setItem(KEY, 'false');

        const service = TestBed.inject(LayoutService);

        expect(service.isDarkTheme()).toBe(false);
        vi.unstubAllGlobals();
    });

    it('guarda el modo al cambiarlo', () => {
        const service = TestBed.inject(LayoutService);
        TestBed.tick();

        service.layoutConfig.update((state) => ({ ...state, darkTheme: true }));
        TestBed.tick();

        expect(localStorage.getItem(KEY)).toBe('true');
        expect(document.documentElement.classList.contains('app-dark')).toBe(true);
    });

    it('funciona con el modo claro si el almacenamiento no está disponible', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('bloqueado');
        });
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('bloqueado');
        });

        const service = TestBed.inject(LayoutService);
        TestBed.tick();

        expect(service.isDarkTheme()).toBe(false);
        expect(() => {
            service.layoutConfig.update((state) => ({ ...state, darkTheme: true }));
            TestBed.tick();
        }).not.toThrow();
    });
});
