import { BreakpointObserver } from '@angular/cdk/layout';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { AppError } from '../../../core/errors/app-error';
import { LegalDocument } from '../../../core/legal/models/legal.models';
import { LegalDocumentService } from '../../../core/legal/services/legal-document.service';
import { LegalDocumentDialog } from './legal-document-dialog';

const TERMS: LegalDocument = { type: 'terms', version: '2026-10-v2', url: '/legal/terms/2026-10-v2.html', publishedAt: '2026-10-25T05:00:00Z' };

async function setup(text: () => Promise<string>) {
    const closed = vi.fn();
    const result = await render(LegalDocumentDialog, {
        inputs: { document: TERMS },
        on: { closed },
        providers: [
            { provide: LegalDocumentService, useValue: { text: vi.fn(text) } },
            { provide: BreakpointObserver, useValue: { observe: () => of({ matches: true, breakpoints: {} }) } }
        ]
    });
    await result.fixture.whenStable();
    result.detectChanges();

    return { ...result, closed, user: userEvent.setup() };
}

describe('LegalDocumentDialog', () => {
    it('muestra el título, la versión con su fecha y el texto (CA-001 de HU-043)', async () => {
        await setup(() => Promise.resolve('<h1>Términos</h1><h2>1. Objeto</h2><p>PlayerTech es una plataforma.</p>'));

        expect(await screen.findByRole('dialog', { name: 'Términos y Condiciones' })).toBeTruthy();
        expect(screen.getByText('Versión 2026-10-v2 · publicada el 25 de octubre de 2026')).toBeTruthy();
        expect(screen.getByText('PlayerTech es una plataforma.')).toBeTruthy();
    });

    it('si no carga, avisa y ofrece abrirlo en otra pestaña (CA-004)', async () => {
        await setup(() => Promise.reject(new AppError('network')));

        expect(await screen.findByText(/No pudimos cargar el documento/)).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Abrir en otra pestaña' }).getAttribute('href')).toBe('/legal/terms/2026-10-v2.html');
    });

    it('«Cerrar» avisa que se cerró', async () => {
        const { user, closed } = await setup(() => Promise.resolve('<p>Texto</p>'));

        const buttons = await screen.findAllByRole('button', { name: 'Cerrar' });
        await user.click(buttons[buttons.length - 1]);
        expect(closed).toHaveBeenCalled();
    });
});
