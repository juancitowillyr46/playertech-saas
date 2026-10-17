import { MenuItem } from 'primeng/api';

/**
 * Sección del menú con las demos de SakaiNG, solo en desarrollo. Se añade con el
 * mismo condicional de compilación que `DEV_ROUTES`, para que tampoco llegue a
 * producción (research R13).
 */
export const DEV_NAVIGATION: MenuItem[] = [
    {
        label: 'Demos (desarrollo)',
        items: [
            { label: 'Dashboard de ejemplo', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/dev'] },
            { label: 'Componentes UI', icon: 'pi pi-fw pi-th-large', routerLink: ['/dev/uikit/formlayout'] },
            { label: 'Ejemplo de gestión', icon: 'pi pi-fw pi-table', routerLink: ['/dev/pages/crud'] },
            { label: 'Documentación de Sakai', icon: 'pi pi-fw pi-book', routerLink: ['/dev/documentation'] }
        ]
    }
];
