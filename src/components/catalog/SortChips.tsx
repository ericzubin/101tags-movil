import { Pressable, Text, View } from 'react-native';

export type SortKey = 'newest' | 'price_asc' | 'price_desc';

export interface SortChipsProps {
  value: SortKey;
  onChange: (sort: SortKey) => void;
  testID?: string;
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Recientes' },
  { key: 'price_asc', label: 'Precio ↑' },
  { key: 'price_desc', label: 'Precio ↓' },
];

export function SortChips({ value, onChange, testID }: SortChipsProps) {
  return (
    <View testID={testID ?? 'sort-chips'} className="flex-row px-brand-4 py-brand-2">
      {SORT_OPTIONS.map((option) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            testID={`sort-${option.key}`}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.key)}
            className={`mr-brand-2 rounded-brand-pill px-brand-3 py-brand-1 active:opacity-80 ${
              selected ? 'bg-brand-primary' : 'bg-white'
            }`}
          >
            <Text
              className={`font-brand text-sm ${selected ? 'text-white' : 'text-brand-dark'}`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
