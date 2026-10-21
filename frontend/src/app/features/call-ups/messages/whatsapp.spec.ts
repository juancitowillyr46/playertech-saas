import { callUpLink, copyText, isMobileDevice, openWhatsapp, whatsappChat } from './whatsapp';

describe('WhatsApp', () => {
    afterEach(() => vi.restoreAllMocks());

    it('forma el enlace del chat con el celular colombiano y el texto codificado', () => {
        expect(whatsappChat('315 777 9876', 'Hola & adiós', false)).toBe('https://wa.me/573157779876?text=Hola%20%26%20adi%C3%B3s');
        expect(whatsappChat('+57 3157779876', 'Hola', false)).toContain('wa.me/573157779876');
    });

    it('en el celular usa el esquema de la app; en el computador, WhatsApp Web', () => {
        expect(isMobileDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe(true);
        expect(isMobileDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(false);
        expect(whatsappChat('3157779876', 'Hola\nResponde aquí', true)).toBe('whatsapp://send?phone=573157779876&text=Hola%0AResponde%20aqu%C3%AD');
    });

    it('compone el enlace público de la lista', () => {
        expect(callUpLink('abc')).toBe(`${window.location.origin}/c/abc`);
    });

    it('el esquema de la app se abre en la misma pestaña', () => {
        const open = vi.spyOn(window, 'open');
        const assign = vi.fn();
        vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, assign } as Location);

        openWhatsapp('whatsapp://send?phone=573157779876&text=Hola');

        expect(assign).toHaveBeenCalledWith('whatsapp://send?phone=573157779876&text=Hola');
        expect(open).not.toHaveBeenCalled();
    });

    it('WhatsApp Web se abre en una pestaña nueva o, si se bloquea, en la misma', () => {
        const open = vi.spyOn(window, 'open').mockReturnValue(null);
        const assign = vi.fn();
        vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, assign } as Location);

        openWhatsapp('https://wa.me/573157779876?text=Hola');

        expect(open).toHaveBeenCalledWith('https://wa.me/573157779876?text=Hola', '_blank');
        expect(assign).toHaveBeenCalledWith('https://wa.me/573157779876?text=Hola');
    });

    it('copia con el portapapeles moderno cuando existe', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

        expect(await copyText('x')).toBe(true);
        expect(writeText).toHaveBeenCalledWith('x');
    });

    it('sin portapapeles moderno (sitio no seguro) copia con el método clásico', async () => {
        Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
        const execCommand = vi.fn().mockReturnValue(true);
        Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });

        expect(await copyText('x')).toBe(true);
        expect(execCommand).toHaveBeenCalledWith('copy');
    });
});
