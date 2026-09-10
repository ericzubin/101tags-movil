import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/stores/auth-store';

export default function HomeTab() {
  const user = useAuthStore((s) => s.user);

  return (
    <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
      <View className="flex-1 items-center justify-center p-brand-6">
        <Text className="font-brand-bold text-3xl text-brand-dark mb-2">101tags</Text>
        {user ? (
          <Text className="font-brand text-base text-brand-dark mb-brand-4">
            Bienvenido, {user.name}
          </Text>
        ) : null}
        <Text className="font-brand text-sm text-brand-dark/60 text-center">
          Tu tienda de etiquetas en México
        </Text>
      </View>
    </SafeAreaView>
  );
}
