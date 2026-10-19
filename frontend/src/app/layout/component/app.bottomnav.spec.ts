import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { Component } from '@angular/core';
import { AppBottomnav } from './app.bottomnav';

@Component({ template: '' })
class Empty {}

describe('AppBottomnav', () => {
    async function setup(url: string) {
        const result = await render(AppBottomnav, {
            providers: [
                provideRouter([
                    { path: 'home', component: Empty },
                    { path: 'settings/academy', component: Empty },
                    { path: 'settings/venues', component: Empty }
                ])
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
});
