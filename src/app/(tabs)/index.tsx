import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
      <View className="flex-1 items-center justify-center px-brand-6">
        <Text className="text-5xl font-extrabold text-brand-primary mb-2">
          101tags
        </Text>
        <Text className="text-base text-brand-dark mb-brand-7">
          Compra local, compra fácil
        </Text>
        <View className="bg-brand-white p-brand-6 rounded-brand-lg w-full max-w-[480px] shadow-sm">
          <Text className="text-xl font-bold text-brand-dark mb-2">Bienvenido</Text>
          <Text className="text-sm text-brand-dark leading-5">
            Esta es la pantalla de inicio del cliente móvil 101tags. Aquí se mostrarán
            categorías, productos destacados y banners cuando se implemente F2.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}