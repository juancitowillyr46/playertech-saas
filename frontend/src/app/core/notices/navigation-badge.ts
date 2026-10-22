import { MenuItem } from 'primeng/api';
import { badgeValue } from './notices.models';

/** Destino que lleva el contador: el Inicio, donde está el aviso que abre «Por validar» (DEC-47, ajuste del 2026-10-22). */
const NOTICES_ROUTE = '/home';

export interface NavigationBadge {
    readonly value: string;
    /** «Inicio, 3 acudientes por validar». */
    readonly label: string;
}

/** Contador de un destino: solo «Inicio» y solo con pendientes (CA-001 de HU-041). */
export function navigationBadge(item: MenuItem, pendingCount: number): NavigationBadge | null {
    const route = Array.isArray(item.routerLink) ? item.routerLink[0] : item.routerLink;

    if (route !== NOTICES_ROUTE || pendingCount <= 0) {
        return null;
    }

    const noun = pendingCount === 1 ? 'acudiente por validar' : 'acudientes por validar';

    return { value: badgeValue(pendingCount), label: `${item.label}, ${pendingCount} ${noun}` };
}
