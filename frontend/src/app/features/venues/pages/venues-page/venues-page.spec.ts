import { BreakpointObserver } from '@angular/cdk/layout';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { AppError } from '../../../../core/errors/app-error';
import { VenueRepository } from '../../data/venue.repository';
import { Venue } from '../../models/venue.models';
import { VenuesPage } from './venues-page';

const PRIMARY: Venue = { id: 'v1', name: 'Sede Administrativa Chapinero', type: 'office', city: 'Bogotá', address: 'Calle 1', directions: 'Piso 2', isPrimary: true, isActive: true };
const ACTIVE: Venue = { id: 'v2', name: 'Cancha Sintética El Salitre', type: 'training_ground', city: 'Bogotá', address: null, directions: null, isPrimary: false, isActive: true };
const INACTIVE: Venue = { id: 'v3', name: 'Polideportivo Suba', type: 'training_ground', city: null, address: null, directions: null, isPrimary: false, isActive: false };
const VENUES = [PRIMARY, ACTIVE, INACTIVE];

function repositoryMock(overrides: Partial<Record<keyof VenueRepository, ReturnType<typeof vi.fn>>> = {}) {
    return {
        listVenues: vi.fn().mockResolvedValue(VENUES),
        createVenue: vi.fn().mockResolvedValue(ACTIVE),
        updateVenue: vi.fn().mockResolvedValue(ACTIVE),
        setActive: vi.fn().mockResolvedValue(ACTIVE),
        deleteVenue: vi.fn().mockResolvedValue(undefined),
        setPrimary: vi.fn().mockResolvedValue(undefined),
        ...overrides
    };
}

async function setup(options: { repository?: ReturnType<typeof repositoryMock>; mobile?: boolean } = {}) {
    const repository = options.repository ?? repositoryMock();
    const messages = { add: vi.fn() };
    const result = await render(VenuesPage, {
        providers: [
            { provide: VenueRepository, useValue: repository },
            { provide: MessageService, useValue: messages },
            { provide: BreakpointObserver, useValue: { observe: () => of({ matches: options.mobile ?? false, breakpoints: {} }) } }
        ]
    });
    await result.fixture.whenStable();
    result.detectChanges();

    const settle = async () => {
        await result.fixture.whenStable();
        result.detectChanges();
    };

    return { ...result, repository, messages, settle, user: userEvent.setup() };
}

/** La lista de filas (celular); la tabla repite los datos para escritorio. */
function cards() {
    return screen.getByRole('list', { name: 'Sedes de la academia' });
}

async function openMenu(user: ReturnType<typeof userEvent.setup>, venue: Venue) {
    await user.click(within(cards()).getByRole('button', { name: `Acciones de ${venue.name}` }));

    return screen.findByRole('menu');
}

/** Clic sobre el contenido de la opción, como lo haría una persona (PrimeNG escucha ahí). */
async function chooseMenuItem(user: ReturnType<typeof userEvent.setup>, menu: HTMLElement, name: string | RegExp) {
    const item = within(menu).getByRole('menuitem', { name });
    await user.click((item.querySelector('a, [data-pc-section="itemcontent"]') as HTMLElement | null) ?? item);
}

function toasts(messages: { add: ReturnType<typeof vi.fn> }): string[] {
    return messages.add.mock.calls.map(([message]) => message.summary as string);
}

// Las pruebas de interacción abren el drawer, escriben y confirman: con toda la suite en
// paralelo pueden rozar el límite de 5 s de Vitest, así que tienen un margen propio.
describe('VenuesPage', { timeout: 15_000 }, () => {
    describe('consulta (US6, HU-030)', () => {
        it('muestra el encabezado con la acción principal', async () => {
            await setup();

            expect(screen.getByRole('heading', { level: 1, name: 'Sedes' })).toBeTruthy();
            expect(screen.getByRole('button', { name: 'Nueva sede' })).toBeTruthy();
        });

        it('lista las sedes con la principal identificada y las inactivas marcadas (CA-001 a CA-003)', async () => {
            await setup();

            const list = within(cards());
            expect(list.getAllByRole('listitem')).toHaveLength(3);
            expect(list.getByText('Principal')).toBeTruthy();
            expect(list.getAllByText('Activa')).toHaveLength(2);
            expect(list.getByText('Inactiva')).toBeTruthy();
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
            await setup({ repository: repositoryMock({ listVenues: vi.fn().mockResolvedValue([]) }) });

            expect(screen.getByText('Aún no hay sedes.')).toBeTruthy();
        });

        it('ante un error muestra el mensaje y reintenta', async () => {
            const listVenues = vi.fn().mockRejectedValueOnce(new AppError('network')).mockResolvedValue(VENUES);
            const { user, repository, settle } = await setup({ repository: repositoryMock({ listVenues }) });

            expect(screen.getByText('No pudimos cargar las sedes', { exact: false })).toBeTruthy();
            await user.click(screen.getByRole('button', { name: 'Reintentar' }));
            await settle();

            expect(repository.listVenues).toHaveBeenCalledTimes(2);
            expect(within(cards()).getAllByRole('listitem')).toHaveLength(3);
        });
    });

    describe('registrar (US1, HU-029)', () => {
        it('crea la sede con el tipo por defecto, cierra el formulario y avisa (CA-001, CA-002)', async () => {
            const { user, repository, messages, settle } = await setup();

            await user.click(screen.getByRole('button', { name: 'Nueva sede' }));
            const drawer = await screen.findByRole('dialog', { name: 'Nueva sede' });
            await user.type(within(drawer).getByLabelText('Nombre de la sede'), 'Cancha Norte');
            await user.click(within(drawer).getByRole('button', { name: 'Guardar' }));
            await settle();

            expect(repository.createVenue).toHaveBeenCalledWith({ name: 'Cancha Norte', type: 'training_ground', address: null, city: null, directions: null });
            expect(toasts(messages)).toContain('Sede creada.');
            expect(screen.queryByRole('dialog', { name: 'Nueva sede' })).toBeNull();
        });

        it('con el nombre vacío o solo espacios indica que es obligatorio y no crea nada (CA-003)', async () => {
            const { user, repository } = await setup();

            await user.click(screen.getByRole('button', { name: 'Nueva sede' }));
            const drawer = await screen.findByRole('dialog', { name: 'Nueva sede' });
            await user.type(within(drawer).getByLabelText('Nombre de la sede'), '   ');
            await user.click(within(drawer).getByRole('button', { name: 'Guardar' }));

            expect(within(drawer).getByText('Ingresa el nombre de la sede.')).toBeTruthy();
            expect(within(drawer).getByLabelText('Nombre de la sede').getAttribute('aria-invalid')).toBe('true');
            expect(repository.createVenue).not.toHaveBeenCalled();
        });

        it('con el nombre de una sede existente, con otras mayúsculas, indica que está en uso (CA-004)', async () => {
            const { user, repository } = await setup();

            await user.click(screen.getByRole('button', { name: 'Nueva sede' }));
            const drawer = await screen.findByRole('dialog', { name: 'Nueva sede' });
            await user.type(within(drawer).getByLabelText('Nombre de la sede'), 'polideportivo suba');
            await user.click(within(drawer).getByRole('button', { name: 'Guardar' }));

            expect(within(drawer).getByText('Ya existe una sede con ese nombre.')).toBeTruthy();
            expect(repository.createVenue).not.toHaveBeenCalled();
        });

        it('un duplicado que solo detecta el servidor se muestra junto al campo', async () => {
            const { user, settle } = await setup({ repository: repositoryMock({ createVenue: vi.fn().mockRejectedValue(new AppError('duplicate')) }) });

            await user.click(screen.getByRole('button', { name: 'Nueva sede' }));
            const drawer = await screen.findByRole('dialog', { name: 'Nueva sede' });
            await user.type(within(drawer).getByLabelText('Nombre de la sede'), 'Cancha Norte');
            await user.click(within(drawer).getByRole('button', { name: 'Guardar' }));
            await settle();

            expect(within(drawer).getByText('Ya existe una sede con ese nombre.')).toBeTruthy();
        });

        it('sin conexión muestra el error en el formulario y conserva lo escrito', async () => {
            const { user, settle } = await setup({ repository: repositoryMock({ createVenue: vi.fn().mockRejectedValue(new AppError('network')) }) });

            await user.click(screen.getByRole('button', { name: 'Nueva sede' }));
            const drawer = await screen.findByRole('dialog', { name: 'Nueva sede' });
            await user.type(within(drawer).getByLabelText('Nombre de la sede'), 'Cancha Norte');
            await user.click(within(drawer).getByRole('button', { name: 'Guardar' }));
            await settle();

            expect(within(drawer).getByText('No pudimos conectarnos', { exact: false })).toBeTruthy();
            expect((within(drawer).getByLabelText('Nombre de la sede') as HTMLInputElement).value).toBe('Cancha Norte');
        });

        it('un doble clic en Guardar crea una sola vez', async () => {
            const { user, repository, settle } = await setup();

            await user.click(screen.getByRole('button', { name: 'Nueva sede' }));
            const drawer = await screen.findByRole('dialog', { name: 'Nueva sede' });
            await user.type(within(drawer).getByLabelText('Nombre de la sede'), 'Cancha Norte');
            await user.dblClick(within(drawer).getByRole('button', { name: 'Guardar' }));
            await settle();

            expect(repository.createVenue).toHaveBeenCalledTimes(1);
        });

        it('al cerrar con cambios pide confirmación; sin cambios se cierra sin preguntar (FR-007)', async () => {
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

        it('en el celular el formulario ocupa la pantalla completa', async () => {
            const { user } = await setup({ mobile: true });

            await user.click(screen.getByRole('button', { name: 'Nueva sede' }));

            const drawer = await screen.findByRole('dialog', { name: 'Nueva sede' });
            expect(drawer.className).toContain('p-drawer-full');
        });
    });

    describe('editar (US2, HU-031 CA-001)', () => {
        it('abre el formulario con todos los datos actuales y guarda los cambios', async () => {
            const { user, repository, messages, settle } = await setup();

            const menu = await openMenu(user, PRIMARY);
            await chooseMenuItem(user, menu, /Editar/);
            const drawer = await screen.findByRole('dialog', { name: 'Editar sede' });

            expect((within(drawer).getByLabelText('Nombre de la sede') as HTMLInputElement).value).toBe(PRIMARY.name);
            expect((within(drawer).getByLabelText(/Dirección/) as HTMLInputElement).value).toBe('Calle 1');
            expect((within(drawer).getByLabelText(/Indicaciones/) as HTMLTextAreaElement).value).toBe('Piso 2');

            await user.clear(within(drawer).getByLabelText(/Ciudad/));
            await user.type(within(drawer).getByLabelText(/Ciudad/), 'Medellín');
            await user.click(within(drawer).getByRole('button', { name: 'Guardar' }));
            await settle();

            expect(repository.updateVenue).toHaveBeenCalledWith('v1', { name: PRIMARY.name, type: 'office', address: 'Calle 1', city: 'Medellín', directions: 'Piso 2' });
            expect(toasts(messages)).toContain('Cambios guardados.');
        });

        it('conservar el propio nombre no es duplicado; el de otra sede sí', async () => {
            const { user, repository, settle } = await setup();

            const menu = await openMenu(user, ACTIVE);
            await chooseMenuItem(user, menu, /Editar/);
            const drawer = await screen.findByRole('dialog', { name: 'Editar sede' });
            await user.click(within(drawer).getByRole('button', { name: 'Guardar' }));
            await settle();
            expect(repository.updateVenue).toHaveBeenCalledTimes(1);

            const menuAgain = await openMenu(user, ACTIVE);
            await chooseMenuItem(user, menuAgain, /Editar/);
            const drawerAgain = await screen.findByRole('dialog', { name: 'Editar sede' });
            await user.clear(within(drawerAgain).getByLabelText('Nombre de la sede'));
            await user.type(within(drawerAgain).getByLabelText('Nombre de la sede'), 'POLIDEPORTIVO SUBA');
            await user.click(within(drawerAgain).getByRole('button', { name: 'Guardar' }));

            expect(within(drawerAgain).getByText('Ya existe una sede con ese nombre.')).toBeTruthy();
            expect(repository.updateVenue).toHaveBeenCalledTimes(1);
        });

        it('si la sede ya no existe, avisa y actualiza el listado', async () => {
            const { user, repository, settle } = await setup({ repository: repositoryMock({ updateVenue: vi.fn().mockRejectedValue(new AppError('not_found')) }) });

            const menu = await openMenu(user, ACTIVE);
            await chooseMenuItem(user, menu, /Editar/);
            const drawer = await screen.findByRole('dialog', { name: 'Editar sede' });
            await user.click(within(drawer).getByRole('button', { name: 'Guardar' }));
            await settle();

            expect(within(drawer).getByText('El registro ya no existe o cambió', { exact: false })).toBeTruthy();
            expect(repository.listVenues).toHaveBeenCalledTimes(2);
        });
    });

    describe('sede principal (US3, HU-031 CA-006 y CA-007)', () => {
        it('marca como principal una sede activa y avisa', async () => {
            const { user, repository, messages, settle } = await setup();

            const menu = await openMenu(user, ACTIVE);
            await chooseMenuItem(user, menu, 'Marcar como principal');
            await settle();

            expect(repository.setPrimary).toHaveBeenCalledWith('v2');
            expect(toasts(messages)).toContain(`«${ACTIVE.name}» es ahora la sede principal.`);
        });

        it('en la principal la acción aparece deshabilitada con su motivo', async () => {
            const { user } = await setup();

            const menu = await openMenu(user, PRIMARY);

            expect(within(menu).getByRole('menuitem', { name: /Marcar como principal \(ya es la principal\)/ }).getAttribute('aria-disabled')).toBe('true');
        });

        it('en una sede inactiva la acción aparece deshabilitada: hay que reactivarla primero', async () => {
            const { user } = await setup();

            const menu = await openMenu(user, INACTIVE);

            expect(within(menu).getByRole('menuitem', { name: /Marcar como principal \(reactívala primero\)/ }).getAttribute('aria-disabled')).toBe('true');
        });

        it('un error de la regla muestra su mensaje específico', async () => {
            const { user, messages, settle } = await setup({ repository: repositoryMock({ setPrimary: vi.fn().mockRejectedValue(new AppError('rule_violation')) }) });

            const menu = await openMenu(user, ACTIVE);
            await chooseMenuItem(user, menu, 'Marcar como principal');
            await settle();

            expect(messages.add.mock.calls.map(([message]) => message.detail)).toContain('Solo una sede activa puede ser la principal. Reactívala primero.');
        });
    });

    describe('desactivar y reactivar (US4, HU-031 CA-002, CA-003 y CA-005)', () => {
        it('desactiva sin confirmación una sede activa no principal y avisa', async () => {
            const { user, repository, messages, settle } = await setup();

            const menu = await openMenu(user, ACTIVE);
            await chooseMenuItem(user, menu, 'Desactivar');
            await settle();

            expect(repository.setActive).toHaveBeenCalledWith('v2', false);
            expect(toasts(messages)).toContain('Sede desactivada.');
        });

        it('reactiva una sede inactiva y avisa', async () => {
            const { user, repository, messages, settle } = await setup();

            const menu = await openMenu(user, INACTIVE);
            await chooseMenuItem(user, menu, 'Reactivar');
            await settle();

            expect(repository.setActive).toHaveBeenCalledWith('v3', true);
            expect(toasts(messages)).toContain('Sede reactivada.');
        });

        it('en la principal, Desactivar aparece deshabilitada con su motivo', async () => {
            const { user } = await setup();

            const menu = await openMenu(user, PRIMARY);

            expect(within(menu).getByRole('menuitem', { name: /Desactivar \(marca otra como principal\)/ }).getAttribute('aria-disabled')).toBe('true');
        });
    });

    describe('eliminar (US5, HU-031 CA-004 y CA-005)', () => {
        it('pide confirmación nombrando la sede; al cancelar no cambia nada', async () => {
            const { user, repository } = await setup();

            const menu = await openMenu(user, INACTIVE);
            await chooseMenuItem(user, menu, 'Eliminar');

            expect(await screen.findByText(`¿Eliminar «${INACTIVE.name}»?`)).toBeTruthy();
            expect(screen.getByText('Dejará de aparecer en PlayerTech', { exact: false })).toBeTruthy();
            await user.click(screen.getByRole('button', { name: 'Cancelar' }));

            expect(repository.deleteVenue).not.toHaveBeenCalled();
        });

        it('al confirmar elimina la sede y avisa', async () => {
            const { user, repository, messages, settle } = await setup();

            const menu = await openMenu(user, INACTIVE);
            await chooseMenuItem(user, menu, 'Eliminar');
            await screen.findByText(`¿Eliminar «${INACTIVE.name}»?`);
            await user.click(screen.getByRole('button', { name: 'Eliminar' }));
            await settle();

            expect(repository.deleteVenue).toHaveBeenCalledWith('v3');
            expect(toasts(messages)).toContain('Sede eliminada.');
        });

        it('en la principal, Eliminar aparece deshabilitada con su motivo', async () => {
            const { user } = await setup();

            const menu = await openMenu(user, PRIMARY);

            expect(within(menu).getByRole('menuitem', { name: /Eliminar \(marca otra como principal\)/ }).getAttribute('aria-disabled')).toBe('true');
        });
    });
});
