import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Login screen — scaffold M0.4-PIVOT refactorizado a Nativewind v4
 * en M0.5-PIVOT. Functional login lands in M1.3.
 */
export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
      <View className="flex-1 px-brand-6 justify-center">
        <Text className="text-4xl font-extrabold text-brand-primary text-center mb-brand-6">
          101tags
        </Text>
        <Text className="text-[22px] font-bold text-brand-dark mb-brand-6">
          Inicia sesión
        </Text>

        <View className="mb-brand-4">
          <Text className="text-sm text-brand-dark mb-1.5">Correo electrónico</Text>
          <TextInput
            className="bg-brand-white border border-neutral-300 rounded-brand-md px-3 py-2.5 text-base text-brand-dark"
            placeholder="tu@correo.com"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            testID="login-email"
          />
        </View>

        <View className="mb-brand-4">
          <Text className="text-sm text-brand-dark mb-1.5">Contraseña</Text>
          <TextInput
            className="bg-brand-white border border-neutral-300 rounded-brand-md px-3 py-2.5 text-base text-brand-dark"
            placeholder="••••••••"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            testID="login-password"
          />
        </View>

        <Pressable
          className="bg-brand-primary py-3.5 rounded-brand-md items-center mt-2 active:opacity-85"
          onPress={() => router.replace('/(tabs)')}
          testID="login-submit"
        >
          <Text className="text-brand-white text-base font-bold">Entrar</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(auth)/register')}
          className="items-center mt-brand-4"
        >
          <Text className="text-brand-primary text-sm">
            ¿No tienes cuenta? Regístrate
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}