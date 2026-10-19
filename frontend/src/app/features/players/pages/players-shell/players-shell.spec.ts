import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { screen } from '@testing-library/angular';
import { PlayersShell } from './players-shell';

@Component({ template: 'contenido' })
class Stub {}

async function navigate(url: string) {
    const { TestBed } = await import('@angular/core/testing');
    TestBed.configureTestingModule({
        providers: [
            provideRouter([
                {
                    path: 'players',
                    component: PlayersShell,
                    children: [
                        { path: '', component: Stub },
                        { path: 'groups', component: Stub }
                    ]
                }
            ])
        ]
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    harness.detectChanges();
}

describe('PlayersShell', () => {
    // p-tablist observa su tamaño; jsdom no trae ResizeObserver.
    beforeAll(() => {
        globalThis.ResizeObserver ??= vi.fn(function () {
            return { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
        }) as unknown as typeof ResizeObserver;
    });

    it.each([
        ['/players', 'Jugadores'],
        ['/players/groups', 'Grupos']
    ])('en %s la pestaña activa es «%s»', async (url, active) => {
        await navigate(url);

        const tabs = screen.getAllByRole('tab');
        expect(tabs.map((tab) => tab.textContent?.trim())).toEqual(['Jugadores', 'Grupos']);
        expect(screen.getByRole('tab', { name: active }).getAttribute('aria-selected')).toBe('true');
    });
});
