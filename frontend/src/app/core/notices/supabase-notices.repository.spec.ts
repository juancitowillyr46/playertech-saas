import { TestBed } from '@angular/core/testing';
import { SUPABASE_CLIENT } from '../supabase/supabase-client';
import { pgError, supabaseClientMock } from '../../testing/supabase-client-mock';
import { badgeValue } from './notices.models';
import { SupabaseNoticesRepository } from './supabase-notices.repository';

function setup(data: unknown, error: unknown = null) {
    const mock = supabaseClientMock([{ data, error }]);
    TestBed.configureTestingModule({ providers: [SupabaseNoticesRepository, { provide: SUPABASE_CLIENT, useValue: mock.client }] });

    return { repository: TestBed.inject(SupabaseNoticesRepository), ...mock };
}

describe('SupabaseNoticesRepository', () => {
    it('cuenta los pendientes sin repetir un dispositivo que acompaña a dos jugadores', async () => {
        const { repository, from } = setup([
            { link_id: 'l1', device_id: 'd1' },
            { link_id: null, device_id: 'd1' },
            { link_id: null, device_id: 'd2' },
            { link_id: 'l3', device_id: null }
        ]);

        expect(await repository.pendingCount()).toBe(3);
        expect(from).toHaveBeenCalledWith('guardian_pending_reviews');
    });

    it('lee las respuestas nuevas ordenadas por fecha de la actividad', async () => {
        const { repository, args } = setup([{ call_up_id: 'c', activity_id: 'a', activity_type: 'competition', activity_opponent: 'Norte', activity_starts_at: 't', activity_status: 'cancelled', new_count: 5 }]);

        expect(await repository.newResponses()).toEqual([{ callUpId: 'c', activityId: 'a', activityType: 'competition', opponent: 'Norte', startsAt: 't', cancelled: true, newCount: 5 }]);
        expect(args('order')[0]).toEqual(['activity_starts_at']);
    });

    it('traduce los errores', async () => {
        const { repository } = setup(null, pgError('42501'));

        await expect(repository.pendingCount()).rejects.toMatchObject({ code: 'forbidden' });
    });

    it('el contador muestra «99+» a partir de 100', () => {
        expect(badgeValue(7)).toBe('7');
        expect(badgeValue(99)).toBe('99');
        expect(badgeValue(100)).toBe('99+');
    });
});
