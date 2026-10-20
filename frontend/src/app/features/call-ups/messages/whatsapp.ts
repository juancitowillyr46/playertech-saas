/** PlayerTech prepara el mensaje: el owner confirma el envío en WhatsApp. */
export function whatsappChat(phone: string, text: string): string {
    return `https://wa.me/57${phone.replace(/\D/g, '').replace(/^57/, '')}?text=${encodeURIComponent(text)}`;
}
export async function shareText(text: string): Promise<void> {
    if (typeof navigator.share === 'function') {
        await navigator.share({ text });
        return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}
export function copyText(text: string): Promise<void> {
    return navigator.clipboard.writeText(text);
}
export function callUpLink(token: string): string {
    return `${window.location.origin}/c/${token}`;
}
