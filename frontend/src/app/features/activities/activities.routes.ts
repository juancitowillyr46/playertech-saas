import { Routes } from '@angular/router';
import { ActivitiesPage } from './pages/activities-page/activities-page';
import { ActivitiesShell } from './pages/activities-shell/activities-shell';
import { ActivityPage } from './pages/activity-page/activity-page';
import { FieldsPage } from './pages/fields-page/fields-page';

/** Actividades (spec 011, contracts/ui-contracts.md): pestañas Actividades y Canchas, y el detalle. `:id` va al final. */
export default [
    {
        path: '',
        component: ActivitiesShell,
        children: [
            { path: '', title: 'Actividades · PlayerTech', component: ActivitiesPage },
            { path: 'fields', title: 'Canchas · PlayerTech', component: FieldsPage }
        ]
    },
    { path: ':id', title: 'Actividad · PlayerTech', component: ActivityPage }
] satisfies Routes;
