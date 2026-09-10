import { ActivityIndicator, Pressable, Text } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  className?: string;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-brand-primary',
  secondary: 'bg-white border border-brand-dark/30',
  ghost: 'bg-transparent',
};

const LABEL_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-brand-dark',
  ghost: 'text-brand-primary',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  testID,
  accessibilityLabel,
  className = '',
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      testID={testID ?? 'button'}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={`${VARIANT_CLASSES[variant]} rounded-lg px-6 py-3 active:opacity-80 flex-row justify-center items-center ${className} ${isDisabled ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : 'brand-primary'} />
      ) : (
        <Text className={`font-brand-bold text-base ${LABEL_VARIANT_CLASSES[variant]}`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
