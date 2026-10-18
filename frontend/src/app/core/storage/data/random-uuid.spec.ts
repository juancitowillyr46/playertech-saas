import { randomUuid } from './random-uuid';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('randomUuid', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('usa crypto.randomUUID cuando existe', () => {
        expect(randomUuid()).toMatch(UUID_V4);
    });

    it('sin contexto seguro (sin crypto.randomUUID) genera un UUID v4 con getRandomValues', () => {
        const getRandomValues = crypto.getRandomValues.bind(crypto);
        vi.stubGlobal('crypto', { getRandomValues });

        const ids = new Set(Array.from({ length: 20 }, () => randomUuid()));

        expect([...ids].every((id) => UUID_V4.test(id))).toBe(true);
        expect(ids.size).toBe(20);
    });
});
