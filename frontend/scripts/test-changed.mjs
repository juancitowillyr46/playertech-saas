// Ejecuta solo las pruebas de los archivos que cambiaron respecto a main (commits de la rama,
// cambios sin confirmar y archivos nuevos): de cada archivo se corre su .spec.ts, si existe.
// No sustituye a `npm run test:ci`, que se corre una vez antes del commit o del PR.
import { execSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const base = process.argv.find((arg) => arg.startsWith('--base='))?.slice('--base='.length) ?? 'main';
const extraArgs = process.argv.slice(2).filter((arg) => !arg.startsWith('--base='));

const git = (command) => execSync(`git ${command}`, { encoding: 'utf8' }).split('\n').filter(Boolean);
const changed = new Set([
    ...git(`diff --name-only --relative ${base}...HEAD`),
    ...git('diff --name-only --relative HEAD'),
    ...git('ls-files --others --exclude-standard')
]);

// Una plantilla .html se prueba con el .spec.ts de su componente.
const specs = [...changed]
    .filter((file) => file.startsWith('src/') && /\.(ts|html)$/.test(file))
    .map((file) => (file.endsWith('.spec.ts') ? file : file.replace(/\.(ts|html)$/, '.spec.ts')))
    .filter((file) => existsSync(file));
const targets = [...new Set(specs)];

if (targets.length === 0) {
    console.log(`Ningún archivo cambiado en src/ respecto a ${base} tiene pruebas propias.`);
    process.exit(0);
}

console.log(`Corriendo ${targets.length} archivo(s) de pruebas por cambios respecto a ${base}.`);
const include = targets.flatMap((file) => ['--include', file]);
const result = spawnSync('npx', ['ng', 'test', '--watch=false', ...include, ...extraArgs], { stdio: 'inherit', shell: true });
process.exit(result.status ?? 1);
