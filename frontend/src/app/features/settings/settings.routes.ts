import { Routes } from '@angular/router';
import { PlaceholderPage } from '../../shared/components/placeholder-page/placeholder-page';

/** Configuración de la academia. Perfil (HU-017) llega con su HU; sedes vive en su propia feature. */
export default [
    { path: 'academy', title: 'Academia · PlayerTech', component: PlaceholderPage, data: { title: 'Academia' } },
    { path: 'venues', loadChildren: () => import('../venues/venues.routes') },
    { path: '', pathMatch: 'full', redirectTo: 'academy' }
] satisfies Routes;
