import { FetchLegalTextRepository } from './fetch-legal-text.repository';

const PAGE = '<!doctype html><html><head><style>body{}</style></head><body><main><h1>Términos</h1><p>Texto</p></main></body></html>';

describe('FetchLegalTextRepository', () => {
    afterEach(() => vi.restoreAllMocks());

    it('devuelve solo el contenido de <main>', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(PAGE, { status: 200 }));

        expect(await new FetchLegalTextRepository().getText('/legal/terms/2026-10-v2.html')).toBe('<h1>Términos</h1><p>Texto</p>');
        expect(fetchSpy).toHaveBeenCalledWith('/legal/terms/2026-10-v2.html');
    });

    it('sin conexión o si el archivo no existe, falla como error de red', async () => {
        vi.spyOn(globalThis, 'fetch')
            .mockRejectedValueOnce(new TypeError('Failed to fetch'))
            .mockResolvedValueOnce(new Response('', { status: 404 }));
        const repository = new FetchLegalTextRepository();

        await expect(repository.getText('/x')).rejects.toMatchObject({ code: 'network' });
        await expect(repository.getText('/x')).rejects.toMatchObject({ code: 'network' });
    });
});
