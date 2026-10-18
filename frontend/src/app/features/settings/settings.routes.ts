import { Routes } from '@angular/router';

/** Configuración de la academia: perfil (spec 007) y sedes (spec 004), cada uno en su feature. */
export default [
    { path: 'academy', loadChildren: () => import('../academy-profile/academy-profile.routes') },
    { path: 'venues', loadChildren: () => import('../venues/venues.routes') },
    { path: '', pathMatch: 'full', redirectTo: 'academy' }
] satisfies Routes;
