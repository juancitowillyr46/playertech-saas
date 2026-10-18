/**
 * Configuración de desarrollo contra Supabase local (spec 001).
 * La clave publicable es la que trae por defecto la Supabase CLI en local:
 * es pública por diseño y los datos los protege RLS.
 */
export const environment = {
    production: false,
    // Mismo host con el que se abrió la app: localhost en el PC o la IP de la red
    // local al probar desde el celular (Supabase local escucha en todas las interfaces).
    supabaseUrl: `http://${location.hostname}:54321`,
    supabasePublishableKey: 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
    // Cierre de sesión por inactividad (DEC-28). Se baja a 2 solo para validarlo desde el
    // celular (quickstart de la spec 005) y se regresa a 60.
    sessionInactivityMinutes: 60
};
