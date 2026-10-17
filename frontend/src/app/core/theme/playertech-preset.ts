import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Preset de PlayerTech sobre Aura (ADR-015, FE-06): primario azul
 * (`blue.500` = rgb(59, 130, 246)). Es el primer sitio de estilos de AGENTS.md;
 * la identidad visual completa llega con T-01.
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
        }
    }
});
