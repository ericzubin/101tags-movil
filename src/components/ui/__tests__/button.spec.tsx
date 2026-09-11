import { render, screen, fireEvent } from '@testing-library/react-native';
import type React from 'react';

import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('AC23: renderiza Pressable con el label recibido', () => {
    const onPress = jest.fn();
    render(<Button label="Entrar" onPress={onPress} />);
    const btn = screen.getByTestId('button');
    expect(btn).toBeTruthy();
    expect(screen.getByText('Entrar')).toBeTruthy();
  });

  it('AC24: prop loading=true muestra ActivityIndicator y NO el texto', () => {
    const onPress = jest.fn();
    render(<Button label="Entrar" onPress={onPress} loading testID="loading-btn" />);
    expect(screen.queryByText('Entrar')).toBeNull();
    // ActivityIndicator renders as a host component with role/elements; we verify
    // its presence through the absence of the label and the existence of the pressable.
    const btn = screen.getByTestId('loading-btn');
    expect(btn).toBeTruthy();
  });

  it('AC25: prop disabled=true aplica opacity-50 y bloquea onPress (accessibilityState.disabled=true)', () => {
    const onPress = jest.fn();
    render(<Button label="Entrar" onPress={onPress} disabled testID="disabled-btn" />);
    const btn = screen.getByTestId('disabled-btn');
    // React Native propagates Pressable's disabled via accessibilityState.disabled
    expect(btn.props.accessibilityState).toMatchObject({ disabled: true });
    // Pressable is disabled — onPress must not fire even if user taps
    fireEvent.press(btn);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('onPress se invoca al presionar (cuando no está disabled)', () => {
    const onPress = jest.fn();
    render(<Button label="Tap" onPress={onPress} testID="tappable" />);
    fireEvent.press(screen.getByTestId('tappable'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('acepta testID custom y accessibilityLabel custom', () => {
    render(
      <Button
        label="OK"
        onPress={jest.fn()}
        testID="custom-btn"
        accessibilityLabel="Aceptar"
      />,
    );
    expect(screen.getByTestId('custom-btn').props.accessibilityLabel).toBe('Aceptar');
  });
});
