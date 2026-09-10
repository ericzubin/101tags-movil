import { Text, View } from 'react-native';

import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  subtitle?: string;
  retryLabel?: string;
  onRetry?: () => void;
  testID?: string;
}

export function ErrorState({
  title = 'Algo salió mal',
  subtitle = 'No pudimos cargar esta información. Intenta de nuevo.',
  retryLabel = 'Reintentar',
  onRetry,
  testID,
}: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-6" testID={testID ?? 'error-state'}>
      <Text className="font-brand-bold text-xl text-red-600 text-center mb-2">{title}</Text>
      <Text className="font-brand text-base text-brand-dark/70 text-center mb-6">{subtitle}</Text>
      {onRetry ? (
        <Button
          label={retryLabel}
          onPress={onRetry}
          variant="primary"
          testID={`${testID ?? 'error-state'}-retry`}
        />
      ) : null}
    </View>
  );
}
