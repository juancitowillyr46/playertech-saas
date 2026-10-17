import { Component } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { PageHeader, PageHeaderAction } from './page-header';

@Component({
    imports: [PageHeader, PageHeaderAction],
    template: `
        <app-page-header title="Sedes" description="Lugares donde funciona tu academia">
            <button appPageHeaderAction type="button">Nueva sede</button>
        </app-page-header>
    `
})
class WithAction {}

describe('PageHeader', () => {
    it('muestra un único h1 con el título y la descripción', async () => {
        await render(PageHeader, { inputs: { title: 'Sedes', description: 'Lugares donde funciona tu academia' } });

        expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
        expect(screen.getByRole('heading', { level: 1, name: 'Sedes' })).toBeTruthy();
        expect(screen.getByText('Lugares donde funciona tu academia')).toBeTruthy();
    });

    it('sin descripción no renderiza el párrafo', async () => {
        const { container } = await render(PageHeader, { inputs: { title: 'Academia' } });

        expect(container.querySelector('p')).toBeNull();
    });

    it('proyecta la acción principal en su contenedor', async () => {
        const { container } = await render(WithAction);

        const action = screen.getByRole('button', { name: 'Nueva sede' });
        expect(container.querySelector('.page-header-action')?.contains(action)).toBe(true);
    });
});
