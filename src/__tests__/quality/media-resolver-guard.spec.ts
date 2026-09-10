// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require('node:child_process');

const CANONICAL_IMAGE = 'src/components/ui/Image.tsx';
const CANONICAL_MEDIA_URL = 'src/core/utils/media-url.ts';

function grepFiles(pattern: string): string[] {
  let output = '';
  try {
    output = execSync(`grep -rl "${pattern}" src --include='*.ts' --include='*.tsx'`, {
      encoding: 'utf8',
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    output = '';
  }
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function isExcluded(file: string): boolean {
  return file.includes('__tests__') || file.endsWith('.spec.ts') || file.endsWith('.spec.tsx');
}

describe('media resolver guard (M2.5 AC6)', () => {
  it('AC6: solo src/components/ui/Image.tsx importa expo-image', () => {
    const offenders = grepFiles('expo-image')
      .filter((file) => !isExcluded(file))
      .filter((file) => file !== CANONICAL_IMAGE);

    expect(offenders).toEqual([]);
  });

  it('AC6: solo Image.tsx y media-url.ts referencian resolveMediaUrl', () => {
    const offenders = grepFiles('resolveMediaUrl')
      .filter((file) => !isExcluded(file))
      .filter((file) => file !== CANONICAL_IMAGE && file !== CANONICAL_MEDIA_URL);

    expect(offenders).toEqual([]);
  });

  it('AC6: el guard reconoce los archivos canónicos (sanity)', () => {
    expect(grepFiles('expo-image')).toContain(CANONICAL_IMAGE);
    expect(grepFiles('resolveMediaUrl')).toContain(CANONICAL_MEDIA_URL);
  });
});
