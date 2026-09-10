import { fireEvent, render, screen } from '@testing-library/react-native';

import { EmptyState } from '@/components/ui/EmptyState';

describe('EmptyState', () => {
  it('AC27: renderiza el title recibido', () => {
    render(<EmptyState title="Sin resultados" />);
    expect(screen.getByText('Sin resultados')).toBeTruthy();
  });

  it('AC28: cuando se pasa actionLabel + onAction, renderiza Button con el label', () => {
    const onAction = jest.fn();
    render(
      <EmptyState
        title="Vacío"
        actionLabel="Reintentar"
        onAction={onAction}
        testID="my-empty"
      />,
    );
    const button = screen.getByTestId('my-empty-button');
    expect(button).toBeTruthy();
    expect(screen.getByText('Reintentar')).toBeTruthy();
    fireEvent.press(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renderiza subtitle cuando se pasa', () => {
    render(<EmptyState title="Vacío" subtitle="No hay datos" />);
    expect(screen.getByText('No hay datos')).toBeTruthy();
  });

  it('sin actionLabel no muestra Button', () => {
    render(<EmptyState title="Solo título" testID="ne" />);
    expect(screen.queryByTestId('ne-button')).toBeNull();
  });
});
