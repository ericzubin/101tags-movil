// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execFileSync } = require('node:child_process');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('node:fs');

describe('.gitignore patterns (M1.7-gitignore #57)', () => {
  function checkIgnore(p: string): { ignored: boolean; line?: number; reason?: string } {
    try {
      const out = execFileSync('git', ['check-ignore', '-v', p], {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const m = out.match(/\.gitignore:(\d+):/);
      return { ignored: true, line: m ? Number(m[1]) : undefined };
    } catch (e) {
      const err = e as { stderr?: unknown; message?: string };
      let stderr = '';
      if (typeof err.stderr === 'string') {
        stderr = err.stderr;
      } else if (err.stderr && typeof (err.stderr as { toString?: unknown }).toString === 'function') {
        stderr = String(err.stderr);
      }
      const msg = stderr || err.message || String(e);
      if (msg.includes('beyond a symbolic link')) {
        return { ignored: true, reason: 'symlink' };
      }
      return { ignored: false, reason: msg };
    }
  }

  it('AC1: .angular/ es ignored', () => {
    expect(checkIgnore('.angular/').ignored).toBe(true);
  });

  it('AC2: .playwright-mcp/ es ignored', () => {
    expect(checkIgnore('.playwright-mcp/').ignored).toBe(true);
  });

  it('AC3: www/ es ignored', () => {
    expect(checkIgnore('www/').ignored).toBe(true);
  });

  it('AC4: node_modules/.cache/ es ignored', () => {
    expect(checkIgnore('node_modules/.cache/').ignored).toBe(true);
  });

  it('AC5a: header del bloque preservado', () => {
    const content = fs.readFileSync('.gitignore', 'utf8');
    expect(content).toContain(
      '# Residual de pivote / runtime / tooling cache (NO commitear)',
    );
  });

  it('AC5b: los 4 patterns quedan sin comentarios inline después del header', () => {
    const content = fs.readFileSync('.gitignore', 'utf8');
    const headerIdx = content.indexOf('# Residual de pivote');
    expect(headerIdx).toBeGreaterThanOrEqual(0);
    const afterHeader = content.slice(headerIdx);
    expect(afterHeader).toMatch(/\n\.angular\/\n\.playwright-mcp\/\nwww\/\nnode_modules\/\.cache\//);
  });

  it('AC4-bis: el pattern explícito node_modules/.cache/ existe sin comentario inline', () => {
    const content = fs.readFileSync('.gitignore', 'utf8');
    const lines = content.split('\n');
    const idx = lines.findIndex((l: string) => l.trim() === 'node_modules/.cache/');
    expect(idx).toBeGreaterThanOrEqual(0);
  });
});
