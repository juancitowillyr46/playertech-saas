import { render, screen } from '@testing-library/angular';
import { PublicCallUpPage } from './public-call-up';
describe('PublicCallUpPage', () => {
    it('no consulta datos y anuncia la próxima respuesta', async () => {
        await render(PublicCallUpPage);
        expect(screen.getByRole('heading', { name: 'PlayerTech' })).toBeTruthy();
        expect(screen.getByText('Pronto podrás responder aquí.')).toBeTruthy();
    });
});
