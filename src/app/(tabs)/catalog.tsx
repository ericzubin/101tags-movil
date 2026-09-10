import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CatalogTab() {
  return (
    <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
      <View className="flex-1 items-center justify-center p-brand-6">
        <Text className="font-brand-bold text-2xl text-brand-dark mb-2">Catálogo</Text>
        <Text className="font-brand text-base text-brand-dark text-center">
          Próximamente — Fase 2
        </Text>
      </View>
    </SafeAreaView>
  );
}
