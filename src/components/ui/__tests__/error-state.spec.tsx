import { fireEvent, render, screen } from '@testing-library/react-native';

import { ErrorState } from '@/components/ui/ErrorState';

describe('ErrorState', () => {
  it('AC29: renderiza botón "Reintentar" con onRetry cuando se pasa onRetry', () => {
    const onRetry = jest.fn();
    render(<ErrorState onRetry={onRetry} testID="err-29" />);
    expect(screen.getByText('Reintentar')).toBeTruthy();
    const btn = screen.getByTestId('err-29-retry');
    fireEvent.press(btn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renderiza title/subtitle defaults cuando no se pasan props', () => {
    render(<ErrorState />);
    expect(screen.getByText(/Algo salió mal/i)).toBeTruthy();
    expect(screen.getByText(/No pudimos cargar/i)).toBeTruthy();
  });

  it('acepta title/subtitle custom', () => {
    render(<ErrorState title="Custom error" subtitle="Detail" />);
    expect(screen.getByText('Custom error')).toBeTruthy();
    expect(screen.getByText('Detail')).toBeTruthy();
  });

  it('sin onRetry no renderiza botón', () => {
    render(<ErrorState testID="ne2" />);
    expect(screen.queryByTestId('ne2-retry')).toBeNull();
  });
});
