import { render, screen } from '@testing-library/angular';
import { PlaceholderPage } from './placeholder-page';

describe('PlaceholderPage', () => {
    it('muestra el título de la pantalla y el aviso de disponibilidad', async () => {
        await render(PlaceholderPage, { inputs: { title: 'Sedes' } });

        expect(screen.getByRole('heading', { name: 'Sedes' })).toBeTruthy();
        expect(screen.getByText('Disponible pronto.')).toBeTruthy();
    });
});
