import { fitWithin } from './logo-image';

// El dibujo en canvas no existe en el entorno de pruebas: se valida en el quickstart 2.4.
describe('fitWithin', () => {
    it('reduce el lado mayor a 512 conservando la proporción', () => {
        expect(fitWithin(4000, 3000, 512)).toEqual({ width: 512, height: 384 });
        expect(fitWithin(1000, 2000, 512)).toEqual({ width: 256, height: 512 });
    });

    it('no agranda imágenes menores', () => {
        expect(fitWithin(200, 100, 512)).toEqual({ width: 200, height: 100 });
    });

    it('nunca devuelve un lado de cero', () => {
        expect(fitWithin(5000, 1, 512)).toEqual({ width: 512, height: 1 });
    });
});
