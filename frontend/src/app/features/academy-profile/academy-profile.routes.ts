import { CanDeactivateFn, Routes } from '@angular/router';
import { AcademyProfilePage } from './pages/academy-profile-page/academy-profile-page';

/** Al navegar dentro de la app con cambios sin guardar, la pantalla pide confirmación (FR-008). */
const confirmLeave: CanDeactivateFn<AcademyProfilePage> = (page) => page.canLeave();

/** Configuración > Academia: perfil de la academia (spec 007; HU-017). */
export default [{ path: '', title: 'Academia · PlayerTech', component: AcademyProfilePage, canDeactivate: [confirmLeave] }] satisfies Routes;
