import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthError } from '@/core/models/auth';
import { useAuthStore } from '@/stores/auth-store';
import { brandColors } from '@/theme/tokens';

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    try {
      await register({ name, email, password, password_confirmation: passwordConfirmation });
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Error desconocido');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
      <View className="flex-1 px-brand-6 justify-center">
        <Text className="text-[22px] font-bold text-brand-dark mb-brand-6">Crear cuenta</Text>
        <View className="mb-brand-4">
          <Text className="text-sm text-brand-dark mb-1.5">Nombre</Text>
          <TextInput
            className="bg-brand-white border border-neutral-300 rounded-brand-md px-3 py-2.5 text-base text-brand-dark"
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            placeholderTextColor={brandColors.dark}
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
            placeholderTextColor={brandColors.dark}
            autoCapitalize="none"
            keyboardType="email-address"
            testID="register-email"
          />
        </View>
        <View className="mb-brand-4">
          <Text className="text-sm text-brand-dark mb-1.5">Contraseña</Text>
          <TextInput
            className="bg-brand-white border border-neutral-300 rounded-brand-md px-3 py-2.5 text-base text-brand-dark"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={brandColors.dark}
            secureTextEntry
            testID="register-password"
          />
        </View>
        <View className="mb-brand-4">
          <Text className="text-sm text-brand-dark mb-1.5">Confirmar contraseña</Text>
          <TextInput
            className="bg-brand-white border border-neutral-300 rounded-brand-md px-3 py-2.5 text-base text-brand-dark"
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
            placeholderTextColor={brandColors.dark}
            secureTextEntry
            testID="register-password-confirmation"
          />
        </View>
        {error ? <Text className="text-red-600 mb-3" accessibilityRole="alert">{error}</Text> : null}
        <Pressable className="bg-brand-primary py-3.5 rounded-brand-md items-center mt-2 active:opacity-85" onPress={onSubmit} testID="register-submit">
          <Text className="text-brand-white text-base font-bold">Registrarme</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} className="items-center mt-brand-4">
          <Text className="text-brand-primary text-sm">¿Ya tienes cuenta? Inicia sesión</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
