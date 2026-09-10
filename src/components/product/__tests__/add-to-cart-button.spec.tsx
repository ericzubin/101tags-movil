import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { AddToCartButton } from '@/components/product/AddToCartButton';

describe('AddToCartButton', () => {
  it('deshabilitado: accessibilityState.disabled y no dispara onPress', () => {
    const onPress = jest.fn();
    render(<AddToCartButton disabled onPress={onPress} />);
    const button = screen.getByTestId('add-to-cart');
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('habilitado dispara onPress', () => {
    const onPress = jest.fn();
    render(<AddToCartButton onPress={onPress} />);
    fireEvent.press(screen.getByTestId('add-to-cart'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('sin onPress usa el placeholder de F3 vía Alert', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    render(<AddToCartButton />);
    fireEvent.press(screen.getByTestId('add-to-cart'));
    expect(alertSpy).toHaveBeenCalledWith('Carrito', 'El carrito llega en la Fase 3.');
    alertSpy.mockRestore();
  });
});
