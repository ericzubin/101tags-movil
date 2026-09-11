import { Pressable, Text, View } from 'react-native';

export interface QuantityStepperProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  testID?: string;
}

export function QuantityStepper({ value, max, onChange, testID }: QuantityStepperProps) {
  const canDecrement = value > 1;
  const canIncrement = value < max;

  return (
    <View className="flex-row items-center" testID={testID ?? 'qty-stepper'}>
      <Pressable
        testID="qty-decrement"
        accessibilityRole="button"
        accessibilityLabel="Disminuir cantidad"
        accessibilityState={{ disabled: !canDecrement }}
        disabled={!canDecrement}
        onPress={() => onChange(Math.max(1, value - 1))}
        className={`h-10 w-10 items-center justify-center rounded-brand-pill border border-brand-dark/20 bg-white ${
          canDecrement ? '' : 'opacity-40'
        }`}
      >
        <Text className="font-brand-bold text-lg text-brand-dark">−</Text>
      </Pressable>

      <Text
        testID="qty-value"
        className="font-brand-bold mx-4 min-w-8 text-center text-lg text-brand-dark"
      >
        {value}
      </Text>

      <Pressable
        testID="qty-increment"
        accessibilityRole="button"
        accessibilityLabel="Aumentar cantidad"
        accessibilityState={{ disabled: !canIncrement }}
        disabled={!canIncrement}
        onPress={() => onChange(Math.min(max, value + 1))}
        className={`h-10 w-10 items-center justify-center rounded-brand-pill border border-brand-dark/20 bg-white ${
          canIncrement ? '' : 'opacity-40'
        }`}
      >
        <Text className="font-brand-bold text-lg text-brand-dark">+</Text>
      </Pressable>
    </View>
  );
}
