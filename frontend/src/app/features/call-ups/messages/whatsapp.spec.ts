import { callUpLink, copyText, shareText, whatsappChat } from './whatsapp';
describe('WhatsApp', () => {
    it('forma el enlace colombiano codificado', () => expect(whatsappChat('315 777 9876', 'Hola & adiós')).toBe('https://wa.me/573157779876?text=Hola%20%26%20adi%C3%B3s'));
    it('no duplica el prefijo colombiano', () => expect(whatsappChat('+57 3157779876', 'Hola')).toContain('wa.me/573157779876'));
    it('compone el enlace público', () => expect(callUpLink('abc')).toContain('/c/abc'));
    it('copia y comparte por fallback', async () => {
        Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
        Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true });
        const open = vi.spyOn(window, 'open').mockReturnValue(null);
        await copyText('x');
        await shareText('x');
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('x');
        expect(open).toHaveBeenCalled();
    });
});
