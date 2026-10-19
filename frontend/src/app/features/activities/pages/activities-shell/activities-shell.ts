import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouteTab, RouteTabs } from '../../../../shared/components/route-tabs/route-tabs';

/** Actividades › pestañas Actividades y Canchas (opción A aprobada, spec 011). */
@Component({
    selector: 'app-activities-shell',
    imports: [RouteTabs],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<app-route-tabs [tabs]="tabs" />`
})
export class ActivitiesShell {
    protected readonly tabs: readonly RouteTab[] = [
        { label: 'Actividades', route: '/activities' },
        { label: 'Canchas', route: '/activities/fields' }
    ];
}
