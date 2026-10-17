// Verifica la compilación de producción (research R14; FR-024, FR-034; SC-003, SC-004):
// - sin claves privilegiadas de Supabase;
// - sin las demos de SakaiNG ni la sección "Demos" del menú.
// Uso: npm run build && npm run check:bundle
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist/playertech/browser';
const DEMOS = 'src/app/pages';

/**
 * Credenciales que nunca deben llegar al navegador. Se buscan claves reales, no
 * menciones: el SDK de Supabase contiene el texto "sb_secret_" para advertir
 * contra su uso en el cliente.
 */
const SECRET_KEY = /sb_secret_[A-Za-z0-9_-]{16,}/;
const JWT = /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g;
const ENV_NAMES = ['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY'];

/** Una clave `service_role` antigua es un JWT cuyo contenido tiene role = service_role. */
function hasServiceRoleJwt(content) {
    return [...content.matchAll(JWT)].some(([token]) => {
        try {
            return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')).role === 'service_role';
        } catch {
            return false;
        }
    });
}

function listFiles(dir, extension) {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);

        return statSync(path).isDirectory() ? listFiles(path, extension) : path.endsWith(extension) ? [path] : [];
    });
}

/** Selectores de los componentes de las demos: si aparecen en dist/, las demos llegaron a producción. */
function demoSelectors() {
    const selectors = new Set();

    for (const file of listFiles(DEMOS, '.ts')) {
        for (const match of readFileSync(file, 'utf8').matchAll(/selector:\s*'([^']+)'/g)) {
            selectors.add(match[1]);
        }
    }

    return [...selectors];
}

let bundle;

try {
    bundle = listFiles(DIST, '.js').map((file) => ({ file, content: readFileSync(file, 'utf8') }));
} catch {
    console.error(`No se encontró ${DIST}. Ejecuta primero: npm run build`);
    process.exit(1);
}

const selectors = demoSelectors();
const checks = [
    { label: 'clave secreta de Supabase (sb_secret_…)', test: (content) => SECRET_KEY.test(content) },
    { label: 'clave service_role (JWT)', test: hasServiceRoleJwt },
    ...ENV_NAMES.map((name) => ({ label: `variable privilegiada ${name}`, test: (content) => content.includes(name) })),
    ...selectors.map((selector) => ({ label: `demo de SakaiNG <${selector}>`, test: (content) => content.includes(`"${selector}"`) })),
    { label: 'ruta de demos "/dev/"', test: (content) => content.includes('/dev/') }
];

const findings = checks.flatMap(({ label, test }) => bundle.filter(({ content }) => test(content)).map(({ file }) => `${label} en ${file}`));

console.log(`Revisados ${bundle.length} archivos de ${DIST}: claves secretas, JWT service_role, ${selectors.length} selectores de demos y la ruta /dev/.`);

if (findings.length) {
    console.error(`\n✗ ${findings.length} hallazgos:\n  ${findings.join('\n  ')}`);
    process.exit(1);
}

console.log('✓ Sin claves privilegiadas ni demos en la compilación de producción.');
