import { Text, View } from 'react-native';

import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

export function EmptyState({ title, subtitle, actionLabel, onAction, testID }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-6" testID={testID ?? 'empty-state'}>
      <Text className="font-brand-bold text-xl text-brand-dark text-center mb-2">{title}</Text>
      {subtitle ? (
        <Text className="font-brand text-base text-brand-dark/70 text-center mb-6">{subtitle}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="primary"
          testID={testID ? `${testID}-button` : undefined}
        />
      ) : null}
    </View>
  );
}
