import { render } from '@testing-library/react-native';
import React from 'react';

import TabsLayout from '../_layout';

const mockTabs = jest.fn();
const mockTabsScreen = jest.fn();
const mockRedirect = jest.fn();
const mockRouterReplace = jest.fn();

jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react');
  const MockTabs = (props: { children?: React.ReactNode; screenOptions?: unknown }) => {
    mockTabs(props);
    return ReactLib.createElement(ReactLib.Fragment, null, props.children);
  };
  MockTabs.displayName = 'Tabs';
  const MockTabsScreen = (props: { name?: string; options?: unknown }) => {
    mockTabsScreen(props);
    return null;
  };
  MockTabsScreen.displayName = 'TabsScreen';
  (MockTabs as unknown as Record<string, unknown>).Screen = MockTabsScreen;
  const MockRedirect = (props: { href: string }) => {
    mockRedirect(props);
    return null;
  };
  MockRedirect.displayName = 'Redirect';
  return {
    Tabs: MockTabs,
    Redirect: MockRedirect,
    router: { push: jest.fn(), replace: mockRouterReplace, back: jest.fn() },
    useRouter: () => ({ push: jest.fn(), replace: mockRouterReplace, back: jest.fn() }),
  };
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => null,
}));

let mockIsHydrated = true;
let mockIsAuthenticated = true;

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: (
    selector: (s: { isHydrated: boolean; token: string | null; user: unknown }) => unknown,
  ) => {
    const state = {
      isHydrated: mockIsHydrated,
      token: mockIsAuthenticated ? 'mock-token' : null,
      user: mockIsAuthenticated ? { id: 1, name: 'Juan', email: 'j@x.com' } : null,
    };
    return selector(state);
  },
  isAuthenticated: (s: { token: string | null; user: unknown }) =>
    !!s.token && !!s.user,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockIsHydrated = true;
  mockIsAuthenticated = true;
});

describe('TabsLayout — contract (M1.10 AC1-AC5)', () => {
  it('AC1: declares 4 Tabs.Screen (index, catalog, cart, account)', () => {
    render(<TabsLayout />);
    const screens = mockTabsScreen.mock.calls.map((c) => c[0].name);
    expect(screens).toEqual(expect.arrayContaining(['index', 'catalog', 'cart', 'account']));
    expect(mockTabsScreen).toHaveBeenCalledTimes(4);
  });

  it('AC1: each tab has the correct Spanish title', () => {
    render(<TabsLayout />);
    const titlesByName: Record<string, string> = {};
    for (const call of mockTabsScreen.mock.calls) {
      const props = call[0] as { name: string; options: { title: string } };
      titlesByName[props.name] = props.options.title;
    }
    expect(titlesByName.index).toBe('Inicio');
    expect(titlesByName.catalog).toBe('Catálogo');
    expect(titlesByName.cart).toBe('Carrito');
    expect(titlesByName.account).toBe('Cuenta');
  });

  it('AC2: each tab has a tabBarIcon function that returns JSX', () => {
    render(<TabsLayout />);
    for (const call of mockTabsScreen.mock.calls) {
      const props = call[0] as { options: { tabBarIcon: unknown } };
      expect(typeof props.options.tabBarIcon).toBe('function');
      const Icon = props.options.tabBarIcon as (p: {
        color: string;
        focused: boolean;
      }) => React.ReactElement;
      const el = Icon({ color: '#000', focused: true });
      expect(el).toBeTruthy();
      expect(typeof el).toBe('object');
    }
  });

  it('AC3: Tabs screenOptions uses brandColors tokens (primary, dark, medium)', () => {
    render(<TabsLayout />);
    expect(mockTabs).toHaveBeenCalledTimes(1);
    const opts = (mockTabs.mock.calls[0][0] as { screenOptions: Record<string, unknown> })
      .screenOptions;
    expect(opts.tabBarActiveTintColor).toBe('#E31E24');
    expect(opts.tabBarInactiveTintColor).toBe('#0a0a0a');
    const style = opts.tabBarStyle as { backgroundColor: string };
    expect(style.backgroundColor).toBe('#F5F5F5');
  });

  it('AC4: when !isAuthenticated and hydrated, returns <Redirect href="/(auth)/login" />', () => {
    mockIsAuthenticated = false;
    mockIsHydrated = true;
    render(<TabsLayout />);
    expect(mockRedirect).toHaveBeenCalledWith({ href: '/(auth)/login' });
    expect(mockTabs).not.toHaveBeenCalled();
  });

  it('AC5: when !isHydrated (splash phase), renders null and no Tabs', () => {
    mockIsHydrated = false;
    render(<TabsLayout />);
    expect(mockTabs).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
