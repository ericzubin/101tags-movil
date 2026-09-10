import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Register screen — scaffold M0.4-PIVOT refactorizado a Nativewind v4
 * en M0.5-PIVOT. Functional registration lands in M1.3.
 */
export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
      <View className="flex-1 px-brand-6 justify-center">
        <Text className="text-[22px] font-bold text-brand-dark mb-brand-6">
          Crear cuenta
        </Text>

        <View className="mb-brand-4">
          <Text className="text-sm text-brand-dark mb-1.5">Nombre</Text>
          <TextInput
            className="bg-brand-white border border-neutral-300 rounded-brand-md px-3 py-2.5 text-base text-brand-dark"
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            placeholderTextColor="#999"
            testID="register-name"
          />
        </View>

        <View className="mb-brand-4">
          <Text className="text-sm text-brand-dark mb-1.5">Correo electrónico</Text>
          <TextInput
            className="bg-brand-white border border-neutral-300 rounded-brand-md px-3 py-2.5 text-base text-brand-dark"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@correo.com"
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="email-address"
            testID="register-email"
          />
        </View>

        <View className="mb-brand-4">
          <Text className="text-sm text-brand-dark mb-1.5">
            Contraseña (≥6 caracteres)
          </Text>
          <TextInput
            className="bg-brand-white border border-neutral-300 rounded-brand-md px-3 py-2.5 text-base text-brand-dark"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#999"
            secureTextEntry
            testID="register-password"
          />
        </View>

        <Pressable
          className="bg-brand-primary py-3.5 rounded-brand-md items-center mt-2 active:opacity-85"
          onPress={() => router.replace('/(tabs)')}
          testID="register-submit"
        >
          <Text className="text-brand-white text-base font-bold">Registrarme</Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          className="items-center mt-brand-4"
        >
          <Text className="text-brand-primary text-sm">
            ¿Ya tienes cuenta? Inicia sesión
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}