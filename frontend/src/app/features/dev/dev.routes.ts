import { Routes } from '@angular/router';
import { AppLayout } from '../../layout/component/app.layout';

/**
 * Demos de SakaiNG como catálogo de referencia, solo en desarrollo (ADR-015, FE-02).
 * Aquí no vive ninguna funcionalidad de PlayerTech (FR-037). Se incluyen en
 * `app.routes.ts` con `environment.production ? [] : DEV_ROUTES`, de modo que la
 * compilación de producción las elimina (research R13).
 */
export const DEV_ROUTES: Routes = [
    {
        path: 'dev',
        component: AppLayout,
        children: [
            { path: '', title: 'Demos · PlayerTech', loadComponent: () => import('../../pages/dashboard/dashboard').then((m) => m.Dashboard) },
            { path: 'uikit', loadChildren: () => import('../../pages/uikit/uikit.routes') },
            { path: 'pages', loadChildren: () => import('../../pages/pages.routes') },
            { path: 'documentation', loadComponent: () => import('../../pages/documentation/documentation').then((m) => m.Documentation) }
        ]
    },
    { path: 'dev/landing', loadComponent: () => import('../../pages/landing/landing').then((m) => m.Landing) }
];
