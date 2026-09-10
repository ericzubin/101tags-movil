// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync: (path: string, encoding: string) => string };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path') as { join: (...parts: string[]) => string };

describe('ruta product/[slug] registrada en el root stack (AC10)', () => {
  const layoutSource = fs.readFileSync(path.join(__dirname, '..', '_layout.tsx'), 'utf8');

  it('incluye <Stack.Screen name="product/[slug]" />', () => {
    expect(layoutSource).toContain('name="product/[slug]"');
  });

  it('conserva el wiring de providers, splash y handlers', () => {
    expect(layoutSource).toContain('QueryClientProvider');
    expect(layoutSource).toContain('SafeAreaProvider');
    expect(layoutSource).toContain('setAuthTokenProvider');
    expect(layoutSource).toContain('setOnUnauthorized');
    expect(layoutSource).toContain('SplashScreen.preventAutoHideAsync');
    expect(layoutSource).toContain('Stack.Screen name="(tabs)"');
  });
});
