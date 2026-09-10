import { render, waitFor } from '@testing-library/react-native';
import type React from 'react';

import { httpClient } from '@/core/api/client';
import { authService } from '@/core/services/auth-service';
import RootLayout from '../_layout';

jest.mock('@/global.css', () => ({}));

var mockRouterReplace: jest.Mock;

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react');
  const MockStack = (props: { children?: React.ReactNode }) =>
    ReactLib.createElement(ReactLib.Fragment, null, props.children);
  MockStack.displayName = 'Stack';
  const MockStackScreen = () => null;
  MockStackScreen.displayName = 'StackScreen';
  (MockStack as unknown as Record<string, unknown>).Screen = MockStackScreen;
  mockRouterReplace = jest.fn();
  return {
    Stack: MockStack,
    router: { replace: mockRouterReplace, push: jest.fn(), back: jest.fn() },
  };
});

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

var mockHydrate: jest.Mock;
var mockClearSession: jest.Mock;

jest.mock('@/stores/auth-store', () => {
  const innerHydrate = jest.fn().mockResolvedValue(true);
  const innerClearSession = jest.fn().mockResolvedValue(undefined);
  mockHydrate = innerHydrate;
  mockClearSession = innerClearSession;
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

const mockHttpClient = httpClient as unknown as {
  setAuthTokenProvider: jest.Mock;
  setOnUnauthorized: jest.Mock;
};
const mockAuthService = authService as unknown as {
  setUnauthorizedHandler: jest.Mock;
  handleUnauthorized: jest.Mock;
};

describe('RootLayout — wiring (M1.5 AC8, AC11)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers httpClient.setAuthTokenProvider pointing at Zustand (AC8)', async () => {
    render(<RootLayout />);
    await waitFor(() => {
      expect(mockHttpClient.setAuthTokenProvider).toHaveBeenCalledTimes(1);
    });

    const provider = mockHttpClient.setAuthTokenProvider.mock.calls[0][0] as () => string | null;
    expect(typeof provider).toBe('function');
    expect(provider()).toBe('zustand-tok-123');
  });

  it('registers httpClient.setOnUnauthorized that delegates to authService.handleUnauthorized (AC1, AC11)', async () => {
    render(<RootLayout />);
    await waitFor(() => {
      expect(mockHttpClient.setOnUnauthorized).toHaveBeenCalledTimes(1);
    });

    const handler = mockHttpClient.setOnUnauthorized.mock.calls[0][0] as () => Promise<void>;
    await handler();

    expect(mockAuthService.handleUnauthorized).toHaveBeenCalledTimes(1);
    expect(mockRouterReplace).toHaveBeenCalledWith('/(auth)/login');
  });

  it('registers authService.setUnauthorizedHandler that calls useAuthStore.clearSession (AC11)', async () => {
    render(<RootLayout />);
    await waitFor(() => {
      expect(mockAuthService.setUnauthorizedHandler).toHaveBeenCalledTimes(1);
    });

    const handler = mockAuthService.setUnauthorizedHandler.mock.calls[0][0] as () => Promise<void>;
    await handler();

    expect(mockClearSession).toHaveBeenCalled();
  });

  it('triggers useAuthStore.hydrate on mount', async () => {
    render(<RootLayout />);
    await waitFor(() => {
      expect(mockHydrate).toHaveBeenCalledTimes(1);
    });
  });
});
