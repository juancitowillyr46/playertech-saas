import { LOGO_MAX_SELECTED_BYTES, validateLogoFile } from './logo-file';

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG = [0xff, 0xd8, 0xff, 0xe0];

function file(bytes: number[], type: string, name = 'logo', size?: number): File {
    const created = new File([new Uint8Array(bytes)], name, { type });

    return size === undefined ? created : Object.defineProperty(created, 'size', { value: size });
}

describe('validateLogoFile', () => {
    it.each([
        ['PNG', PNG, 'image/png'],
        ['JPEG', JPEG, 'image/jpeg']
    ])('acepta un %s válido', async (_label, bytes, type) => {
        await expect(validateLogoFile(file(bytes, type))).resolves.toBeNull();
    });

    it('rechaza un tipo distinto de JPG o PNG (CA-007)', async () => {
        await expect(validateLogoFile(file(PNG, 'image/gif'))).resolves.toBe('type');
    });

    it('rechaza un .png cuyo contenido no es una imagen PNG', async () => {
        await expect(validateLogoFile(file([0x68, 0x6f, 0x6c, 0x61], 'image/png', 'falso.png'))).resolves.toBe('type');
    });

    it('rechaza una imagen de más de 5 MB (CA-007)', async () => {
        await expect(validateLogoFile(file(JPEG, 'image/jpeg', 'grande.jpg', LOGO_MAX_SELECTED_BYTES + 1))).resolves.toBe('size');
    });

    it('acepta exactamente 5 MB', async () => {
        await expect(validateLogoFile(file(JPEG, 'image/jpeg', 'limite.jpg', LOGO_MAX_SELECTED_BYTES))).resolves.toBeNull();
    });
});
