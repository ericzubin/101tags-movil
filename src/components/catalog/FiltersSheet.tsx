import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import type { FilterOptions } from '@/core/models/catalog.model';
import { brandColors } from '@/theme/tokens';

export interface FiltersValue {
  sizes: string[];
  colors: string[];
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  onSale?: boolean;
}

export interface FiltersSheetProps {
  visible: boolean;
  options: FilterOptions | null;
  value: FiltersValue;
  loading?: boolean;
  onApply: (value: FiltersValue) => void;
  onClear: () => void;
  onClose: () => void;
  testID?: string;
}

export const EMPTY_FILTERS: FiltersValue = { sizes: [], colors: [] };

function toggle(list: string[], item: string): string[] {
  return list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item];
}

function parsePrice(text: string): number | undefined {
  const cleaned = text.replace(/[^0-9.]/g, '');
  if (cleaned === '') return undefined;
  const value = Number(cleaned);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

export function FiltersSheet({
  visible,
  options,
  value,
  loading = false,
  onApply,
  onClear,
  onClose,
  testID,
}: FiltersSheetProps) {
  const [draft, setDraft] = useState<FiltersValue>(value);
  const wasVisible = useRef(false);

  useEffect(() => {
    if (visible && !wasVisible.current) {
      setDraft(value);
    }
    wasVisible.current = visible;
  }, [visible, value]);

  const priceMin = options?.priceMin ?? 0;
  const priceMax = options?.priceMax ?? 0;
  const mid = Math.round((priceMin + priceMax) / 2);
  const hasRange = priceMax > priceMin && priceMin > 0;

  const handleClear = () => {
    setDraft(EMPTY_FILTERS);
    onClear();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" testID={testID ?? 'filters-sheet'}>
        <Pressable
          testID="filters-sheet-backdrop"
          accessibilityRole="button"
          accessibilityLabel="Cerrar filtros"
          onPress={onClose}
          className="absolute inset-0 bg-black/40"
        />
        <View className="max-h-[85%] rounded-t-brand-lg bg-white">
          <View className="flex-row items-center justify-between border-b border-brand-dark/10 px-brand-4 py-brand-3">
            <Text className="font-brand-bold text-lg text-brand-dark">Filtros</Text>
            <Pressable
              testID="filters-sheet-close"
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              onPress={onClose}
              className="active:opacity-80"
            >
              <Ionicons name="close" size={22} color={brandColors.dark} />
            </Pressable>
          </View>

          <ScrollView className="px-brand-4" contentContainerClassName="pb-brand-4">
            {loading && !options ? (
              <ActivityIndicator
                testID="filters-sheet-loading"
                color={brandColors.primary}
                className="my-brand-6"
              />
            ) : null}

            {options ? (
              <>
                <Text className="mt-brand-4 mb-brand-2 font-brand-bold text-base text-brand-dark">
                  Tallas
                </Text>
                <View className="flex-row flex-wrap">
                  {options.sizes.map((size) => {
                    const selected = draft.sizes.includes(size);
                    return (
                      <Pressable
                        key={size}
                        testID={`filter-size-${size}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => setDraft((d) => ({ ...d, sizes: toggle(d.sizes, size) }))}
                        className={`mb-brand-2 mr-brand-2 rounded-brand-pill border border-brand-dark/20 px-brand-4 py-brand-2 ${
                          selected ? 'bg-brand-primary' : 'bg-white'
                        }`}
                      >
                        <Text
                          className={`font-brand text-sm ${
                            selected ? 'text-white' : 'text-brand-dark'
                          }`}
                        >
                          {size}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text className="mt-brand-4 mb-brand-2 font-brand-bold text-base text-brand-dark">
                  Colores
                </Text>
                <View className="flex-row flex-wrap">
                  {options.colors.map((color) => {
                    const selected = draft.colors.includes(color);
                    return (
                      <Pressable
                        key={color}
                        testID={`filter-color-${color}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => setDraft((d) => ({ ...d, colors: toggle(d.colors, color) }))}
                        className={`mb-brand-2 mr-brand-2 rounded-brand-pill border border-brand-dark/20 px-brand-4 py-brand-2 ${
                          selected ? 'bg-brand-primary' : 'bg-white'
                        }`}
                      >
                        <Text
                          className={`font-brand text-sm ${
                            selected ? 'text-white' : 'text-brand-dark'
                          }`}
                        >
                          {color}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            <Text className="mt-brand-4 mb-brand-2 font-brand-bold text-base text-brand-dark">
              Precio
            </Text>
            <View className="flex-row items-center">
              <TextInput
                testID="filter-price-min"
                value={draft.priceMin !== undefined ? String(draft.priceMin) : ''}
                onChangeText={(text) => setDraft((d) => ({ ...d, priceMin: parsePrice(text) }))}
                keyboardType="numeric"
                placeholder="Mín"
                placeholderTextColor={brandColors.dark}
                accessibilityLabel="Precio mínimo"
                className="mr-brand-3 flex-1 rounded-brand-md border border-brand-dark/20 px-brand-3 py-brand-2 font-brand text-sm text-brand-dark"
              />
              <TextInput
                testID="filter-price-max"
                value={draft.priceMax !== undefined ? String(draft.priceMax) : ''}
                onChangeText={(text) => setDraft((d) => ({ ...d, priceMax: parsePrice(text) }))}
                keyboardType="numeric"
                placeholder="Máx"
                placeholderTextColor={brandColors.dark}
                accessibilityLabel="Precio máximo"
                className="flex-1 rounded-brand-md border border-brand-dark/20 px-brand-3 py-brand-2 font-brand text-sm text-brand-dark"
              />
            </View>

            {hasRange ? (
              <View className="mt-brand-2 flex-row flex-wrap">
                <Pressable
                  testID="filter-price-preset-low"
                  accessibilityRole="button"
                  onPress={() => setDraft((d) => ({ ...d, priceMax: mid }))}
                  className="mb-brand-2 mr-brand-2 rounded-brand-pill bg-brand-medium px-brand-3 py-brand-2 active:opacity-80"
                >
                  <Text className="font-brand text-xs text-brand-dark">Hasta {mid}</Text>
                </Pressable>
                <Pressable
                  testID="filter-price-preset-mid"
                  accessibilityRole="button"
                  onPress={() => setDraft((d) => ({ ...d, priceMin, priceMax }))}
                  className="mb-brand-2 mr-brand-2 rounded-brand-pill bg-brand-medium px-brand-3 py-brand-2 active:opacity-80"
                >
                  <Text className="font-brand text-xs text-brand-dark">
                    {priceMin}–{priceMax}
                  </Text>
                </Pressable>
                <Pressable
                  testID="filter-price-preset-high"
                  accessibilityRole="button"
                  onPress={() => setDraft((d) => ({ ...d, priceMin: mid }))}
                  className="mb-brand-2 rounded-brand-pill bg-brand-medium px-brand-3 py-brand-2 active:opacity-80"
                >
                  <Text className="font-brand text-xs text-brand-dark">Más de {mid}</Text>
                </Pressable>
              </View>
            ) : null}

            <View className="mt-brand-4 flex-row items-center justify-between">
              <Text className="font-brand text-sm text-brand-dark">Solo con stock</Text>
              <Switch
                testID="filter-in-stock"
                value={draft.inStock ?? false}
                onValueChange={(next) => setDraft((d) => ({ ...d, inStock: next }))}
                trackColor={{ true: brandColors.primary, false: brandColors.medium }}
              />
            </View>
            <View className="mt-brand-2 flex-row items-center justify-between">
              <Text className="font-brand text-sm text-brand-dark">En oferta</Text>
              <Switch
                testID="filter-on-sale"
                value={draft.onSale ?? false}
                onValueChange={(next) => setDraft((d) => ({ ...d, onSale: next }))}
                trackColor={{ true: brandColors.primary, false: brandColors.medium }}
              />
            </View>
          </ScrollView>

          <View className="flex-row border-t border-brand-dark/10 px-brand-4 py-brand-3">
            <View className="mr-brand-3 flex-1">
              <Button
                testID="filters-sheet-clear"
                label="Limpiar"
                variant="secondary"
                onPress={handleClear}
              />
            </View>
            <View className="flex-1">
              <Button
                testID="filters-sheet-apply"
                label="Aplicar"
                variant="primary"
                onPress={() => onApply(draft)}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
