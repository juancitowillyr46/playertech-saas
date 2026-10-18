import { InjectionToken } from '@angular/core';
import { AppError } from '../../../core/errors/app-error';

/** Lado mayor del logo guardado: se muestra como mucho a unos 100 px (research R5b). */
const MAX_SIDE = 512;
/** Lo guardado nunca supera el límite del bucket `public-assets` (DEC-22). */
const MAX_STORED_BYTES = 1024 * 1024;
const INITIAL_QUALITY = 0.85;
const MAX_ATTEMPTS = 4;

/** Preparación del logo antes de subirlo; se inyecta para poder sustituirla en las pruebas. */
export const PREPARE_LOGO_IMAGE = new InjectionToken<(file: File) => Promise<File>>('PREPARE_LOGO_IMAGE', {
    providedIn: 'root',
    factory: () => prepareLogoImage
});

/** Dimensiones que caben en `maxSide` conservando la proporción, sin agrandar. */
export function fitWithin(width: number, height: number, maxSide: number): { width: number; height: number } {
    const scale = Math.min(1, maxSide / Math.max(width, height));

    return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/**
 * Redimensiona y comprime el logo en el navegador, en el mismo formato (el PNG conserva la
 * transparencia). Si el resultado aún supera 1 MB, reintenta con menos calidad y menos lado.
 */
export async function prepareLogoImage(file: File): Promise<File> {
    const url = URL.createObjectURL(file);

    try {
        const image = await loadImage(url);
        let side = MAX_SIDE;
        let quality = INITIAL_QUALITY;

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const blob = await draw(image, fitWithin(image.naturalWidth, image.naturalHeight, side), file.type, quality);

            if (blob.size <= MAX_STORED_BYTES) {
                return new File([blob], file.name, { type: file.type });
            }

            side = Math.round(side * 0.75);
            quality -= 0.15;
        }

        throw new AppError('unknown', { cause: new Error('El logo no se pudo comprimir por debajo de 1 MB') });
    } finally {
        URL.revokeObjectURL(url);
    }
}

/**
 * Decodifica con un `<img>`: es lo más compatible (Safari de iOS falla con `createImageBitmap`
 * en fotos grandes de la cámara) y respeta la orientación EXIF de la foto.
 */
function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = () => reject(new AppError('unknown', { cause: new Error('No se pudo leer la imagen del logo') }));
        image.src = url;
    });
}

async function draw(image: HTMLImageElement, size: { width: number; height: number }, type: string, quality: number): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
        throw new AppError('unknown', { cause: new Error('Canvas 2D no disponible') });
    }

    canvas.width = size.width;
    canvas.height = size.height;
    context.drawImage(image, 0, 0, size.width, size.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

    if (!blob) {
        throw new AppError('unknown', { cause: new Error('No se pudo generar la imagen del logo') });
    }

    return blob;
}
