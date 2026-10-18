// Genera src/environments/environment.ts desde las variables de entorno de Vercel
// (spec 008, research R2). La configuración de cada entorno vive fuera del código
// (docs/architecture/supabase-environments.md); el archivo del repositorio queda vacío.
// Uso en Vercel: npm run build:vercel. En local, restaurar después con git checkout.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const TARGET = 'src/environments/environment.ts';
const JWT = /^eyJ[A-Za-z0-9_-]+\.(eyJ[A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+$/;

/** Devuelve los problemas de la configuración; vacío si es válida. Solo admite valores públicos (ADR-015, FE-03). */
export function validateEnvironment({ SUPABASE_URL: url = '', SUPABASE_PUBLISHABLE_KEY: key = '' }) {
    const problems = [];

    if (!url.trim()) {
        problems.push('Falta SUPABASE_URL.');
    } else if (!url.startsWith('https://')) {
        problems.push('SUPABASE_URL debe empezar por https://.');
    }

    if (!key.trim()) {
        problems.push('Falta SUPABASE_PUBLISHABLE_KEY.');
    } else if (key.startsWith('sb_secret_') || isServiceRoleJwt(key)) {
        problems.push('SUPABASE_PUBLISHABLE_KEY es una clave privilegiada: usa la clave publicable (sb_publishable_...).');
    }

    return problems;
}

function isServiceRoleJwt(key) {
    const payload = key.match(JWT)?.[1];

    if (!payload) {
        return false;
    }

    try {
        return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')).role === 'service_role';
    } catch {
        return false;
    }
}

function render({ SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: key }) {
    return `/**
 * Configuración generada por scripts/write-environment.mjs en la compilación de Vercel.
 * No se versiona con estos valores: el repositorio la conserva vacía (spec 008).
 */
export const environment = {
    production: true,
    supabaseUrl: ${JSON.stringify(url.trim())},
    supabasePublishableKey: ${JSON.stringify(key.trim())},
    sessionInactivityMinutes: 60
};
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const problems = validateEnvironment(process.env);

    if (problems.length > 0) {
        console.error(`✗ Configuración de producción inválida:\n  - ${problems.join('\n  - ')}`);
        process.exit(1);
    }

    writeFileSync(TARGET, render(process.env));
    console.log(`✓ ${TARGET} generado para ${process.env.SUPABASE_URL}. No lo incluyas en un commit.`);
}
