import { BreakpointObserver } from '@angular/cdk/layout';
import { provideRouter } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { AppError } from '../../../../core/errors/app-error';
import { PlayerRepository } from '../../data/player.repository';
import { PlayerSummary } from '../../models/player.models';
import { PlayersPage } from './players-page';

const player = (id: string, firstNames: string, lastNames: string, overrides: Partial<PlayerSummary> = {}): PlayerSummary => ({
    id,
    firstNames,
    lastNames,
    nickname: null,
    birthDate: '2014-05-10',
    phone: null,
    isActive: true,
    groups: [],
    guardianCount: 0,
    ...overrides
});

const SAMUEL = player('p1', 'Samuel', 'Vargas', { nickname: 'Samu', groups: [{ id: 'g1', name: 'Sub-12' }], guardianCount: 2 });
const MATEO = player('p2', 'Mateo', 'Ruiz', { guardianCount: 1 });
const OLD = player('p3', 'Andrés', 'Gómez', { isActive: false });

function repositoryMock(overrides: Partial<Record<keyof PlayerRepository, ReturnType<typeof vi.fn>>> = {}) {
    return {
        listPlayers: vi.fn().mockResolvedValue([SAMUEL, MATEO, OLD]),
        getPlayer: vi.fn().mockResolvedValue(OLD),
        listGroups: vi.fn().mockResolvedValue([{ id: 'g1', name: 'Sub-12' }]),
        findByIdentity: vi.fn().mockResolvedValue(null),
        createPlayer: vi.fn().mockResolvedValue('p9'),
        updatePlayer: vi.fn().mockResolvedValue(undefined),
        setActive: vi.fn().mockResolvedValue(undefined),
        deletePlayer: vi.fn().mockResolvedValue(undefined),
        ...overrides
    };
}

async function setup(repository = repositoryMock()) {
    const messages = { add: vi.fn() };
    const result = await render(PlayersPage, {
        providers: [
            provideRouter([]),
            { provide: PlayerRepository, useValue: repository },
            { provide: MessageService, useValue: messages },
            { provide: BreakpointObserver, useValue: { observe: () => of({ matches: true, breakpoints: {} }) } }
        ]
    });
    await result.fixture.whenStable();
    result.detectChanges();

    return { ...result, repository, messages, user: userEvent.setup() };
}

const list = () => screen.getByRole('list', { name: 'Jugadores de la academia' });

/** Abre el drawer y llena los obligatorios. */
async function fillForm(user: ReturnType<typeof userEvent.setup>, values: { first?: string; last?: string; date?: string; phone?: string } = {}) {
    await user.click(screen.getByRole('button', { name: 'Registrar jugador' }));
    const dialog = await screen.findByRole('dialog', { name: 'Registrar jugador' });
    await user.type(within(dialog).getByLabelText('Nombres'), values.first ?? 'Samuel');
    await user.type(within(dialog).getByLabelText('Apellidos'), values.last ?? 'Vargas');
    await user.type(within(dialog).getByLabelText('Fecha de nacimiento'), values.date ?? '10/05/2014');
    await user.keyboard('{Escape}');

    if (values.phone) {
        await user.type(within(dialog).getByLabelText(/Celular/), values.phone);
    }

    return dialog;
}

describe('PlayersPage', { timeout: 20_000 }, () => {
    it('lista los activos con nombre corto, apodo, edad, grupos y acudientes (CA-001 y CA-004 de HU-003)', async () => {
        await setup();

        const rows = within(list()).getAllByRole('link');
        expect(rows.map((row) => row.textContent?.replace(/\s+/g, ' ').trim())).toEqual([expect.stringContaining('Mateo R.'), expect.stringContaining('Samuel V. · Samu')]);
        expect(rows[1].textContent).toMatch(/\d+ años · Sub-12 · 2 acudientes/);
        expect(rows[0].getAttribute('href')).toBe('/p2');
        expect(screen.getByText('2 jugadores')).toBeTruthy();
    });

    it('busca sin tildes y vacía con «Limpiar búsqueda» (CA-002 de HU-003)', async () => {
        const { user } = await setup();

        await user.type(screen.getByRole('searchbox', { name: 'Buscar jugador' }), 'SAMU');
        expect(within(list()).getAllByRole('link')).toHaveLength(1);

        await user.clear(screen.getByRole('searchbox', { name: 'Buscar jugador' }));
        await user.type(screen.getByRole('searchbox', { name: 'Buscar jugador' }), 'zzz');
        expect(screen.getByText('Ningún jugador coincide con la búsqueda.')).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));
        expect(within(list()).getAllByRole('link')).toHaveLength(2);
    });

    it('sin jugadores muestra el estado vacío con la acción (CA-005 de HU-003)', async () => {
        await setup(repositoryMock({ listPlayers: vi.fn().mockResolvedValue([]) }));

        expect(screen.getByText('Aún no hay jugadores.')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Registrar jugador' })).toBeTruthy();
    });

    it('exige los obligatorios y valida el celular junto al campo (CA-002 y CA-007 de HU-002)', async () => {
        const { user, repository } = await setup();

        await user.click(screen.getByRole('button', { name: 'Registrar jugador' }));
        const dialog = await screen.findByRole('dialog', { name: 'Registrar jugador' });
        await user.type(within(dialog).getByLabelText(/Celular/), '2001234567');
        await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

        expect(within(dialog).getByText('Ingresa los nombres.')).toBeTruthy();
        expect(within(dialog).getByText('Ingresa los apellidos.')).toBeTruthy();
        expect(within(dialog).getByText('Ingresa la fecha de nacimiento.')).toBeTruthy();
        expect(within(dialog).getByText('Escribe un celular de 10 dígitos que empiece por 3.')).toBeTruthy();
        expect(within(dialog).getByLabelText('Nombres').getAttribute('aria-describedby')).toBe('playerFirstNames-error');
        expect(repository.createPlayer).not.toHaveBeenCalled();
    });

    it('registra con los opcionales y avisa (CA-001 y CA-004 de HU-002)', async () => {
        const { user, repository, messages } = await setup();

        const dialog = await fillForm(user, { phone: '300 123 4567' });
        await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

        expect(repository.createPlayer).toHaveBeenCalledWith(expect.objectContaining({ firstNames: 'Samuel', lastNames: 'Vargas', birthDate: '2014-05-10', phone: '3001234567', nickname: null }));
        expect(messages.add).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Jugador registrado.' }));
    });

    it('jugador ya registrado: avisa con sus datos y permite reactivarlo y actualizarlo (CA-006 de HU-002)', async () => {
        const repository = repositoryMock({ findByIdentity: vi.fn().mockResolvedValue('p3') });
        const { user, messages } = await setup(repository);

        const dialog = await fillForm(user, { first: 'Andres', last: 'Gomez' });
        await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

        expect(within(dialog).getByText('Este jugador ya está registrado')).toBeTruthy();
        expect(within(dialog).getByText(/Andrés Gómez · 10\/05\/2014/)).toBeTruthy();
        expect(repository.createPlayer).not.toHaveBeenCalled();

        await user.click(within(dialog).getByRole('button', { name: 'Reactivarlo y actualizar' }));

        expect(repository.updatePlayer).toHaveBeenCalledWith('p3', expect.objectContaining({ firstNames: 'Andres' }));
        expect(repository.setActive).toHaveBeenCalledWith('p3', true);
        expect(messages.add).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Jugador reactivado y actualizado.' }));
    });

    it('sin conexión conserva lo escrito y muestra el mensaje en español (FR-015)', async () => {
        const { user } = await setup(repositoryMock({ createPlayer: vi.fn().mockRejectedValue(new AppError('network')) }));

        const dialog = await fillForm(user);
        await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

        expect(within(dialog).getByText(new AppError('network').message)).toBeTruthy();
        expect((within(dialog).getByLabelText('Nombres') as HTMLInputElement).value).toBe('Samuel');
    });

    it('cerrar con cambios sin guardar pide confirmación (CA-005 de HU-033)', async () => {
        const { user } = await setup();

        await user.click(screen.getByRole('button', { name: 'Registrar jugador' }));
        const dialog = await screen.findByRole('dialog', { name: 'Registrar jugador' });
        await user.type(within(dialog).getByLabelText('Nombres'), 'Sam');
        await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

        expect(await screen.findByText('¿Descartar los cambios?')).toBeTruthy();
    });
});
