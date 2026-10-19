import { BreakpointObserver } from '@angular/cdk/layout';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { AppError } from '../../../../core/errors/app-error';
import { ExternalFieldRepository } from '../../data/external-field.repository';
import { FieldsPage } from './fields-page';

const FIELDS = [
    { id: 'f1', name: 'Cancha El Salitre', address: null, city: 'Bogotá', directions: null },
    { id: 'f2', name: 'Polideportivo', address: null, city: null, directions: null }
];

async function setup(overrides: Partial<Record<string, ReturnType<typeof vi.fn>>> = {}) {
    const repository = {
        list: vi.fn().mockResolvedValue(FIELDS),
        create: vi.fn().mockResolvedValue(FIELDS[0]),
        update: vi.fn().mockResolvedValue(undefined),
        retire: vi.fn().mockResolvedValue(undefined),
        ...overrides
    };
    const messages = { add: vi.fn() };
    const result = await render(FieldsPage, {
        providers: [
            { provide: ExternalFieldRepository, useValue: repository },
            { provide: MessageService, useValue: messages },
            { provide: BreakpointObserver, useValue: { observe: () => of({ matches: true, breakpoints: {} }) } }
        ]
    });
    await result.fixture.whenStable();
    result.detectChanges();

    return { ...result, repository, messages, user: userEvent.setup() };
}

async function chooseMenuItem(user: ReturnType<typeof userEvent.setup>, name: string) {
    const item = within(await screen.findByRole('menu')).getByRole('menuitem', { name });
    await user.click((item.querySelector('a, [data-pc-section="itemcontent"]') as HTMLElement | null) ?? item);
}

describe('FieldsPage', { timeout: 20_000 }, () => {
    it('lista las canchas con su ciudad (CA-003 de HU-037)', async () => {
        await setup();

        const list = screen.getByRole('list', { name: 'Canchas de la academia' });
        expect(within(list).getByText('Cancha El Salitre')).toBeTruthy();
        expect(within(list).getByText('Sin ciudad')).toBeTruthy();
    });

    it('nombre repetido se indica junto al campo (CA-002 de HU-037)', async () => {
        const { user, repository } = await setup();

        await user.click(screen.getByRole('button', { name: 'Nueva cancha' }));
        const dialog = await screen.findByRole('dialog', { name: 'Nueva cancha' });
        await user.type(within(dialog).getByLabelText('Nombre de la cancha'), ' cancha el salitre ');
        await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

        expect(within(dialog).getByText('Ya existe una cancha con ese nombre.')).toBeTruthy();
        expect(repository.create).not.toHaveBeenCalled();
    });

    it('retira con confirmación (CA-004 de HU-037)', async () => {
        const { user, repository } = await setup();

        await user.click(screen.getByRole('button', { name: 'Acciones de Polideportivo' }));
        await chooseMenuItem(user, 'Retirar');
        expect(await screen.findByText(/conservan/)).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'Retirar' }));

        expect(repository.retire).toHaveBeenCalledWith('f2');
    });

    it('sin canchas muestra el estado vacío; un error al cargar, el reintento', async () => {
        await setup({ list: vi.fn().mockResolvedValue([]) });
        expect(screen.getByText('Aún no hay canchas.')).toBeTruthy();
    });

    it('si la base de datos rechaza el nombre, lo marca en el campo', async () => {
        const { user } = await setup({ create: vi.fn().mockRejectedValue(new AppError('duplicate')) });

        await user.click(screen.getByRole('button', { name: 'Nueva cancha' }));
        const dialog = await screen.findByRole('dialog', { name: 'Nueva cancha' });
        await user.type(within(dialog).getByLabelText('Nombre de la cancha'), 'Cancha Otra');
        await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

        expect(await within(dialog).findByText('Ya existe una cancha con ese nombre.')).toBeTruthy();
    });
});
