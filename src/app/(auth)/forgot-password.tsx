import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/core/services/auth-service';
import { brandColors } from '@/theme/tokens';

const INVALID_EMAIL_MESSAGE = 'Ingresa un correo electrónico válido.';
const NETWORK_ERROR_MESSAGE =
  'No pudimos enviar el correo. Revisa tu conexión e inténtalo de nuevo.';
const GENERIC_SUCCESS_MESSAGE =
  'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    setError(null);

    const trimmed = email.trim();
    if (!EMAIL_REGEX.test(trimmed)) {
      setError(INVALID_EMAIL_MESSAGE);
      return;
    }

    setSubmitting(true);
    try {
      await authService.forgotPassword(trimmed);
      setSuccess(true);
    } catch {
      setError(NETWORK_ERROR_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView
        className="flex-1 bg-brand-medium"
        edges={['top', 'left', 'right']}
      >
        <View className="flex-1 items-center justify-center p-brand-6">
          <Text className="font-extrabold text-2xl text-brand-dark mb-brand-4">
            Revisa tu correo
          </Text>
          <Text
            className="text-base text-brand-dark text-center mb-brand-6"
            accessibilityRole="text"
          >
            {GENERIC_SUCCESS_MESSAGE}
          </Text>
          <Pressable
            onPress={() => router.replace('/(auth)/login')}
            className="bg-brand-primary px-6 py-3 rounded-brand-md active:opacity-85"
            accessibilityRole="button"
            accessibilityLabel="Volver a iniciar sesión"
            accessibilityHint="Regresa a la pantalla de inicio de sesión"
            testID="forgot-back-to-login"
          >
            <Text className="text-brand-white text-base font-bold">Volver a iniciar sesión</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
      <View className="flex-1 px-brand-6 justify-center">
        <Text className="text-[22px] font-bold text-brand-dark mb-2">
          ¿Olvidaste tu contraseña?
        </Text>
        <Text className="text-sm text-brand-dark mb-brand-6">
          Te enviaremos un enlace para restablecerla.
        </Text>

        <View className="mb-brand-4">
          <Text className="text-sm text-brand-dark mb-1.5">Correo electrónico</Text>
          <TextInput
            className="bg-brand-white border border-neutral-300 rounded-brand-md px-3 py-2.5 text-base text-brand-dark"
            placeholder="tu@correo.com"
            placeholderTextColor={brandColors.dark}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError(null);
            }}
            editable={!submitting}
            accessibilityLabel="Correo electrónico"
            accessibilityHint="Escribe el correo de tu cuenta para enviarte el enlace"
            testID="forgot-email-input"
          />
          {error ? (
            <Text
              className="text-xs text-brand-danger mt-1"
              accessibilityRole="alert"
              testID="forgot-error"
            >
              {error}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          className={`bg-brand-primary py-3.5 rounded-brand-md items-center mt-2 ${submitting ? 'opacity-70' : 'active:opacity-85'}`}
          accessibilityRole="button"
          accessibilityLabel="Enviar enlace de recuperación"
          accessibilityHint="Toca para enviar el enlace de recuperación a tu correo"
          accessibilityState={{ busy: submitting, disabled: submitting }}
          testID="forgot-submit"
        >
          {submitting ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator color={brandColors.white} size="small" />
              <Text className="text-brand-white text-base font-bold ml-2">Enviando…</Text>
            </View>
          ) : (
            <Text className="text-brand-white text-base font-bold">Enviar enlace</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          disabled={submitting}
          className="items-center mt-brand-4"
          accessibilityRole="link"
          accessibilityLabel="Volver a iniciar sesión"
          accessibilityHint="Regresa sin enviar la solicitud"
          testID="forgot-back"
        >
          <Text className="text-brand-dark text-sm">Volver</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
