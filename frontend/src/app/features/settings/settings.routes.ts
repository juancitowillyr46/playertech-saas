import { Routes } from '@angular/router';
import { PlaceholderPage } from '../../shared/components/placeholder-page/placeholder-page';

/** Configuración de la academia. Perfil (HU-017) y sedes (HU-029 a HU-031) llegan con sus HU. */
export default [
    { path: 'academy', title: 'Academia · PlayerTech', component: PlaceholderPage, data: { title: 'Academia' } },
    { path: 'venues', title: 'Sedes · PlayerTech', component: PlaceholderPage, data: { title: 'Sedes' } },
    { path: '', pathMatch: 'full', redirectTo: 'academy' }
] satisfies Routes;
