import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { LegalDocumentsRepository } from '../../../../core/legal/data/legal-documents.repository';
import { LegalTextRepository } from '../../../../core/legal/data/legal-text.repository';
import { DeviceKeyStore } from '../../data/device-key-store';
import { PublicCallUpRepository } from '../../data/public-call-up.repository';
import { MyPlayer, PublicCallUp, PublicCallUpError } from '../../models/public-call-up.models';
import { CallUpResponsePage } from './call-up-response';

const ACTIVITY: PublicCallUp['activity'] = {
    type: 'competition',
    startsAt: '2030-10-26T14:00:00.000Z',
    endsAt: null,
    callAt: '2030-10-26T13:15:00.000Z',
    place: { name: 'Cancha A', address: 'Calle 63', city: 'Medellín', directions: 'Puerta 4' },
    opponent: 'Club Norte',
    tournament: 'Liga',
    notes: 'Uniforme rojo'
};
const SAMUEL: MyPlayer = { playerId: 'p1', name: 'Samuel V.', nickname: 'Samu', removed: false, answer: null, reason: null, reasonText: null, changesLeft: 3 };
const callUp = (overrides: Partial<PublicCallUp> = {}): PublicCallUp => ({
    status: 'open',
    academy: 'Academia C',
    activity: ACTIVITY,
    deadline: '2030-10-25T01:00:00.000Z',
    roster: [
        { playerId: 'p1', name: 'Samuel V.', nickname: 'Samu' },
        { playerId: 'p2', name: 'Mateo R.', nickname: null }
    ],
    mine: [],
    deviceKey: null,
    ...overrides
});

async function setup(loads: PublicCallUp[], keys: string[] = []) {
    const repository = {
        load: vi.fn(),
        identify: vi.fn().mockResolvedValue('llave-nueva'),
        respond: vi.fn().mockResolvedValue({ answer: 'yes', changesLeft: 3 })
    };
    loads.forEach((value) => repository.load.mockResolvedValueOnce(value));
    repository.load.mockResolvedValue(loads[loads.length - 1]);
    const store = { keys: vi.fn(() => keys), remember: vi.fn() };
    const user = userEvent.setup();

    await render(CallUpResponsePage, {
        inputs: { token: 'token' },
        providers: [
            { provide: PublicCallUpRepository, useValue: repository },
            { provide: DeviceKeyStore, useValue: store },
            {
                provide: LegalDocumentsRepository,
                useValue: { getCurrent: vi.fn().mockResolvedValue({ privacyPolicy: { type: 'privacy_policy', version: '2026-10-v2', url: '/legal/privacy_policy/2026-10-v2.html', publishedAt: '2026-10-25T05:00:00Z' } }) }
            },
            { provide: LegalTextRepository, useValue: { getText: vi.fn().mockResolvedValue('<p>Texto de la política</p>') } }
        ]
    });

    return { repository, store, user };
}

describe('CallUpResponsePage', { timeout: 20_000 }, () => {
    beforeAll(() => {
        // El desplegable de PrimeNG consulta matchMedia, que el entorno de pruebas no trae.
        window.matchMedia ??= vi.fn(function () {
            return { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() };
        }) as unknown as typeof window.matchMedia;
    });

    it('muestra la academia, la actividad y los convocados sin celulares (CA-001 de HU-009)', async () => {
        await setup([callUp()]);

        expect(await screen.findByRole('heading', { name: 'Partido contra Club Norte' })).toBeTruthy();
        expect(screen.getByText('Academia C')).toBeTruthy();
        expect(screen.getByText(/llegar 8:15 a\. m\. · inicia 9:00 a\. m\./)).toBeTruthy();
        expect(screen.getByText('Cancha A, Calle 63, Medellín')).toBeTruthy();
        const list = screen.getByRole('list', { name: 'Convocados' });
        expect(
            within(list)
                .getAllByRole('button')
                .map((button) => button.textContent?.trim())
        ).toEqual(['Samuel V. · Samu', 'Mateo R.']);
        expect(screen.getByText('¿No ves a tu jugador? Escríbele a la academia.')).toBeTruthy();
    });

    it('se identifica con nombre, celular, parentesco y autorización, y pasa a responder (CA-002 de HU-009)', async () => {
        const { repository, store, user } = await setup([callUp(), callUp({ mine: [SAMUEL], deviceKey: 'llave-nueva' })]);

        await user.click(await screen.findByRole('button', { name: 'Samuel V. · Samu' }));
        expect(screen.getByText('Samuel V. · Samu')).toBeTruthy();

        await user.click(screen.getByRole('button', { name: 'Continuar' }));
        expect(screen.getByRole('alert').textContent).toContain('Elige tu parentesco.');

        await user.click(screen.getByLabelText('Papá'));
        await user.type(screen.getByLabelText('¿Cómo te llamas?'), 'Carlos');
        await user.type(screen.getByLabelText('Tu celular'), '300 111 2233');
        await user.click(screen.getByRole('button', { name: 'Continuar' }));
        expect(screen.getByRole('alert').textContent).toContain('autorizar');

        // Leer la política sin sesión no marca la casilla (CA-001 y CA-002 de HU-043).
        await user.click(screen.getByRole('button', { name: 'Política de Tratamiento de Datos' }));
        expect(await screen.findByText('Texto de la política')).toBeTruthy();
        const close = screen.getAllByRole('button', { name: 'Cerrar' });
        await user.click(close[close.length - 1]);
        expect((screen.getByLabelText(/Autorizo el tratamiento/) as HTMLInputElement).checked).toBe(false);

        await user.click(screen.getByLabelText(/Autorizo el tratamiento/));
        await user.click(screen.getByRole('button', { name: 'Continuar' }));

        expect(repository.identify).toHaveBeenCalledWith('token', { playerId: 'p1', fullName: 'Carlos', phone: '3001112233', relationship: 'father', consent: true }, null);
        expect(store.remember).toHaveBeenCalledWith('llave-nueva');
        expect(await screen.findByRole('group', { name: 'Respuesta para Samuel V. · Samu' })).toBeTruthy();
    });

    it('con «Soy el jugador» no pide el nombre', async () => {
        const { repository, user } = await setup([callUp(), callUp({ mine: [SAMUEL], deviceKey: 'llave-nueva' })]);

        await user.click(await screen.findByRole('button', { name: 'Mateo R.' }));
        await user.click(screen.getByLabelText('Soy el jugador'));
        expect(screen.queryByLabelText('¿Cómo te llamas?')).toBeNull();
        await user.type(screen.getByLabelText('Tu celular'), '3001112233');
        await user.click(screen.getByLabelText(/Autorizo el tratamiento/));
        await user.click(screen.getByRole('button', { name: 'Continuar' }));

        expect(repository.identify).toHaveBeenCalledWith('token', expect.objectContaining({ playerId: 'p2', fullName: null, relationship: 'self' }), null);
    });

    it('«Sí» se registra al tocarlo y confirma con los cambios restantes (CA-001 de HU-010)', async () => {
        const { repository, user } = await setup([callUp({ mine: [SAMUEL], deviceKey: 'k' })], ['k']);

        await user.click(await screen.findByRole('button', { name: 'Sí' }));

        expect(repository.respond).toHaveBeenCalledWith('token', 'k', 'p1', { answer: 'yes', reason: null, reasonText: null });
        expect((await screen.findByRole('status')).textContent).toContain('¡Listo! Respondiste: Sí');
        expect(screen.getByText('Te quedan 3 cambios.')).toBeTruthy();
    });

    it('«No» abre el motivo, «Otro» exige el texto y se envía (CA-002 de HU-010)', async () => {
        const { repository, user } = await setup([callUp({ mine: [SAMUEL], deviceKey: 'k' })], ['k']);
        repository.respond.mockResolvedValueOnce({ answer: 'no', changesLeft: 2 });

        await user.click(await screen.findByRole('button', { name: 'No' }));
        const send = screen.getByRole('button', { name: 'Enviar respuesta' });
        await user.click(screen.getByRole('combobox', { name: /Motivo|Elige un motivo/ }));
        await user.click(await screen.findByRole('option', { name: 'Otro' }));
        expect(send.hasAttribute('disabled') || send.querySelector('button')?.disabled).toBeTruthy();
        await user.type(screen.getByLabelText('Cuéntanos'), 'Cumpleaños');
        await user.click(screen.getByRole('button', { name: 'Enviar respuesta' }));

        expect(repository.respond).toHaveBeenCalledWith('token', 'k', 'p1', { answer: 'no', reason: 'other', reasonText: 'Cumpleaños' });
        expect(await screen.findByText('Motivo: Cumpleaños')).toBeTruthy();
    });

    it('sin cambios disponibles explica a quién acudir (CA-003 de HU-010)', async () => {
        const { repository } = await setup([callUp({ mine: [{ ...SAMUEL, answer: 'no', changesLeft: 0 }], deviceKey: 'k' })], ['k']);

        expect(await screen.findByText('Escríbele a la academia para cambiarla.')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Cambiar respuesta' })).toBeNull();
        expect(repository.respond).not.toHaveBeenCalled();
    });

    it('muestra el error del límite sin perder la tarjeta', async () => {
        const { repository, user } = await setup([callUp({ mine: [{ ...SAMUEL, answer: 'no', changesLeft: 1 }], deviceKey: 'k' })], ['k']);
        repository.respond.mockRejectedValueOnce(new PublicCallUpError('change_limit_reached'));

        await user.click(await screen.findByRole('button', { name: 'Cambiar respuesta' }));
        await user.click(screen.getByRole('button', { name: 'Sí' }));

        expect(await screen.findByText(/Ya cambiaste esta respuesta 3 veces/)).toBeTruthy();
    });

    it('el dispositivo recordado responde por sus hermanos y ve a quien ya no está convocado (CA-003 y CA-006 de HU-009)', async () => {
        const tomas: MyPlayer = { ...SAMUEL, playerId: 'p3', name: 'Tomás V.', nickname: null };
        const mateo: MyPlayer = { ...SAMUEL, playerId: 'p4', name: 'Mateo V.', nickname: null, removed: true, answer: 'yes' };
        const { user } = await setup([callUp({ mine: [SAMUEL, tomas, mateo], deviceKey: 'k' })], ['k']);

        expect(await screen.findByText('Responde por tus jugadores:')).toBeTruthy();
        expect(screen.getByRole('group', { name: 'Respuesta para Samuel V. · Samu' })).toBeTruthy();
        expect(screen.getByRole('group', { name: 'Respuesta para Tomás V.' })).toBeTruthy();
        expect(screen.getByText('Ya no está convocado.')).toBeTruthy();

        await user.click(screen.getByRole('button', { name: '¿Respondes por alguien más?' }));
        expect(screen.getByRole('heading', { name: '¿Por quién respondes?' })).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'Mateo R.' }));
        expect(screen.getByText('Ya te conocemos: solo indica tu parentesco con este jugador.')).toBeTruthy();
        expect(screen.queryByLabelText('Tu celular')).toBeNull();
    });

    it('cerrada o cancelada se ve en solo lectura con las respuestas propias (CA-005 de HU-009)', async () => {
        await setup([callUp({ status: 'cancelled', roster: [], mine: [{ ...SAMUEL, answer: 'maybe', reason: 'schedule' }], deviceKey: 'k' })], ['k']);

        expect(await screen.findByText('Se canceló la actividad.')).toBeTruthy();
        expect(screen.getByRole('heading', { name: 'Tus respuestas' })).toBeTruthy();
        expect(screen.getByText('Motivo: Horario (colegio o trabajo)')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Cambiar respuesta' })).toBeNull();
        expect(screen.queryByRole('list', { name: 'Convocados' })).toBeNull();
    });

    it('un enlace inexistente no muestra ningún dato (CA-005 de HU-009)', async () => {
        await setup([{ status: 'not_found', academy: '', activity: null, deadline: null, roster: [], mine: [], deviceKey: null }]);

        expect(await screen.findByRole('heading', { name: 'Esta convocatoria ya no está disponible' })).toBeTruthy();
        expect(screen.getByText('PlayerTech')).toBeTruthy();
        expect(screen.queryByRole('list')).toBeNull();
    });

    it('un dispositivo reconocido sin jugadores en esta lista (otro hijo) solo indica el parentesco (CA-003 de HU-009)', async () => {
        const { repository, user } = await setup([callUp({ mine: [], deviceKey: 'k' }), callUp({ mine: [{ ...SAMUEL, playerId: 'p2', name: 'Mateo R.', nickname: null }], deviceKey: 'k' })], ['k']);

        await user.click(await screen.findByRole('button', { name: 'Mateo R.' }));
        expect(screen.getByText('Ya te conocemos: solo indica tu parentesco con este jugador.')).toBeTruthy();
        expect(screen.queryByLabelText('¿Cómo te llamas?')).toBeNull();
        expect(screen.queryByLabelText('Tu celular')).toBeNull();
        expect(screen.queryByRole('button', { name: 'Volver a mis jugadores' })).toBeNull();

        await user.click(screen.getByLabelText('Papá'));
        await user.click(screen.getByRole('button', { name: 'Continuar' }));

        expect(repository.identify).toHaveBeenCalledWith('token', { playerId: 'p2', fullName: null, phone: null, relationship: 'father', consent: true }, 'k');
        expect(await screen.findByRole('group', { name: 'Respuesta para Mateo R.' })).toBeTruthy();
    });
});
