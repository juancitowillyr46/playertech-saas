import { BreakpointObserver } from '@angular/cdk/layout';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { AppError } from '../../../core/errors/app-error';
import { VenueRepository } from '../data/venue.repository';
import { Venue } from '../models/venue.models';
import { VenuesPage } from './venues-page';

const VENUES: Venue[] = [
    { id: 'v1', name: 'Sede Administrativa Chapinero', type: 'office', city: 'Bogotá', isPrimary: true, isActive: true },
    { id: 'v2', name: 'Cancha Sintética El Salitre', type: 'training_ground', city: 'Bogotá', isPrimary: false, isActive: true },
    { id: 'v3', name: 'Polideportivo Suba', type: 'training_ground', city: null, isPrimary: false, isActive: false }
];

async function setup(options: { listVenues?: () => Promise<readonly Venue[]>; mobile?: boolean } = {}) {
    const listVenues = vi.fn(options.listVenues ?? (() => Promise.resolve(VENUES)));
    const result = await render(VenuesPage, {
        providers: [
            { provide: VenueRepository, useValue: { listVenues } },
            { provide: BreakpointObserver, useValue: { observe: () => of({ matches: options.mobile ?? false, breakpoints: {} }) } }
        ]
    });
    await result.fixture.whenStable();
    result.detectChanges();

    return { ...result, listVenues, user: userEvent.setup() };
}

/** La lista de tarjetas (celular); la tabla repite los datos para escritorio. */
function cards() {
    return screen.getByRole('list', { name: 'Sedes de la academia' });
}

describe('VenuesPage', () => {
    it('muestra el encabezado con la acción principal', async () => {
        await setup();

        expect(screen.getByRole('heading', { level: 1, name: 'Sedes' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Nueva sede' })).toBeTruthy();
    });

    it('lista las sedes en tarjetas y en tabla, con la principal y el estado', async () => {
        await setup();

        const list = within(cards());
        expect(list.getAllByRole('listitem')).toHaveLength(3);
        expect(list.getByText('Principal')).toBeTruthy();
        expect(list.getAllByText('Activa')).toHaveLength(2);
        expect(list.getByText('Inactiva')).toBeTruthy();
        expect(list.getByText('Sin ciudad', { exact: false })).toBeTruthy();
        expect(screen.getByRole('table')).toBeTruthy();
    });

    it('filtra por nombre o ciudad y permite limpiar una búsqueda sin resultados', async () => {
        const { user, detectChanges } = await setup();

        await user.type(screen.getByRole('searchbox', { name: 'Buscar sede' }), 'salitre');
        detectChanges();
        expect(within(cards()).getAllByRole('listitem')).toHaveLength(1);

        await user.clear(screen.getByRole('searchbox', { name: 'Buscar sede' }));
        await user.type(screen.getByRole('searchbox', { name: 'Buscar sede' }), 'medellín');
        detectChanges();
        expect(screen.getByText('Ninguna sede coincide con la búsqueda.')).toBeTruthy();

        await user.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));
        detectChanges();
        expect(within(cards()).getAllByRole('listitem')).toHaveLength(3);
    });

    it('sin sedes muestra el estado vacío', async () => {
        await setup({ listVenues: () => Promise.resolve([]) });

        expect(screen.getByText('Aún no hay sedes.')).toBeTruthy();
    });

    it('ante un error muestra el mensaje y reintenta', async () => {
        const failing = vi.fn().mockRejectedValueOnce(new AppError('network')).mockResolvedValueOnce(VENUES);
        const { user, listVenues, fixture, detectChanges } = await setup({ listVenues: failing });

        expect(screen.getByText('No pudimos cargar las sedes', { exact: false })).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'Reintentar' }));
        await fixture.whenStable();
        detectChanges();

        expect(listVenues).toHaveBeenCalledTimes(2);
        expect(within(cards()).getAllByRole('listitem')).toHaveLength(3);
    });

    it('«Nueva sede» abre el formulario de maqueta con Guardar deshabilitado', async () => {
        const { user } = await setup();

        await user.click(screen.getByRole('button', { name: 'Nueva sede' }));

        const drawer = await screen.findByRole('dialog', { name: 'Nueva sede' });
        expect(within(drawer).getByLabelText('Nombre de la sede')).toBeTruthy();
        expect((within(drawer).getByRole('button', { name: 'Guardar' }) as HTMLButtonElement).disabled).toBe(true);
        expect(within(drawer).getByText('Disponible próximamente', { exact: false })).toBeTruthy();
    });

    it('al cerrar con cambios pide confirmación; sin cambios se cierra sin preguntar', async () => {
        const { user } = await setup();

        await user.click(screen.getByRole('button', { name: 'Nueva sede' }));
        let drawer = await screen.findByRole('dialog', { name: 'Nueva sede' });
        await user.click(within(drawer).getByRole('button', { name: 'Cancelar' }));
        expect(screen.queryByText('¿Descartar los cambios?')).toBeNull();

        await user.click(screen.getByRole('button', { name: 'Nueva sede' }));
        drawer = await screen.findByRole('dialog', { name: 'Nueva sede' });
        await user.type(within(drawer).getByLabelText('Nombre de la sede'), 'Cancha Norte');
        await user.click(within(drawer).getByRole('button', { name: 'Cancelar' }));

        expect(await screen.findByText('¿Descartar los cambios?')).toBeTruthy();
    });

    it('en el menú de cada sede, Desactivar y Eliminar están deshabilitados', async () => {
        const { user } = await setup();

        await user.click(within(cards()).getByRole('button', { name: 'Acciones de Polideportivo Suba' }));

        const menu = await screen.findByRole('menu');
        expect(within(menu).getByRole('menuitem', { name: /Editar/ }).getAttribute('aria-disabled')).not.toBe('true');
        expect(within(menu).getByRole('menuitem', { name: /Desactivar/ }).getAttribute('aria-disabled')).toBe('true');
        expect(within(menu).getByRole('menuitem', { name: /Eliminar/ }).getAttribute('aria-disabled')).toBe('true');
    });

    it('en el celular el formulario ocupa la pantalla completa', async () => {
        const { user } = await setup({ mobile: true });

        await user.click(screen.getByRole('button', { name: 'Nueva sede' }));

        const drawer = await screen.findByRole('dialog', { name: 'Nueva sede' });
        expect(drawer.className).toContain('p-drawer-full');
    });
});
