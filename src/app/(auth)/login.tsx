import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatAuthError } from '@/core/i18n/errors';
import { AuthError } from '@/core/models/auth';
import { validateLogin } from '@/core/validation/auth';
import { useAuthStore } from '@/stores/auth-store';
import { brandColors } from '@/theme/tokens';

const SUBMITTING_LABEL = 'Entrando…';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);

  const onSubmit = async () => {
    if (isSubmitting) return;

    const result = validateLogin({ email, password });
    if (!result.ok) {
      setFieldErrors(result.fieldErrors);
      setFormError(null);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.code === 'VALIDATION_ERROR' && err.fields) {
          const next: { email?: string; password?: string } = {};
          const emailMsgs = err.fields.email ?? err.fields['correo'];
          if (emailMsgs && emailMsgs.length > 0) next.email = emailMsgs[0];
          const passwordMsgs = err.fields.password ?? err.fields['contraseña'] ?? err.fields['contrasena'];
          if (passwordMsgs && passwordMsgs.length > 0) next.password = passwordMsgs[0];
          setFieldErrors(next);
          if (Object.keys(next).length === 0) setFormError(formatAuthError(err));
          else setFormError(null);
        } else {
          setFormError(formatAuthError(err));
        }
      } else {
        setFormError('Algo salió mal. Intenta de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
      <View className="flex-1 px-brand-6 justify-center">
        <Text className="text-4xl font-extrabold text-brand-primary text-center mb-brand-6">101tags</Text>
        <Text className="text-[22px] font-bold text-brand-dark mb-brand-6">Inicia sesión</Text>

        <View className="mb-brand-4">
          <Text className="text-sm text-brand-dark mb-1.5">Correo electrónico</Text>
          <TextInput
            className="bg-brand-white border border-neutral-300 rounded-brand-md px-3 py-2.5 text-base text-brand-dark"
            placeholder="tu@correo.com"
            placeholderTextColor={brandColors.dark}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
              if (formError) setFormError(null);
            }}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            returnKeyType="next"
            editable={!isSubmitting}
            onSubmitEditing={() => passwordRef.current?.focus()}
            accessibilityLabel="Correo electrónico"
            accessibilityHint="Escribe tu correo electrónico registrado"
            testID="login-email"
          />
          {fieldErrors.email ? (
            <Text
              className="text-xs text-brand-danger mt-1"
              accessibilityRole="alert"
              testID="login-email-error"
            >
              {fieldErrors.email}
            </Text>
          ) : null}
        </View>

        <View className="mb-brand-4">
          <Text className="text-sm text-brand-dark mb-1.5">Contraseña</Text>
          <TextInput
            ref={passwordRef}
            className="bg-brand-white border border-neutral-300 rounded-brand-md px-3 py-2.5 text-base text-brand-dark"
            placeholder="••••••••"
            placeholderTextColor={brandColors.dark}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
              if (formError) setFormError(null);
            }}
            secureTextEntry
            autoComplete="password"
            returnKeyType="go"
            editable={!isSubmitting}
            onSubmitEditing={onSubmit}
            accessibilityLabel="Contraseña"
            accessibilityHint="Escribe tu contraseña"
            testID="login-password"
          />
          {fieldErrors.password ? (
            <Text
              className="text-xs text-brand-danger mt-1"
              accessibilityRole="alert"
              testID="login-password-error"
            >
              {fieldErrors.password}
            </Text>
          ) : null}
        </View>

        {formError ? (
          <Text className="text-red-600 mb-3" accessibilityRole="alert" testID="login-form-error">
            {formError}
          </Text>
        ) : null}

        <Pressable
          className={`bg-brand-primary py-3.5 rounded-brand-md items-center mt-2 ${isSubmitting ? 'opacity-70' : 'active:opacity-85'}`}
          onPress={onSubmit}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Iniciar sesión"
          accessibilityHint="Toca para iniciar sesión con tu correo y contraseña"
          accessibilityState={{ busy: isSubmitting, disabled: isSubmitting }}
          testID="login-submit"
        >
          {isSubmitting ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator color={brandColors.white} size="small" />
              <Text className="text-brand-white text-base font-bold ml-2">{SUBMITTING_LABEL}</Text>
            </View>
          ) : (
            <Text className="text-brand-white text-base font-bold">Entrar</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.push('/(auth)/register')}
          className="items-center mt-brand-4"
          disabled={isSubmitting}
          accessibilityRole="link"
          accessibilityLabel="Ir a registro"
          accessibilityHint="Abre la pantalla para crear una cuenta nueva"
          testID="login-go-register"
        >
          <Text className="text-brand-primary text-sm">¿No tienes cuenta? Regístrate</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
