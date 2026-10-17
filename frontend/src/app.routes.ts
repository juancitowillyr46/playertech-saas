import { Routes } from '@angular/router';
import { authGuard } from './app/core/auth/guards/auth.guard';
import { membershipGuard } from './app/core/auth/guards/membership.guard';
import { DEV_ROUTES } from './app/features/dev/dev-extras';
import { AppLayout } from './app/layout/component/app.layout';

/**
 * Rutas de PlayerTech (docs/architecture/frontend.md, contracts/routes.md).
 * Los guards mejoran la experiencia; la protección de los datos es RLS.
 */
export const appRoutes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'home' },
    { path: 'auth', loadChildren: () => import('./app/features/auth/auth.routes') },
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard, membershipGuard],
        children: [
            { path: 'home', loadChildren: () => import('./app/features/home/home.routes') },
            { path: 'settings', loadChildren: () => import('./app/features/settings/settings.routes') }
        ]
    },
    {
        path: 'error',
        title: 'Error · PlayerTech',
        canActivate: [authGuard],
        loadComponent: () => import('./app/features/errors/context-error/context-error').then((m) => m.ContextErrorPage)
    },
    // Demos de SakaiNG solo en desarrollo: en producción DEV_ROUTES está vacío (dev-extras, FR-024).
    ...DEV_ROUTES,
    {
        path: '**',
        title: 'Página no encontrada · PlayerTech',
        loadComponent: () => import('./app/features/errors/not-found/not-found').then((m) => m.NotFoundPage)
    }
];
