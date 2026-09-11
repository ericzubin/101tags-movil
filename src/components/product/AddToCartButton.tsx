import { Alert } from 'react-native';

import { Button } from '@/components/ui/Button';

export interface AddToCartButtonProps {
  disabled?: boolean;
  onPress?: () => void;
}

export function AddToCartButton({ disabled = false, onPress }: AddToCartButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    Alert.alert('Carrito', 'El carrito llega en la Fase 3.');
  };

  return (
    <Button
      label="Agregar al carrito"
      onPress={handlePress}
      disabled={disabled}
      testID="add-to-cart"
      accessibilityLabel="Agregar al carrito"
    />
  );
}
