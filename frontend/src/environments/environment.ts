/**
 * Configuración de producción. Solo valores públicos (ADR-015, FE-03).
 * La conexión se completa al crear el proyecto de Supabase en la nube (ADR-016);
 * mientras esté vacía, la aplicación no arranca (FR-007).
 */
export const environment = {
    production: true,
    supabaseUrl: '',
    supabasePublishableKey: ''
};
