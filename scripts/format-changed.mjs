#!/usr/bin/env node
/**
 * format:changed — valida con Prettier SOLO los archivos cambiados respecto a
 * una base. Evita arrastrar la deuda de formato histórica del repo en cada PR.
 *
 * Base (en orden de prioridad):
 *   1. --base <ref>
 *   2. GITHUB_BASE_REF  -> origin/<ref>  (pull_request)
 *   3. GITHUB_BEFORE    -> <sha>          (push)
 *   4. origin/developer
 *
 * Uso local:  node scripts/format-changed.mjs --base origin/developer
 */
import { execFileSync, spawnSync } from 'node:child_process';

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'];

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: 'utf8' }).trim();
}

function resolveBase() {
  const argIdx = process.argv.indexOf('--base');
  if (argIdx !== -1 && process.argv[argIdx + 1]) return process.argv[argIdx + 1];
  if (process.env.GITHUB_BASE_REF) return `origin/${process.env.GITHUB_BASE_REF}`;
  if (process.env.GITHUB_BEFORE && !/^0+$/.test(process.env.GITHUB_BEFORE)) {
    return process.env.GITHUB_BEFORE;
  }
  return 'origin/developer';
}

const base = resolveBase();

let diff;
try {
  run('git', ['rev-parse', '--verify', `${base}^{commit}`]);
  diff = run('git', ['diff', '--name-only', '--diff-filter=ACMR', `${base}...HEAD`]);
} catch {
  console.warn(`[format:changed] base "${base}" no encontrada; omitiendo check.`);
  process.exit(0);
}

const files = diff
  .split('\n')
  .map((f) => f.trim())
  .filter(Boolean)
  .filter((f) => EXTENSIONS.some((ext) => f.endsWith(ext)));

if (files.length === 0) {
  console.log('[format:changed] sin archivos cambiados que formatear. OK');
  process.exit(0);
}

console.log(`[format:changed] ${files.length} archivo(s) vs ${base}`);
const result = spawnSync('pnpm', ['exec', 'prettier', '--check', ...files], {
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
