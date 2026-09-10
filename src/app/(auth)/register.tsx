import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatAuthError } from '@/core/i18n/errors';
import { AuthError } from '@/core/models/auth';
import { validateRegister } from '@/core/validation/auth';
import { useAuthStore } from '@/stores/auth-store';
import { brandColors } from '@/theme/tokens';

const SUBMITTING_LABEL = 'Registrando…';

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  passwordConfirmation?: string;
};

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const passwordConfirmationRef = useRef<TextInput>(null);

  const clearFieldError = (key: keyof FieldErrors) => {
    if (!fieldErrors[key] && !formError) return;
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    if (formError) setFormError(null);
  };

  const onSubmit = async () => {
    if (isSubmitting) return;

    const result = validateRegister({ name, email, password, passwordConfirmation });
    if (!result.ok) {
      setFieldErrors(result.fieldErrors);
      setFormError(null);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(true);
    try {
      await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      router.replace('/(tabs)');
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.code === 'VALIDATION_ERROR' && err.fields) {
          const next: FieldErrors = {};
          const nameMsgs = err.fields.name ?? err.fields['nombre'];
          if (nameMsgs && nameMsgs.length > 0) next.name = nameMsgs[0];
          const emailMsgs = err.fields.email ?? err.fields['correo'];
          if (emailMsgs && emailMsgs.length > 0) next.email = emailMsgs[0];
          const passwordMsgs = err.fields.password ?? err.fields['contraseña'] ?? err.fields['contrasena'];
          if (passwordMsgs && passwordMsgs.length > 0) next.password = passwordMsgs[0];
          const confirmMsgs =
            err.fields.password_confirmation ?? err.fields['passwordConfirmation'] ?? err.fields['confirmar_contraseña'];
          if (confirmMsgs && confirmMsgs.length > 0) next.passwordConfirmation = confirmMsgs[0];
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
        <Text className="text-[22px] font-bold text-brand-dark mb-brand-6">Crear cuenta</Text>

        <View className="mb-brand-4">
          <Text className="text-sm text-brand-dark mb-1.5">Nombre</Text>
          <TextInput
            className="bg-brand-white border border-neutral-300 rounded-brand-md px-3 py-2.5 text-base text-brand-dark"
            value={name}
            onChangeText={(text) => {
              setName(text);
              clearFieldError('name');
            }}
            placeholder="Tu nombre"
            placeholderTextColor={brandColors.dark}
            autoComplete="name"
            returnKeyType="next"
            editable={!isSubmitting}
            onSubmitEditing={() => emailRef.current?.focus()}
            accessibilityLabel="Nombre"
            accessibilityHint="Escribe tu nombre completo"
            testID="register-name"
          />
          {fieldErrors.name ? (
            <Text
              className="text-xs text-brand-danger mt-1"
              accessibilityRole="alert"
              testID="register-name-error"
            >
              {fieldErrors.name}
            </Text>
          ) : null}
        </View>

        <View className="mb-brand-4">
          <Text className="text-sm text-brand-dark mb-1.5">Correo electrónico</Text>
          <TextInput
            ref={emailRef}
            className="bg-brand-white border border-neutral-300 rounded-brand-md px-3 py-2.5 text-base text-brand-dark"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              clearFieldError('email');
            }}
            placeholder="tu@correo.com"
            placeholderTextColor={brandColors.dark}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            returnKeyType="next"
            editable={!isSubmitting}
            onSubmitEditing={() => passwordRef.current?.focus()}
            accessibilityLabel="Correo electrónico"
            accessibilityHint="Escribe tu correo electrónico"
            testID="register-email"
          />
          {fieldErrors.email ? (
            <Text
              className="text-xs text-brand-danger mt-1"
              accessibilityRole="alert"
              testID="register-email-error"
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
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearFieldError('password');
            }}
            placeholder="••••••••"
            placeholderTextColor={brandColors.dark}
            secureTextEntry
            autoComplete="password-new"
            returnKeyType="next"
            editable={!isSubmitting}
            onSubmitEditing={() => passwordConfirmationRef.current?.focus()}
            accessibilityLabel="Contraseña"
            accessibilityHint="Elige una contraseña de al menos 8 caracteres"
            testID="register-password"
          />
          {fieldErrors.password ? (
            <Text
              className="text-xs text-brand-danger mt-1"
              accessibilityRole="alert"
              testID="register-password-error"
            >
              {fieldErrors.password}
            </Text>
          ) : null}
        </View>

        <View className="mb-brand-4">
          <Text className="text-sm text-brand-dark mb-1.5">Confirmar contraseña</Text>
          <TextInput
            ref={passwordConfirmationRef}
            className="bg-brand-white border border-neutral-300 rounded-brand-md px-3 py-2.5 text-base text-brand-dark"
            value={passwordConfirmation}
            onChangeText={(text) => {
              setPasswordConfirmation(text);
              clearFieldError('passwordConfirmation');
            }}
            placeholderTextColor={brandColors.dark}
            secureTextEntry
            autoComplete="password-new"
            returnKeyType="go"
            editable={!isSubmitting}
            onSubmitEditing={onSubmit}
            accessibilityLabel="Confirmar contraseña"
            accessibilityHint="Repite la contraseña que acabas de escribir"
            testID="register-password-confirmation"
          />
          {fieldErrors.passwordConfirmation ? (
            <Text
              className="text-xs text-brand-danger mt-1"
              accessibilityRole="alert"
              testID="register-password-confirmation-error"
            >
              {fieldErrors.passwordConfirmation}
            </Text>
          ) : null}
        </View>

        {formError ? (
          <Text className="text-red-600 mb-3" accessibilityRole="alert" testID="register-form-error">
            {formError}
          </Text>
        ) : null}

        <Pressable
          className={`bg-brand-primary py-3.5 rounded-brand-md items-center mt-2 ${isSubmitting ? 'opacity-70' : 'active:opacity-85'}`}
          onPress={onSubmit}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Crear cuenta"
          accessibilityHint="Toca para crear tu cuenta con los datos ingresados"
          accessibilityState={{ busy: isSubmitting, disabled: isSubmitting }}
          testID="register-submit"
        >
          {isSubmitting ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator color={brandColors.white} size="small" />
              <Text className="text-brand-white text-base font-bold ml-2">{SUBMITTING_LABEL}</Text>
            </View>
          ) : (
            <Text className="text-brand-white text-base font-bold">Registrarme</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          className="items-center mt-brand-4"
          disabled={isSubmitting}
          accessibilityRole="link"
          accessibilityLabel="Ir a iniciar sesión"
          accessibilityHint="Regresa a la pantalla de inicio de sesión"
          testID="register-go-login"
        >
          <Text className="text-brand-primary text-sm">¿Ya tienes cuenta? Inicia sesión</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
