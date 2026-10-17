import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BrandMarkSize = 'sm' | 'md' | 'lg';
export type BrandMarkTone = 'default' | 'inverse';

/** Lado del logo en cada tamaño: es cuadrado (DESIGN.md, «Logo»). */
const LOGO_SIZES: Readonly<Record<BrandMarkSize, string>> = {
    sm: 'size-7',
    md: 'size-8',
    lg: 'size-10'
};

const WORD_SIZES: Readonly<Record<BrandMarkSize, string>> = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
};

/** El logo usa el rojo de la marca; sobre fondos de tinta toma el color del texto. */
const LOGO_TONES: Readonly<Record<BrandMarkTone, string>> = {
    default: 'text-(--brand-seal)',
    inverse: 'text-current'
};

/**
 * Marca de PlayerTech (spec 003, FR-010; DESIGN.md): logo y nombre. Es el único
 * sitio donde vive el logo, para que el definitivo se cambie una sola vez y llegue
 * al topbar, al acceso y a cualquier otro uso.
 *
 * Espacio del logo: un SVG cuadrado (viewBox 0 0 40 40) que pinta con
 * `currentColor`, así funciona en claro, en oscuro y sobre la tinta. Mientras no
 * exista el logo definitivo, ocupa ese espacio el sello provisional «PT» de la
 * planilla. Para cambiarlo, se sustituye el contenido del `<svg>` respetando el
 * viewBox y `currentColor`.
 */
@Component({
    selector: 'app-brand-mark',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <span class="inline-flex items-center gap-2.5 leading-none">
            <svg [class]="logoClass()" viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false" data-brand-logo>
                <!-- Sello provisional «PT»: sustituir por el logo definitivo (DESIGN.md). -->
                <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="3" />
                <text x="20" y="25.5" text-anchor="middle" fill="currentColor" font-family="inherit" font-size="15" font-weight="800" letter-spacing="0.5">PT</text>
            </svg>
            <span class="font-extrabold tracking-tight" [class]="wordClass()">PlayerTech</span>
        </span>
    `
})
export class BrandMark {
    readonly size = input<BrandMarkSize>('md');
    readonly tone = input<BrandMarkTone>('default');

    protected readonly logoClass = computed(() => `shrink-0 ${LOGO_SIZES[this.size()]} ${LOGO_TONES[this.tone()]}`);
    protected readonly wordClass = computed(() => WORD_SIZES[this.size()]);
}
