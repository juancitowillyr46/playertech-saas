import { TestBed } from '@angular/core/testing';
import { AppError } from '../../../core/errors/app-error';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { supabaseClientMock } from '../../../testing/supabase-client-mock';
import { PublicCallUpError } from '../models/public-call-up.models';
import { SupabasePublicCallUpRepository } from './supabase-public-call-up.repository';

function setup(data: unknown, error: unknown = null) {
    const mock = supabaseClientMock([{ data, error }]);
    TestBed.configureTestingModule({ providers: [SupabasePublicCallUpRepository, { provide: SUPABASE_CLIENT, useValue: mock.client }] });

    return { repository: TestBed.inject(SupabasePublicCallUpRepository), ...mock };
}

describe('SupabasePublicCallUpRepository', () => {
    it('lee el enlace con las llaves del dispositivo y completa lo que falta en «not_found»', async () => {
        const { repository, rpc } = setup({ status: 'not_found' });

        const callUp = await repository.load('token', ['llave']);

        expect(rpc).toHaveBeenCalledWith('public_call_up', { p_token: 'token', p_device_keys: ['llave'] });
        expect(callUp).toEqual({ status: 'not_found', academy: '', activity: null, deadline: null, roster: [], mine: [], deviceKey: null });
    });

    it('se identifica y devuelve la llave del dispositivo', async () => {
        const { repository, rpc } = setup('nueva-llave');

        const key = await repository.identify('token', { playerId: 'p', fullName: 'Carlos', phone: '3001112233', relationship: 'father', consent: true }, null);

        expect(key).toBe('nueva-llave');
        expect(rpc).toHaveBeenCalledWith('public_identify', {
            p_token: 'token',
            p_player_id: 'p',
            p_full_name: 'Carlos',
            p_phone: '3001112233',
            p_relationship: 'father',
            p_consent: true,
            p_device_key: ''
        });
    });

    it('responde y devuelve los cambios restantes', async () => {
        const { repository } = setup({ answer: 'no', changesLeft: 2 });

        await expect(repository.respond('token', 'llave', 'p', { answer: 'no', reason: 'illness', reasonText: null })).resolves.toEqual({ answer: 'no', changesLeft: 2 });
    });

    it('traduce las reglas de la vía pública y deja el resto como error de aplicación', async () => {
        const limit = setup(null, { code: '23514', message: 'change_limit_reached' });
        await expect(limit.repository.respond('t', 'k', 'p', { answer: 'yes', reason: null, reasonText: null })).rejects.toEqual(new PublicCallUpError('change_limit_reached'));

        TestBed.resetTestingModule();
        const other = setup(null, { code: '42501', message: 'otro' });
        await expect(other.repository.respond('t', 'k', 'p', { answer: 'yes', reason: null, reasonText: null })).rejects.toBeInstanceOf(AppError);
    });
});
