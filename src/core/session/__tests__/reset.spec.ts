import { __resetRegistryForTests, registerSessionReset, runSessionResets } from '@/core/session/reset';

describe('session reset registry', () => {
  beforeEach(() => {
    __resetRegistryForTests();
  });

  it('runSessionResets ejecuta todos los resetters en orden y no propaga errores', async () => {
    const calls: string[] = [];
    registerSessionReset(() => {
      calls.push('first');
    });
    registerSessionReset(() => {
      calls.push('second');
      throw new Error('boom');
    });
    registerSessionReset(() => {
      calls.push('third');
    });

    await expect(runSessionResets()).resolves.toBeUndefined();
    expect(calls).toEqual(['first', 'second', 'third']);
  });

  it('runSessionResets sin resetters resuelve sin error', async () => {
    await expect(runSessionResets()).resolves.toBeUndefined();
  });
});
