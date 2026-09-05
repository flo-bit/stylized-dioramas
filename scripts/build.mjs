import { spawnSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = fileURLToPath(new URL('../', import.meta.url));
const { values } = parseArgs({ options: { base: { type: 'string', default: '/' } } });
const base = `/${values.base.split('/').filter(Boolean).join('/')}/`.replace(/^\/\/$/, '/');
if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base)) {
  throw new Error('Use a URL pathname for --base, e.g. /stylized-dioramas/');
}

function run(args) {
  const result = spawnSync('pnpm', args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Build the gallery first: Vite cleans dist before the six projects are added.
run(['exec', 'vite', 'build', '--base', base]);
for (const project of ['italy-town', 'asia', 'island', 'night-street', 'ruins', 'underwater']) {
  run(['--dir', project, 'build', '--base', `${base}${project}/`,
    '--outDir', `../dist/${project}`, '--emptyOutDir']);
}
await writeFile(new URL('../dist/.nojekyll', import.meta.url), '');
console.log(`\nBuilt all six dioramas at ${base}`);
