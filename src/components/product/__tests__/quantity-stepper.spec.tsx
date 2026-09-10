import { fireEvent, render, screen } from '@testing-library/react-native';

import { QuantityStepper } from '@/components/product/QuantityStepper';

describe('QuantityStepper', () => {
  it('incrementa al presionar +', () => {
    const onChange = jest.fn();
    render(<QuantityStepper value={1} max={5} onChange={onChange} />);
    fireEvent.press(screen.getByTestId('qty-increment'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('decrementa al presionar −', () => {
    const onChange = jest.fn();
    render(<QuantityStepper value={3} max={5} onChange={onChange} />);
    fireEvent.press(screen.getByTestId('qty-decrement'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('en el mínimo (1) el botón − está deshabilitado y no emite cambios', () => {
    const onChange = jest.fn();
    render(<QuantityStepper value={1} max={5} onChange={onChange} />);
    const decrement = screen.getByTestId('qty-decrement');
    expect(decrement.props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(decrement);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('en el máximo el botón + está deshabilitado y no emite cambios', () => {
    const onChange = jest.fn();
    render(<QuantityStepper value={5} max={5} onChange={onChange} />);
    const increment = screen.getByTestId('qty-increment');
    expect(increment.props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(increment);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('muestra el value y con max=0 queda todo deshabilitado', () => {
    render(<QuantityStepper value={0} max={0} onChange={jest.fn()} />);
    expect(screen.getByTestId('qty-value').props.children).toBe(0);
    expect(screen.getByTestId('qty-decrement').props.accessibilityState).toMatchObject({
      disabled: true,
    });
    expect(screen.getByTestId('qty-increment').props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });
});
