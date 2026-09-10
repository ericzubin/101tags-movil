import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { SortChips } from '@/components/catalog/SortChips';

describe('SortChips (M2.3 AC14)', () => {
  it('renderiza los 3 chips con sus etiquetas', () => {
    render(<SortChips value="newest" onChange={jest.fn()} />);

    expect(screen.getByTestId('sort-chips')).toBeTruthy();
    expect(screen.getByText('Recientes')).toBeTruthy();
    expect(screen.getByText('Precio ↑')).toBeTruthy();
    expect(screen.getByText('Precio ↓')).toBeTruthy();
  });

  it('marca como seleccionado el chip de value y desmarca los demás', () => {
    render(<SortChips value="newest" onChange={jest.fn()} />);

    expect(screen.getByTestId('sort-newest').props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId('sort-price_asc').props.accessibilityState.selected).toBe(false);
    expect(screen.getByTestId('sort-price_desc').props.accessibilityState.selected).toBe(false);
  });

  it('presionar un chip llama onChange con su SortKey', () => {
    const onChange = jest.fn();
    render(<SortChips value="newest" onChange={onChange} />);

    fireEvent.press(screen.getByTestId('sort-price_desc'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('price_desc');
  });

  it('respeta el testID de contenedor opcional', () => {
    render(<SortChips value="price_asc" onChange={jest.fn()} testID="mi-sort" />);

    expect(screen.getByTestId('mi-sort')).toBeTruthy();
    expect(screen.getByTestId('sort-price_asc').props.accessibilityState.selected).toBe(true);
  });

  it('AC2: cada chip expone accessibilityLabel no vacío', () => {
    render(<SortChips value="newest" onChange={jest.fn()} />);

    expect(screen.getByTestId('sort-newest').props.accessibilityLabel).toBe('Recientes');
    expect(screen.getByTestId('sort-price_asc').props.accessibilityLabel).toBe('Precio ↑');
    expect(screen.getByTestId('sort-price_desc').props.accessibilityLabel).toBe('Precio ↓');
  });
});
