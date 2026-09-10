import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { EMPTY_FILTERS, FiltersSheet } from '@/components/catalog/FiltersSheet';
import type { FilterOptions } from '@/core/models/catalog.model';

const OPTIONS: FilterOptions = {
  sizes: ['S', 'M', 'L'],
  colors: ['Rojo', 'Azul'],
  priceMin: 100,
  priceMax: 300,
  categories: [],
  subcategories: [],
};

function renderSheet(overrides: Partial<React.ComponentProps<typeof FiltersSheet>> = {}) {
  const onApply = jest.fn();
  const onClear = jest.fn();
  const onClose = jest.fn();
  const utils = render(
    <FiltersSheet
      visible
      options={OPTIONS}
      value={EMPTY_FILTERS}
      onApply={onApply}
      onClear={onClear}
      onClose={onClose}
      {...overrides}
    />,
  );
  return { ...utils, onApply, onClear, onClose };
}

describe('FiltersSheet (M2.3 AC15)', () => {
  it('visible=false no renderiza el título ni acciones', () => {
    renderSheet({ visible: false });

    expect(screen.queryByText('Filtros')).toBeNull();
    expect(screen.queryByTestId('filters-sheet-apply')).toBeNull();
  });

  it('visible=true con options renderiza tallas, colores y toggles', () => {
    renderSheet();

    expect(screen.getByText('Filtros')).toBeTruthy();
    expect(screen.getByTestId('filter-size-S')).toBeTruthy();
    expect(screen.getByTestId('filter-size-M')).toBeTruthy();
    expect(screen.getByTestId('filter-size-L')).toBeTruthy();
    expect(screen.getByTestId('filter-color-Rojo')).toBeTruthy();
    expect(screen.getByTestId('filter-color-Azul')).toBeTruthy();
    expect(screen.getByTestId('filter-in-stock')).toBeTruthy();
    expect(screen.getByTestId('filter-on-sale')).toBeTruthy();
  });

  it('multi-toggle de talla/color e inStock y Aplicar entrega el draft', () => {
    const { onApply } = renderSheet();

    fireEvent.press(screen.getByTestId('filter-size-M'));
    fireEvent.press(screen.getByTestId('filter-color-Rojo'));
    fireEvent(screen.getByTestId('filter-in-stock'), 'valueChange', true);
    fireEvent.press(screen.getByTestId('filters-sheet-apply'));

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith({ sizes: ['M'], colors: ['Rojo'], inStock: true });
  });

  it('toggle des-marca un chip ya seleccionado', () => {
    render(
      <FiltersSheet
        visible
        options={OPTIONS}
        value={{ sizes: ['M'], colors: [] }}
        onApply={jest.fn()}
        onClear={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByTestId('filter-size-M').props.accessibilityState.selected).toBe(true);

    fireEvent.press(screen.getByTestId('filter-size-M'));

    expect(screen.getByTestId('filter-size-M').props.accessibilityState.selected).toBe(false);
  });

  it('inputs de precio sanean a número y Aplicar los entrega', () => {
    const { onApply } = renderSheet();

    fireEvent.changeText(screen.getByTestId('filter-price-min'), '150');
    fireEvent.changeText(screen.getByTestId('filter-price-max'), '250');
    fireEvent.press(screen.getByTestId('filters-sheet-apply'));

    expect(onApply).toHaveBeenCalledWith({ sizes: [], colors: [], priceMin: 150, priceMax: 250 });
  });

  it('un input no numérico de precio se ignora', () => {
    const { onApply } = renderSheet();

    fireEvent.changeText(screen.getByTestId('filter-price-min'), 'abc');
    fireEvent.press(screen.getByTestId('filters-sheet-apply'));

    expect(onApply).toHaveBeenCalledWith({ sizes: [], colors: [] });
  });

  it('presets de precio usan el punto medio del rango', () => {
    const { onApply } = renderSheet();

    fireEvent.press(screen.getByTestId('filter-price-preset-low'));
    fireEvent.press(screen.getByTestId('filters-sheet-apply'));

    expect(onApply).toHaveBeenLastCalledWith({ sizes: [], colors: [], priceMax: 200 });
  });

  it('onSale switch y Aplicar lo entrega', () => {
    const { onApply } = renderSheet();

    fireEvent(screen.getByTestId('filter-on-sale'), 'valueChange', true);
    fireEvent.press(screen.getByTestId('filters-sheet-apply'));

    expect(onApply).toHaveBeenCalledWith({ sizes: [], colors: [], onSale: true });
  });

  it('Limpiar llama onClear y vacía el draft', () => {
    const { onApply, onClear } = renderSheet({
      value: { sizes: ['M'], colors: ['Rojo'], priceMin: 10, inStock: true },
    });

    fireEvent.press(screen.getByTestId('filters-sheet-clear'));

    expect(onClear).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByTestId('filters-sheet-apply'));

    expect(onApply).toHaveBeenCalledWith({ sizes: [], colors: [] });
  });

  it('cerrar con X o backdrop llama onClose sin aplicar', () => {
    const first = renderSheet();
    fireEvent.press(screen.getByTestId('filters-sheet-close'));
    expect(first.onClose).toHaveBeenCalledTimes(1);
    expect(first.onApply).not.toHaveBeenCalled();
    first.unmount();

    const second = renderSheet();
    fireEvent.press(screen.getByTestId('filters-sheet-backdrop'));
    expect(second.onClose).toHaveBeenCalledTimes(1);
    expect(second.onApply).not.toHaveBeenCalled();
  });

  it('loading sin options muestra indicador de carga', () => {
    renderSheet({ options: null, loading: true });

    expect(screen.getByTestId('filters-sheet-loading')).toBeTruthy();
    expect(screen.queryByTestId('filter-size-M')).toBeNull();
  });
});
