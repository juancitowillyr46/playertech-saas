import { TestBed } from '@angular/core/testing';
import { AppError } from '../../errors/app-error';
import { LegalTextRepository } from '../data/legal-text.repository';
import { LegalDocument } from '../models/legal.models';
import { LegalDocumentService } from './legal-document.service';

const TERMS: LegalDocument = { type: 'terms', version: '2026-10-v2', url: '/legal/terms/2026-10-v2.html', publishedAt: '2026-10-25T05:00:00Z' };

function setup() {
    const repository = { getText: vi.fn() };
    TestBed.configureTestingModule({ providers: [{ provide: LegalTextRepository, useValue: repository }] });

    return { service: TestBed.inject(LegalDocumentService), repository };
}

describe('LegalDocumentService', () => {
    it('descarga cada versión una sola vez', async () => {
        const { service, repository } = setup();
        repository.getText.mockResolvedValue('<p>Texto</p>');

        expect(await service.text(TERMS)).toBe('<p>Texto</p>');
        expect(await service.text(TERMS)).toBe('<p>Texto</p>');
        expect(repository.getText).toHaveBeenCalledTimes(1);
    });

    it('si falla, lo intenta de nuevo la próxima vez', async () => {
        const { service, repository } = setup();
        repository.getText.mockRejectedValueOnce(new AppError('network')).mockResolvedValueOnce('<p>Texto</p>');

        await expect(service.text(TERMS)).rejects.toMatchObject({ code: 'network' });
        expect(await service.text(TERMS)).toBe('<p>Texto</p>');
    });
});
