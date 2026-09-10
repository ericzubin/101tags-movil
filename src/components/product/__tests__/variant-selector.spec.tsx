import { fireEvent, render, screen } from '@testing-library/react-native';

import { VariantSelector } from '@/components/product/VariantSelector';
import type { ProductVariantSummary } from '@/core/models/catalog.model';

function variant(overrides: Partial<ProductVariantSummary>): ProductVariantSummary {
  return {
    id: 1,
    size: 'M',
    color: 'Negro',
    sku: 'SKU-1',
    stock: 5,
    inStock: true,
    price: 100,
    priceOverride: null,
    ...overrides,
  };
}

const variants: ProductVariantSummary[] = [
  variant({ id: 1, size: 'S', color: 'Negro', stock: 3 }),
  variant({ id: 2, size: 'M', color: 'Negro', stock: 0, inStock: false }),
  variant({ id: 3, size: 'M', color: 'Blanco', stock: 5 }),
];

const baseProps = {
  variants,
  selectedSize: null,
  selectedColor: null,
  onSelectSize: jest.fn(),
  onSelectColor: jest.fn(),
};

describe('VariantSelector', () => {
  it('renderiza chips de tallas y colores', () => {
    render(<VariantSelector {...baseProps} />);
    expect(screen.getByTestId('variant-size-S')).toBeTruthy();
    expect(screen.getByTestId('variant-size-M')).toBeTruthy();
    expect(screen.getByTestId('variant-color-Negro')).toBeTruthy();
    expect(screen.getByTestId('variant-color-Blanco')).toBeTruthy();
  });

  it('marca el chip seleccionado con accessibilityState.selected', () => {
    render(<VariantSelector {...baseProps} selectedSize="M" selectedColor="Blanco" />);
    expect(screen.getByTestId('variant-size-M').props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getByTestId('variant-size-S').props.accessibilityState).toMatchObject({
      selected: false,
    });
    expect(screen.getByTestId('variant-color-Blanco').props.accessibilityState).toMatchObject({
      selected: true,
    });
  });

  it('AC5: talla M deshabilitada con Negro (stock 0) y habilitada con Blanco', () => {
    const { rerender } = render(<VariantSelector {...baseProps} selectedColor="Negro" />);
    expect(screen.getByTestId('variant-size-M').props.accessibilityState).toMatchObject({
      disabled: true,
    });

    rerender(<VariantSelector {...baseProps} selectedColor="Blanco" />);
    expect(screen.getByTestId('variant-size-M').props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });

  it('dispara onSelectSize / onSelectColor con la opción elegida', () => {
    const onSelectSize = jest.fn();
    const onSelectColor = jest.fn();
    render(
      <VariantSelector
        {...baseProps}
        selectedColor="Negro"
        onSelectSize={onSelectSize}
        onSelectColor={onSelectColor}
      />,
    );
    fireEvent.press(screen.getByTestId('variant-size-S'));
    expect(onSelectSize).toHaveBeenCalledWith('S');
    fireEvent.press(screen.getByTestId('variant-color-Negro'));
    expect(onSelectColor).toHaveBeenCalledWith('Negro');
  });

  it('no renderiza chips si el producto no tiene variantes', () => {
    render(<VariantSelector {...baseProps} variants={[]} />);
    expect(screen.queryByTestId(/^variant-/)).toBeNull();
  });
});
