import { DeviceKeyStore } from './device-key-store';

describe('DeviceKeyStore', () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => vi.restoreAllMocks());

    it('recuerda llaves sin duplicados, la más reciente primero y hasta 10', () => {
        const store = new DeviceKeyStore();

        for (let index = 0; index < 12; index++) {
            store.remember(`llave-${index}`);
        }
        store.remember('llave-5');

        expect(store.keys()).toHaveLength(10);
        expect(store.keys()[0]).toBe('llave-5');
        expect(store.keys().filter((key) => key === 'llave-5')).toHaveLength(1);
    });

    it('sin almacenamiento disponible devuelve una lista vacía y no falla', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('bloqueado');
        });
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('bloqueado');
        });
        const store = new DeviceKeyStore();

        expect(() => store.remember('llave')).not.toThrow();
        expect(store.keys()).toEqual([]);
    });

    it('ignora un contenido dañado', () => {
        localStorage.setItem('playertech.devices', '{no es json');

        expect(new DeviceKeyStore().keys()).toEqual([]);
    });
});
