import { Routes } from '@angular/router';
import { PlayerPage } from './pages/player-page/player-page';
import { PlayersPage } from './pages/players-page/players-page';
import { PlayersShell } from './pages/players-shell/players-shell';

/**
 * Jugadores (spec 009, contracts/ui-contracts.md): pestañas Jugadores y Grupos, la ficha
 * del jugador y la página de cada grupo. `groups` va antes de `:id`.
 */
export default [
    {
        path: '',
        component: PlayersShell,
        children: [
            { path: '', title: 'Jugadores · PlayerTech', component: PlayersPage },
            { path: 'groups', title: 'Grupos · PlayerTech', loadComponent: () => import('../groups/pages/groups-page/groups-page').then((m) => m.GroupsPage) }
        ]
    },
    { path: 'groups/:id', title: 'Grupo · PlayerTech', loadComponent: () => import('../groups/pages/group-page/group-page').then((m) => m.GroupPage) },
    { path: ':id', title: 'Jugador · PlayerTech', component: PlayerPage }
] satisfies Routes;
