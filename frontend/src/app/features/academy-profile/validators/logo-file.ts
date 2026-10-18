/** Problema de un archivo de logo, o `null` si es válido (HU-017 CA-007, DEC-22). */
export type LogoFileProblem = 'type' | 'size';

/** Tamaño máximo de la imagen que elige el owner; lo guardado se comprime por debajo de 1 MB. */
export const LOGO_MAX_SELECTED_BYTES = 5 * 1024 * 1024;

export const LOGO_FILE_MESSAGES: Readonly<Record<LogoFileProblem, string>> = {
    type: 'Usa una imagen JPG o PNG.',
    size: 'La imagen pesa más de 5 MB.'
};

const SIGNATURES: Readonly<Record<string, readonly number[]>> = {
    'image/png': [0x89, 0x50, 0x4e, 0x47],
    'image/jpeg': [0xff, 0xd8, 0xff]
};

/**
 * Comprueba el tipo declarado, el contenido real (primeros bytes) y el tamaño antes de
 * subir nada. El bucket repite la regla en el servidor (principio VIII).
 */
export async function validateLogoFile(file: File): Promise<LogoFileProblem | null> {
    const signature = SIGNATURES[file.type];

    if (!signature) {
        return 'type';
    }

    if (file.size > LOGO_MAX_SELECTED_BYTES) {
        return 'size';
    }

    const header = await readBytes(file.slice(0, signature.length));

    return signature.every((byte, index) => header[index] === byte) ? null : 'type';
}

/** Lee los bytes con FileReader, disponible en todos los navegadores y en el entorno de pruebas. */
function readBytes(blob: Blob): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(blob);
    });
}
