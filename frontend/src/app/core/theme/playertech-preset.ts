import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Preset de PlayerTech sobre Aura: dirección visual «Planilla» (T-01, spec 003),
 * la planilla oficial de juego. Papel claro con filetes cálidos, tinta azul para
 * las acciones y estados sellados. El sistema completo está en DESIGN.md.
 *
 * Es el primer sitio de estilos de AGENTS.md. Todos los pares texto/fondo
 * cumplen WCAG AA en ambos modos (contracts/ui-contracts.md).
 *
 * Densidad: con la fuente base de 16 px, los rellenos dan controles de unos
 * 44 px de alto, el área táctil mínima para el uso con una mano (principio XIII).
 */
export const PlayerTechPreset = definePreset(Aura, {
    primitive: {
        // Tinta azul de planilla. tinta.800 es el color de marca.
        tinta: {
            50: '#f3f6fb',
            100: '#e3e9f4',
            200: '#c6d3e9',
            300: '#9db4da',
            400: '#6f8ec4',
            500: '#4a6ca8',
            600: '#34528a',
            700: '#263f6e',
            800: '#1c2b4a',
            900: '#141f36',
            950: '#0c1424'
        },
        // Papel: neutros cálidos del modo claro.
        papel: {
            0: '#ffffff',
            50: '#fbfaf7',
            100: '#f4f2ec',
            200: '#ddd9cf',
            300: '#c7c2b6',
            400: '#a29d92',
            500: '#7c786f',
            600: '#5e5b54',
            700: '#45433e',
            800: '#2f2e2b',
            900: '#20242b',
            950: '#14161a'
        },
        // Pizarra: neutros fríos del modo oscuro.
        pizarra: {
            0: '#ffffff',
            50: '#f1f2f4',
            100: '#e2e4e9',
            200: '#c9cdd5',
            300: '#a9afbb',
            400: '#7d8492',
            500: '#5c6475',
            600: '#404a5e',
            700: '#2c3445',
            800: '#222a3a',
            900: '#171d29',
            950: '#10141d'
        },
        // Radios casi rectos: el papel no se redondea.
        borderRadius: {
            none: '0',
            xs: '1px',
            sm: '2px',
            md: '2px',
            lg: '3px',
            xl: '4px'
        }
    },
    semantic: {
        transitionDuration: '0.15s',
        primary: {
            50: '{tinta.50}',
            100: '{tinta.100}',
            200: '{tinta.200}',
            300: '{tinta.300}',
            400: '{tinta.400}',
            500: '{tinta.500}',
            600: '{tinta.600}',
            700: '{tinta.700}',
            800: '{tinta.800}',
            900: '{tinta.900}',
            950: '{tinta.950}'
        },
        // Foco visible en ambos modos: anillo de 2 px separado del control.
        focusRing: {
            width: '2px',
            style: 'solid',
            color: '{primary.color}',
            offset: '2px',
            shadow: 'none'
        },
        formField: {
            paddingX: '0.875rem',
            paddingY: '0.75rem'
        },
        // Entradas de menú de unos 44 px de alto (menú de usuario y de cada fila).
        navigation: {
            item: {
                padding: '0.875rem 1rem'
            }
        },
        colorScheme: {
            light: {
                surface: {
                    0: '{papel.0}',
                    50: '{papel.50}',
                    100: '{papel.100}',
                    200: '{papel.200}',
                    300: '{papel.300}',
                    400: '{papel.400}',
                    500: '{papel.500}',
                    600: '{papel.600}',
                    700: '{papel.700}',
                    800: '{papel.800}',
                    900: '{papel.900}',
                    950: '{papel.950}'
                },
                primary: {
                    color: '{tinta.800}',
                    contrastColor: '#ffffff',
                    hoverColor: '{tinta.900}',
                    activeColor: '{tinta.950}'
                },
                highlight: {
                    background: '{tinta.50}',
                    focusBackground: '{tinta.100}',
                    color: '{tinta.800}',
                    focusColor: '{tinta.900}'
                },
                text: {
                    color: '{papel.900}',
                    hoverColor: '{papel.950}',
                    // #5a606b: 6,06:1 sobre el papel.
                    mutedColor: '#5a606b',
                    hoverMutedColor: '{papel.900}'
                },
                // Borde de campo #8b8f98: 3,24:1 sobre blanco (WCAG 1.4.11).
                formField: {
                    borderColor: '#8b8f98',
                    hoverBorderColor: '{papel.900}',
                    focusBorderColor: '{primary.color}'
                }
            },
            dark: {
                surface: {
                    0: '{pizarra.0}',
                    50: '{pizarra.50}',
                    100: '{pizarra.100}',
                    200: '{pizarra.200}',
                    300: '{pizarra.300}',
                    400: '{pizarra.400}',
                    500: '{pizarra.500}',
                    600: '{pizarra.600}',
                    700: '{pizarra.700}',
                    800: '{pizarra.800}',
                    900: '{pizarra.900}',
                    950: '{pizarra.950}'
                },
                // Tinta clara sobre pizarra: 8,02:1 sobre las tarjetas.
                primary: {
                    color: '{tinta.300}',
                    contrastColor: '{tinta.950}',
                    hoverColor: '{tinta.200}',
                    activeColor: '{tinta.100}'
                },
                text: {
                    color: '#eceae4',
                    hoverColor: '#ffffff',
                    mutedColor: '{pizarra.300}',
                    hoverMutedColor: '#eceae4'
                },
                // Borde de campo #6b7385: 3,87:1 sobre el fondo del campo.
                formField: {
                    borderColor: '#6b7385',
                    hoverBorderColor: '{pizarra.300}',
                    focusBorderColor: '{primary.color}'
                }
            }
        }
    },
    components: {
        button: {
            root: {
                paddingX: '1.125rem',
                paddingY: '0.75rem',
                // Botones solo con icono (acciones de fila, cerrar): 44 px.
                iconOnlyWidth: '2.75rem',
                label: {
                    fontWeight: '600'
                }
            }
        },
        select: {
            dropdown: {
                width: '2.75rem'
            }
        },
        checkbox: {
            root: {
                width: '1.75rem',
                height: '1.75rem'
            }
        },
        // Estados como sellos: sin relleno; el borde lo pone la plantilla (DESIGN.md).
        tag: {
            root: {
                fontSize: '0.6875rem',
                fontWeight: '700',
                padding: '0.125rem 0.5rem'
            },
            colorScheme: {
                light: {
                    success: { background: 'transparent', color: '{tinta.800}' },
                    secondary: { background: 'transparent', color: '#6b7079' },
                    contrast: { background: 'transparent', color: '{papel.900}' }
                },
                dark: {
                    success: { background: 'transparent', color: '{tinta.300}' },
                    secondary: { background: 'transparent', color: '#8a91a0' },
                    contrast: { background: 'transparent', color: '#eceae4' }
                }
            }
        },
        datatable: {
            headerCell: {
                padding: '0.75rem 1rem'
            },
            bodyCell: {
                padding: '0.75rem 1rem'
            }
        }
    }
});
