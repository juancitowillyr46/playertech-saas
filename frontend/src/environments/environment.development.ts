/**
 * Configuración de desarrollo contra Supabase local (spec 001).
 * La clave publicable es la que trae por defecto la Supabase CLI en local:
 * es pública por diseño y los datos los protege RLS.
 */
export const environment = {
    production: false,
    supabaseUrl: 'http://127.0.0.1:54321',
    supabasePublishableKey: 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
};
