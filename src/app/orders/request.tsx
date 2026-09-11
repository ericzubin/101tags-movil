import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { authGuard } from '@/core/navigation/guards';
import { isAuthenticated, useAuthStore } from '@/stores/auth-store';
import { useOrderStore } from '@/stores/order-store';
import { brandColors } from '@/theme/tokens';

const REASON_MAX = 255;
const DESCRIPTION_MAX = 2000;

const REASON_REQUIRED_ERROR = 'Ingresa el motivo.';
const REASON_MAX_ERROR = `El motivo no puede exceder ${REASON_MAX} caracteres.`;
const DESCRIPTION_MAX_ERROR = `La descripción no puede exceder ${DESCRIPTION_MAX} caracteres.`;

type RequestType = 'return' | 'cancellation';

function parseRequestType(value: string | string[] | undefined): RequestType | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'return' || raw === 'cancellation') return raw;
  return null;
}

function normalizeParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default function RequestReturnScreen() {
  const params = useLocalSearchParams<{ orderNumber?: string; type?: string }>();

  const orderNumber = normalizeParam(params.orderNumber);
  const type = parseRequestType(params.type);
  const isCancellation = type === 'cancellation';
  const hasValidLink = orderNumber.length > 0 && type !== null;

  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const returnSubmission = useOrderStore((s) => s.returnSubmission);
  const cancellationSubmission = useOrderStore((s) => s.cancellationSubmission);
  const submitReturn = useOrderStore((s) => s.submitReturn);
  const submitCancellation = useOrderStore((s) => s.submitCancellation);
  const resetReturnSubmission = useOrderStore((s) => s.resetReturnSubmission);
  const resetCancellationSubmission = useOrderStore((s) => s.resetCancellationSubmission);

  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);

  const submission = isCancellation ? cancellationSubmission : returnSubmission;

  useEffect(() => {
    if (isCancellation) resetCancellationSubmission();
    else resetReturnSubmission();
  }, [isCancellation, resetCancellationSubmission, resetReturnSubmission]);

  const authed = isAuthenticated({ token, user });
  const guard = authGuard({ isAuthenticated: authed, isHydrated });

  if (!isHydrated) return null;
  if (guard !== true) return <Redirect href={guard.redirect} />;

  if (!hasValidLink) {
    return (
      <>
        <Stack.Screen options={{ title: 'Enlace inválido' }} />
        <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
          <View className="flex-1 justify-center p-brand-4" testID="request-invalid">
            <Text
              testID="request-invalid-title"
              className="mb-brand-2 text-[22px] font-brand-bold text-brand-dark"
            >
              Enlace inválido
            </Text>
            <Text testID="request-invalid-message" className="mb-brand-4 text-base text-brand-dark/80">
              El enlace de esta solicitud no es válido o está incompleto. Vuelve a tu pedido e
              intenta de nuevo.
            </Text>
            <Button testID="request-invalid-back" label="Volver" onPress={() => router.back()} />
          </View>
        </SafeAreaView>
      </>
    );
  }

  const onSubmit = () => {
    if (submission.status === 'submitting') return;

    const trimmedReason = reason.trim();
    const trimmedDescription = description.trim();

    if (!trimmedReason) {
      setReasonError(REASON_REQUIRED_ERROR);
      return;
    }
    if (trimmedReason.length > REASON_MAX) {
      setReasonError(REASON_MAX_ERROR);
      return;
    }
    if (trimmedDescription.length > DESCRIPTION_MAX) {
      setDescriptionError(DESCRIPTION_MAX_ERROR);
      return;
    }

    setReasonError(null);
    setDescriptionError(null);

    const input = trimmedDescription
      ? { reason: trimmedReason, description: trimmedDescription }
      : { reason: trimmedReason };

    if (isCancellation) void submitCancellation(orderNumber, input);
    else void submitReturn(orderNumber, input);
  };

  const title = isCancellation ? 'Cancelar pedido' : 'Solicitar devolución';

  return (
    <>
      <Stack.Screen options={{ title }} />
      <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
        <ScrollView contentContainerClassName="p-brand-4" testID="request-return">
          <Text className="mb-brand-4 text-[22px] font-brand-bold text-brand-dark">{title}</Text>

          {submission.status === 'success' ? (
            <View className="rounded-brand-lg bg-brand-white p-brand-4" testID="request-success-box">
              <Text testID="request-success" className="font-brand-bold text-base text-brand-success">
                {submission.message}
              </Text>
            </View>
          ) : (
            <>
              {submission.status === 'error' && submission.error ? (
                <View
                  className="mb-brand-4 rounded-brand-lg bg-brand-white p-brand-4"
                  testID="request-error-box"
                >
                  <Text
                    testID="request-error"
                    accessibilityRole="alert"
                    className="font-brand text-sm text-brand-danger"
                  >
                    {submission.error}
                  </Text>
                </View>
              ) : null}

              <View className="mb-brand-4">
                <Text className="mb-1.5 text-sm text-brand-dark">Motivo</Text>
                <TextInput
                  className="rounded-brand-md border border-neutral-300 bg-brand-white px-3 py-2.5 text-base text-brand-dark"
                  value={reason}
                  onChangeText={(text) => {
                    setReason(text);
                    if (reasonError) setReasonError(null);
                  }}
                  placeholder={isCancellation ? '¿Por qué cancelas?' : '¿Por qué devuelves?'}
                  placeholderTextColor={brandColors.dark}
                  maxLength={REASON_MAX}
                  accessibilityLabel="Motivo"
                  testID="request-reason"
                />
                {reasonError ? (
                  <Text
                    testID="request-reason-error"
                    accessibilityRole="alert"
                    className="mt-1 text-xs text-brand-danger"
                  >
                    {reasonError}
                  </Text>
                ) : null}
              </View>

              <View className="mb-brand-4">
                <Text className="mb-1.5 text-sm text-brand-dark">Descripción (opcional)</Text>
                <TextInput
                  className="rounded-brand-md border border-neutral-300 bg-brand-white px-3 py-2.5 text-base text-brand-dark"
                  value={description}
                  onChangeText={(text) => {
                    setDescription(text);
                    if (descriptionError) setDescriptionError(null);
                  }}
                  placeholder="Cuéntanos más (opcional)"
                  placeholderTextColor={brandColors.dark}
                  multiline
                  numberOfLines={4}
                  maxLength={DESCRIPTION_MAX}
                  accessibilityLabel="Descripción"
                  testID="request-description"
                />
                {descriptionError ? (
                  <Text
                    testID="request-description-error"
                    accessibilityRole="alert"
                    className="mt-1 text-xs text-brand-danger"
                  >
                    {descriptionError}
                  </Text>
                ) : null}
              </View>

              <Button
                testID="request-submit"
                label={isCancellation ? 'Cancelar pedido' : 'Solicitar devolución'}
                loading={submission.status === 'submitting'}
                onPress={onSubmit}
              />
            </>
          )}

          <Pressable
            testID="request-back"
            accessibilityRole="button"
            onPress={() => router.back()}
            className="mt-brand-4 items-center py-brand-2"
          >
            <Text className="font-brand text-sm text-brand-primary">Volver</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
