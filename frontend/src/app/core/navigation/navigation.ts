import { MenuItem } from 'primeng/api';

/**
 * Menú lateral de PlayerTech (docs/architecture/ui.md, arquitectura de información).
 * La cuenta personal vive en el menú de usuario de la barra superior, no aquí.
 * Las demos de desarrollo se añaden aparte y solo fuera de producción (research R13).
 */
export const APP_NAVIGATION: MenuItem[] = [
    {
        label: 'General',
        items: [
            { label: 'Inicio', icon: 'pi pi-fw pi-home', routerLink: ['/home'] },
            // Jugadores agrupa las pestañas Jugadores y Grupos (spec 009, opción B de navegación).
            { label: 'Jugadores', icon: 'pi pi-fw pi-users', routerLink: ['/players'] }
        ]
    },
    {
        label: 'Configuración',
        items: [
            { label: 'Academia', icon: 'pi pi-fw pi-building', routerLink: ['/settings/academy'] },
            { label: 'Sedes', icon: 'pi pi-fw pi-map-marker', routerLink: ['/settings/venues'] }
        ]
    }
];
