jest.mock('expo-secure-store', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(false)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  Stack: ({ children }) => children,
  Tabs: ({ children }) => children,
  Link: ({ children }) => children,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/',
  useLocalSearchParams: () => ({}),
}));

jest.mock('@expo/vector-icons', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react');
  const RN = require('react-native');
  const MockIcon = ({ name, ...props }) =>
    ReactLib.createElement(RN.Text, props, name);
  return {
    Ionicons: MockIcon,
    MaterialIcons: MockIcon,
    MaterialCommunityIcons: MockIcon,
    FontAwesome: MockIcon,
    Feather: MockIcon,
    AntDesign: MockIcon,
    Entypo: MockIcon,
    EvilIcons: MockIcon,
    Foundation: MockIcon,
    Octicons: MockIcon,
    SimpleLineIcons: MockIcon,
    Zocial: MockIcon,
  };
});

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { name: '101tags', slug: '101tags' } },
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-image', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react');
  const { Text, View } = require('react-native');
  const MockImage = (props) => {
    const testID = props.testID ?? 'expo-image';
    const uri = props.source?.uri ?? 'image';
    return ReactLib.createElement(View, { ...props, testID }, ReactLib.createElement(Text, null, uri));
  };
  return {
    Image: MockImage,
    ImageBackground: MockImage,
  };
});
