import { Routes } from '@angular/router';
import { VenuesPage } from './venues-page/venues-page';

/** Configuración > Sedes. Lectura real y escritura de maqueta (spec 003); HU-029 a HU-031 la completan. */
export default [{ path: '', title: 'Sedes · PlayerTech', component: VenuesPage }] satisfies Routes;
