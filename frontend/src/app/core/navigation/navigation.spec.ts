import { MenuItem } from 'primeng/api';
import { APP_NAVIGATION } from './navigation';

function routes(items: MenuItem[]): string[] {
    return items.flatMap((item) => [...(item.routerLink ? [String(item.routerLink)] : []), ...routes(item.items ?? [])]);
}

describe('APP_NAVIGATION', () => {
    it('contiene General (Inicio) y Configuración (Academia y Sedes)', () => {
        expect(APP_NAVIGATION.map((item) => item.label)).toEqual(['General', 'Configuración']);
        expect(routes(APP_NAVIGATION)).toEqual(['/home', '/settings/academy', '/settings/venues']);
        expect(APP_NAVIGATION[1].items?.map((item) => item.label)).toEqual(['Academia', 'Sedes']);
    });

    it('no incluye ninguna ruta bajo /dev (FR-037)', () => {
        expect(routes(APP_NAVIGATION).some((route) => route.startsWith('/dev'))).toBe(false);
    });
});
