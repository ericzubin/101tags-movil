import type React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import RootLayout from '../_layout';

jest.mock('@/global.css', () => ({}));

var mockLoadAsync: jest.Mock;

jest.mock('expo-font', () => {
  mockLoadAsync = jest.fn(() => Promise.resolve());
  return {
    __esModule: true,
    loadAsync: mockLoadAsync,
    isLoaded: jest.fn(() => false),
  };
});

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

var mockRouterReplace: jest.Mock;

jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react');
  const MockStack = (props: { children?: React.ReactNode }) =>
    ReactLib.createElement(ReactLib.Fragment, null, props.children);
  MockStack.displayName = 'Stack';
  const MockStackScreen: () => null = () => null;
  (MockStackScreen as unknown as { displayName: string }).displayName = 'StackScreen';
  (MockStack as unknown as { Screen: typeof MockStackScreen }).Screen = MockStackScreen;
  mockRouterReplace = jest.fn();
  return {
    Stack: MockStack,
    router: { replace: mockRouterReplace, push: jest.fn(), back: jest.fn() },
  };
});

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react');
  const MockSafeAreaProvider = ({ children }: { children?: React.ReactNode }) =>
    ReactLib.createElement(ReactLib.Fragment, null, children);
  MockSafeAreaProvider.displayName = 'SafeAreaProvider';
  return {
    SafeAreaProvider: MockSafeAreaProvider,
    SafeAreaView: ({ children }: { children?: React.ReactNode }) =>
      ReactLib.createElement(ReactLib.Fragment, null, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 320, height: 640 }),
    SafeAreaInsetsContext: ReactLib.createContext({ top: 0, right: 0, bottom: 0, left: 0 }),
    SafeAreaFrameContext: ReactLib.createContext({ x: 0, y: 0, width: 320, height: 640 }),
  };
});

jest.mock('@tanstack/react-query', () => ({
  QueryClientProvider: ({ children }: { children?: React.ReactNode }) => children,
}));

jest.mock('@/core/api/client', () => ({
  httpClient: {
    setAuthTokenProvider: jest.fn(),
    setOnUnauthorized: jest.fn(),
  },
}));

jest.mock('@/core/services/auth-service', () => ({
  authService: {
    setUnauthorizedHandler: jest.fn(),
    handleUnauthorized: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/core/query/client', () => ({
  queryClient: { mount: jest.fn(), unmount: jest.fn() },
}));

jest.mock('@/stores/auth-store', () => {
  const innerHydrate = jest.fn().mockResolvedValue(true);
  const innerClearSession = jest.fn().mockResolvedValue(undefined);
  const state: Record<string, unknown> = {
    isHydrated: true,
    hydrate: innerHydrate,
    clearSession: innerClearSession,
    token: 'zustand-tok-123',
    user: { id: 1, name: 'Ana', email: 'a@x.com', phone: null, role: 'customer' },
  };
  const selectorFn = (selector: (s: Record<string, unknown>) => unknown) => selector(state);
  (selectorFn as unknown as Record<string, unknown>).getState = () => state;
  return {
    useAuthStore: selectorFn,
  };
});

describe('RootLayout — font loading wiring (M1.8 AC4, AC5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadAsync.mockClear();
    mockLoadAsync.mockResolvedValue(undefined);
    mockRouterReplace.mockClear();
  });

  it('AC4: loadAsync is called with Montserrat-Regular and Montserrat-Bold', async () => {
    render(<RootLayout />);
    await waitFor(() => {
      expect(mockLoadAsync).toHaveBeenCalledTimes(1);
    });
    const arg = mockLoadAsync.mock.calls[0][0] as Record<string, unknown>;
    expect(arg).toHaveProperty('Montserrat-Regular');
    expect(arg).toHaveProperty('Montserrat-Bold');
  });

  it('AC4-bis: passed font entries point at valid asset modules (not undefined)', async () => {
    render(<RootLayout />);
    await waitFor(() => {
      expect(mockLoadAsync).toHaveBeenCalledTimes(1);
    });
    const arg = mockLoadAsync.mock.calls[0][0] as Record<string, unknown>;
    expect(arg['Montserrat-Regular']).toBeDefined();
    expect(arg['Montserrat-Bold']).toBeDefined();
  });

  it('AC5: root tree stays gated while loadAsync is pending', async () => {
    let resolveLoad: () => void = () => {};
    mockLoadAsync.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveLoad = resolve;
      }),
    );

    const { queryByTestId } = render(<RootLayout />);

    // While loadAsync is pending, splash gate is visible and Stack is NOT.
    expect(queryByTestId('splash-placeholder')).not.toBeNull();
    expect(queryByTestId('root-stack')).toBeNull();

    resolveLoad();
    await waitFor(() => {
      expect(mockLoadAsync).toHaveBeenCalled();
    });
  });

  it('AC5-bis: when loadAsync rejects, the layout still proceeds (no blocking)', async () => {
    mockLoadAsync.mockRejectedValueOnce(new Error('boom'));

    expect(() => render(<RootLayout />)).not.toThrow();

    await waitFor(() => {
      expect(mockLoadAsync).toHaveBeenCalled();
    });
  });
});
