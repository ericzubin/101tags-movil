// Local ambient module declarations for Node built-ins used only by tests.
// This file lets us import `node:fs`, `node:path` and `node:module` from
// `.spec.ts` files without pulling `@types/node` as a devDependency.
//
// The values here are intentionally minimal — we only need what the
// existing test files (splash-theme.spec.ts, nativewind-tokens.spec.ts,
// tokens.spec.ts, font-loading.spec.tsx) actually use. If a new spec
// needs more, extend it locally.

declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf8'): string;
  export function readFileSync(path: string): Buffer;
  export function existsSync(path: string): boolean;
  export function statSync(path: string): { size: number };
}

declare module 'node:path' {
  export function resolve(...segments: string[]): string;
  export function relative(from: string, to: string): string;
  export function join(...segments: string[]): string;
  export function dirname(p: string): string;
}

declare module 'node:module' {
  export function createRequire(filename: string): NodeRequire;
}

declare module 'node:child_process' {
  export function execFileSync(
    file: string,
    args?: readonly string[],
    options?: { cwd?: string; encoding?: 'utf8'; stdio?: readonly string[] },
  ): string;
}

interface NodeRequire {
  (id: string): unknown;
}

declare const __dirname: string;
declare const __filename: string;