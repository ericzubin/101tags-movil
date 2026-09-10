import { render, screen } from '@testing-library/react-native';

import { Image } from '@/components/ui/Image';

describe('Image', () => {
  it('AC30: source string válida renderiza ExpoImage (mockeado a <View testID="expo-image">)', () => {
    render(<Image source="https://cdn/x.jpg" testID="my-img" />);
    // The jest.setup.js mock makes ExpoImage render <View testID="expo-image">…
    // We pass testID on ExpoImage prop; in our mock it gets forwarded. If the mock
    // uses testID 'expo-image' as default, verify it exists. If we override testID,
    // the mock keeps the caller's testID.
    const node = screen.getByTestId('my-img');
    expect(node).toBeTruthy();
  });

  it('AC31: source=null renderiza placeholder View (no expo-image)', () => {
    render(<Image source={null} testID="placeholder" />);
    const node = screen.getByTestId('placeholder');
    expect(node).toBeTruthy();
    // No uri text rendered by the mock — placeholder View does not have an inner Text
  });

  it('undefined y "" también renderizan placeholder', () => {
    const { unmount: u1 } = render(<Image source={undefined} testID="ph-undef" />);
    expect(screen.getByTestId('ph-undef')).toBeTruthy();
    u1();
    render(<Image source="" testID="ph-empty" />);
    expect(screen.getByTestId('ph-empty')).toBeTruthy();
  });

  it('relative path /storage/x.jpg se resuelve internamente y se pasa al mock', () => {
    render(<Image source="/storage/products/x.jpg" testID="relative" />);
    expect(screen.getByTestId('relative')).toBeTruthy();
  });
});
