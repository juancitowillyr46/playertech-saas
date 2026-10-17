// Verifica las reglas de estilos de AGENTS.md (spec 003, research R11; FR-006, SC-002):
// - sin `!important` en el código de PlayerTech ni en el SCSS del layout;
// - sin selectores de clases internas de PrimeNG (`.p-…`) en el SCSS del layout ni en estilos de componentes;
// - sin colores hexadecimales en plantillas (se usan tokens o utilidades).
// Las demos de SakaiNG quedan fuera: son material de referencia (principio V).
// Uso: npm run check:styles
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = ['src/app', 'src/assets/layout'];
const EXCLUDED = ['src/app/pages', 'src/assets/demo'];

const IMPORTANT = /!important/;
const PRIME_SELECTOR = /(^|[\s,>+~(])\.p-[a-z][\w-]*/m;
const HEX_COLOR = /#[0-9a-fA-F]{3,8}\b/;

function listFiles(dir) {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name).replaceAll('\\', '/');

        if (EXCLUDED.some((excluded) => path.startsWith(excluded))) {
            return [];
        }

        return statSync(path).isDirectory() ? listFiles(path) : [path];
    });
}

/** Plantillas en línea (`template: \`…\``) y bloques `styles` de un componente. */
function extractBlocks(source, key) {
    const blocks = [];
    const pattern = new RegExp(`${key}\\s*:\\s*(\\[\\s*)?\``, 'g');
    let match;

    while ((match = pattern.exec(source))) {
        const start = match.index + match[0].length;
        const end = source.indexOf('`', start);

        if (end > start) {
            blocks.push({ text: source.slice(start, end), offset: start });
        }
    }

    return blocks;
}

function lineOf(source, index) {
    return source.slice(0, index).split('\n').length;
}

function findLine(text, regex, offset, source) {
    const match = regex.exec(text);

    return match ? lineOf(source, offset + match.index + (match[1]?.length ?? 0)) : null;
}

const problems = [];

function report(path, line, message) {
    problems.push(`${relative('.', path).replaceAll('\\', '/')}:${line} ${message}`);
}

for (const path of ROOTS.flatMap(listFiles)) {
    if (path.endsWith('.spec.ts')) {
        continue;
    }

    const source = readFileSync(path, 'utf8');

    if (path.endsWith('.scss') || path.endsWith('.css')) {
        source.split('\n').forEach((text, index) => {
            if (IMPORTANT.test(text)) {
                report(path, index + 1, 'usa !important');
            }

            if (PRIME_SELECTOR.test(text.replace(/\/\/.*$/, ''))) {
                report(path, index + 1, 'sobrescribe una clase interna de PrimeNG (.p-…); ajusta sus tokens en el preset');
            }
        });
        continue;
    }

    if (path.endsWith('.ts')) {
        for (const block of extractBlocks(source, 'styles')) {
            const important = findLine(block.text, IMPORTANT, block.offset, source);
            const prime = findLine(block.text, PRIME_SELECTOR, block.offset, source);

            if (important) report(path, important, 'usa !important');
            if (prime) report(path, prime, 'sobrescribe una clase interna de PrimeNG (.p-…); ajusta sus tokens en el preset');
        }

        for (const block of extractBlocks(source, 'template')) {
            const hex = findLine(block.text, HEX_COLOR, block.offset, source);
            const important = findLine(block.text, IMPORTANT, block.offset, source);

            if (hex) report(path, hex, 'color hexadecimal en la plantilla; usa un token o una utilidad');
            if (important) report(path, important, 'usa !important');
        }
        continue;
    }

    if (path.endsWith('.html')) {
        const hex = findLine(source, HEX_COLOR, 0, source);

        if (hex) report(path, hex, 'color hexadecimal en la plantilla; usa un token o una utilidad');
    }
}

if (problems.length > 0) {
    console.error(`check:styles encontró ${problems.length} problema(s):`);
    problems.forEach((problem) => console.error(`  ${problem}`));
    process.exit(1);
}

console.log('check:styles: sin !important, sin selectores .p-* y sin colores hexadecimales en plantillas.');
