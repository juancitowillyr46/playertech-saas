import { render, screen } from '@testing-library/angular';
import { BrandMark } from './brand-mark';

describe('BrandMark', () => {
    it('muestra el nombre como texto y el logo como SVG decorativo', async () => {
        const { container } = await render(BrandMark);

        expect(screen.getByText('PlayerTech')).toBeTruthy();
        const logo = container.querySelector('svg[data-brand-logo]');
        expect(logo?.getAttribute('aria-hidden')).toBe('true');
        expect(logo?.getAttribute('viewBox')).toBe('0 0 40 40');
    });

    it('en tono inverso el logo toma el color del texto', async () => {
        const { container } = await render(BrandMark, { inputs: { tone: 'inverse', size: 'sm' } });

        expect(container.querySelector('svg[data-brand-logo]')?.classList.contains('text-current')).toBe(true);
    });
});
