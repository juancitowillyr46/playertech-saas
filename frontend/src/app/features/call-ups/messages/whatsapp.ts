/**
 * PlayerTech prepara el mensaje y el owner lo envía desde WhatsApp (DEC-45): sin API ni
 * envío automático. Funciona también en sitios no seguros (`http` en la red local), donde
 * el navegador desactiva el portapapeles moderno y el menú de compartir.
 */

/** Celular o tableta: WhatsApp se abre con su esquema propio, sin pasar por la web. */
export function isMobileDevice(userAgent: string = navigator.userAgent): boolean {
    return /Android|iPhone|iPad|iPod/i.test(userAgent);
}

const colombianPhone = (phone: string) => `57${phone.replace(/\D/g, '').replace(/^57/, '')}`;

/**
 * Chat de WhatsApp de un celular colombiano con el texto listo. En el celular, la app
 * directamente (`whatsapp://`); en el computador, WhatsApp Web (`wa.me`).
 */
export function whatsappChat(phone: string, text: string, mobile: boolean = isMobileDevice()): string {
    return mobile ? `whatsapp://send?phone=${colombianPhone(phone)}&text=${encodeURIComponent(text)}` : `https://wa.me/${colombianPhone(phone)}?text=${encodeURIComponent(text)}`;
}

/**
 * Abre WhatsApp. Se llama directamente desde el toque del usuario, sin esperar antes nada,
 * para que el navegador no lo bloquee. El esquema de la app se abre en la misma pestaña (no
 * deja la página); el enlace web, en una pestaña nueva o, si se bloquea, en la misma.
 */
export function openWhatsapp(url: string): void {
    if (url.startsWith('whatsapp://')) {
        window.location.assign(url);
        return;
    }

    const opened = window.open(url, '_blank');

    if (opened) {
        opened.opener = null;
        return;
    }

    window.location.assign(url);
}

/** Copia el texto; devuelve si se pudo. Usa el portapapeles moderno y, si no existe o falla, el método clásico. */
export async function copyText(text: string): Promise<boolean> {
    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Se intenta con el método clásico.
        }
    }

    return copyWithSelection(text);
}

/** Copia seleccionando un texto oculto: funciona en sitios no seguros y en iPhone. */
function copyWithSelection(text: string): boolean {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    // Fuera de la vista, sin afectar la página (estilos del elemento, no de una plantilla).
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, text.length);

    try {
        return typeof document.execCommand === 'function' && document.execCommand('copy');
    } catch {
        return false;
    } finally {
        area.remove();
    }
}

export function callUpLink(token: string): string {
    return `${window.location.origin}/c/${token}`;
}
