import { Pressable, Text, View } from 'react-native';

import type { ProductVariantSummary } from '@/core/models/catalog.model';

import { availableColors, availableSizes, isSelectable } from './variant-logic';

export interface VariantSelectorProps {
  variants: ProductVariantSummary[];
  selectedSize: string | null;
  selectedColor: string | null;
  onSelectSize: (size: string) => void;
  onSelectColor: (color: string) => void;
}

export function VariantSelector({
  variants,
  selectedSize,
  selectedColor,
  onSelectSize,
  onSelectColor,
}: VariantSelectorProps) {
  const sizes = unique(variants.map((v) => v.size).filter((s): s is string => !!s));
  const colors = unique(variants.map((v) => v.color).filter((c): c is string => !!c));
  const inStockSizes = availableSizes(variants);
  const inStockColors = availableColors(variants);

  const isSizeDisabled = (size: string) =>
    selectedColor === null
      ? !inStockSizes.includes(size)
      : !isSelectable(variants, size, selectedColor);

  const isColorDisabled = (color: string) =>
    selectedSize === null
      ? !inStockColors.includes(color)
      : !isSelectable(variants, selectedSize, color);

  return (
    <View>
      {sizes.length > 0 ? (
        <View className="mb-4">
          <Text className="font-brand-bold mb-2 text-sm text-brand-dark">Talla</Text>
          <View className="flex-row flex-wrap gap-2">
            {sizes.map((size) => {
              const selected = selectedSize === size;
              const disabled = isSizeDisabled(size);
              return (
                <Pressable
                  key={size}
                  testID={`variant-size-${size}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Talla ${size}`}
                  accessibilityState={{ selected, disabled }}
                  disabled={disabled}
                  onPress={() => onSelectSize(size)}
                  className={`rounded-brand-pill border px-4 py-2 ${
                    selected
                      ? 'border-brand-primary bg-brand-primary'
                      : 'border-brand-dark/20 bg-white'
                  } ${disabled ? 'opacity-40' : ''}`}
                >
                  <Text
                    className={`font-brand text-sm ${selected ? 'text-white' : 'text-brand-dark'}`}
                  >
                    {size}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {colors.length > 0 ? (
        <View className="mb-4">
          <Text className="font-brand-bold mb-2 text-sm text-brand-dark">Color</Text>
          <View className="flex-row flex-wrap gap-2">
            {colors.map((color) => {
              const selected = selectedColor === color;
              const disabled = isColorDisabled(color);
              return (
                <Pressable
                  key={color}
                  testID={`variant-color-${color}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Color ${color}`}
                  accessibilityState={{ selected, disabled }}
                  disabled={disabled}
                  onPress={() => onSelectColor(color)}
                  className={`rounded-brand-pill border px-4 py-2 ${
                    selected
                      ? 'border-brand-primary bg-brand-primary'
                      : 'border-brand-dark/20 bg-white'
                  } ${disabled ? 'opacity-40' : ''}`}
                >
                  <Text
                    className={`font-brand text-sm ${selected ? 'text-white' : 'text-brand-dark'}`}
                  >
                    {color}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
