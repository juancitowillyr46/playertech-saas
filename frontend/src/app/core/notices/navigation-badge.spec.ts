import { navigationBadge } from './navigation-badge';

describe('navigationBadge', () => {
    const home = { label: 'Inicio', routerLink: ['/home'] };

    it('solo «Inicio» lleva el contador, y solo con pendientes', () => {
        expect(navigationBadge(home, 1)).toEqual({ value: '1', label: 'Inicio, 1 acudiente por validar' });
        expect(navigationBadge(home, 0)).toBeNull();
        expect(navigationBadge({ label: 'Actividades', routerLink: ['/activities'] }, 4)).toBeNull();
    });
});
