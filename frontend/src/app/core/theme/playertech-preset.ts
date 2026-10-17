import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Preset de PlayerTech sobre Aura (ADR-015, FE-06): primario azul
 * (`blue.500` = rgb(59, 130, 246)). Es el primer sitio de estilos de AGENTS.md;
 * la identidad visual completa llega con T-01.
 *
 * Densidad: con la fuente base de 14 px, los rellenos amplían campos, botones y
 * entradas de menú hasta unos 44 px de alto, el área táctil mínima para el uso
 * desde el celular (principio XIII, FR-031).
 */
export const PlayerTechPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{blue.50}',
            100: '{blue.100}',
            200: '{blue.200}',
            300: '{blue.300}',
            400: '{blue.400}',
            500: '{blue.500}',
            600: '{blue.600}',
            700: '{blue.700}',
            800: '{blue.800}',
            900: '{blue.900}',
            950: '{blue.950}'
        },
        formField: {
            paddingY: '0.9rem'
        },
        navigation: {
            item: {
                padding: '1.1rem 0.75rem'
            }
        }
    },
    components: {
        checkbox: {
            root: {
                width: '1.5rem',
                height: '1.5rem'
            }
        }
    }
});
