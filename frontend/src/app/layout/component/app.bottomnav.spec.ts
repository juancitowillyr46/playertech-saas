import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { Component, signal } from '@angular/core';
import { NoticesService } from '@/app/core/notices/notices.service';
import { AppBottomnav } from './app.bottomnav';

@Component({ template: '' })
class Empty {}

describe('AppBottomnav', () => {
    async function setup(url: string, pendingCount = 0) {
        const result = await render(AppBottomnav, {
            providers: [
                provideRouter([
                    { path: 'home', component: Empty },
                    { path: 'settings/academy', component: Empty },
                    { path: 'settings/venues', component: Empty }
                ]),
                { provide: NoticesService, useValue: { pendingCount: signal(pendingCount) } }
            ]
        });
        await result.navigate(url);

        return result;
    }

    it('muestra los destinos principales en una navegación etiquetada', async () => {
        await setup('/home');

        const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
        expect(nav).toBeTruthy();
        expect(screen.getAllByRole('link').map((link) => link.textContent?.trim())).toEqual(['Inicio', 'Jugadores', 'Actividades', 'Academia', 'Sedes']);
    });

    it('marca la sección actual con aria-current', async () => {
        await setup('/settings/venues');

        expect(screen.getByRole('link', { name: 'Sedes' }).getAttribute('aria-current')).toBe('page');
        expect(screen.getByRole('link', { name: 'Inicio' }).getAttribute('aria-current')).toBeNull();
    });

    it('con pendientes, «Inicio» lleva el contador y lo anuncia (CA-001 de HU-041)', async () => {
        await setup('/home', 3);

        const home = screen.getByRole('link', { name: 'Inicio, 3 acudientes por validar' });
        expect(home.textContent).toContain('3');
        expect(screen.getByRole('link', { name: 'Jugadores' }).textContent?.trim()).toBe('Jugadores');
    });

    it('a partir de 100 muestra «99+»', async () => {
        await setup('/home', 120);

        expect(screen.getByRole('link', { name: 'Inicio, 120 acudientes por validar' }).textContent).toContain('99+');
    });

    it('sin pendientes no muestra contador', async () => {
        await setup('/home', 0);

        expect(screen.getByRole('link', { name: 'Inicio' }).textContent?.trim()).toBe('Inicio');
    });
});
