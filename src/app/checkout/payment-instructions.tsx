import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Image } from '@/components/ui/Image';
import { formatMXN } from '@/core/utils/format-currency';
import { useCheckoutStore } from '@/stores/checkout-store';

import type { PaymentInstructions, PaymentInstructionsResult } from '@/core/models/checkout.model';

const PAID_STATUSES = new Set(['paid', 'completed', 'succeeded']);
const EXPIRED_STATUSES = new Set(['expired', 'cancelled', 'canceled', 'rejected', 'refunded']);

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function isPastDue(dueAt: string | null | undefined): boolean {
  if (!dueAt) return false;
  const parsed = Date.parse(dueAt);
  return !Number.isNaN(parsed) && parsed < Date.now();
}

function formatDue(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function methodOf(data: PaymentInstructionsResult): string {
  return normalize(data.paymentMethod ?? data.paymentInstructions?.method);
}

function referenceOf(instructions: PaymentInstructions | null): string | null {
  return instructions?.reference ?? instructions?.oxxoReference ?? null;
}

function recipientOf(instructions: PaymentInstructions | null): string | null {
  return (
    instructions?.recipientName ?? instructions?.accountHolder ?? instructions?.supplierName ?? null
  );
}

interface CopyFieldProps {
  label: string;
  value: string;
  testID: string;
  copyTestID: string;
  onCopy: (label: string, value: string) => void;
}

function CopyField({ label, value, testID, copyTestID, onCopy }: CopyFieldProps) {
  return (
    <View className="mb-brand-2 flex-row items-center justify-between">
      <View className="flex-1 pr-brand-2">
        <Text className="text-xs text-brand-dark/60">{label}</Text>
        <Text testID={testID} selectable className="font-brand-bold text-base text-brand-dark">
          {value}
        </Text>
      </View>
      <Button
        testID={copyTestID}
        label="Copiar"
        variant="secondary"
        onPress={() => onCopy(label, value)}
      />
    </View>
  );
}

export default function PaymentInstructionsScreen() {
  const router = useRouter();
  const { orderNumber, email } = useLocalSearchParams<{ orderNumber?: string; email?: string }>();

  const data = useCheckoutStore((s) => s.paymentInstructions);
  const status = useCheckoutStore((s) => s.instructionsStatus);
  const error = useCheckoutStore((s) => s.instructionsError);
  const copiedLabel = useCheckoutStore((s) => s.copiedLabel);
  const clipboardError = useCheckoutStore((s) => s.clipboardError);
  const fetchPaymentInstructions = useCheckoutStore((s) => s.fetchPaymentInstructions);
  const copyToClipboard = useCheckoutStore((s) => s.copyToClipboard);

  const hasParams = Boolean(orderNumber && email);

  useEffect(() => {
    if (!orderNumber || !email) return;
    void fetchPaymentInstructions(orderNumber, email);
  }, [orderNumber, email, fetchPaymentInstructions]);

  if (!hasParams) {
    return (
      <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
        <EmptyState
          testID="payment-instructions-empty"
          title="Sin instrucciones de pago"
          subtitle="Abre esta pantalla desde la confirmación de un pedido OXXO o SPEI."
        />
      </SafeAreaView>
    );
  }

  if (status === 'loading' || status === 'idle') {
    return (
      <SafeAreaView
        className="flex-1 bg-brand-medium"
        edges={['top', 'left', 'right']}
        testID="payment-instructions-loading"
      />
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
        <ErrorState
          testID="payment-instructions-error"
          title="No pudimos cargar tus instrucciones"
          subtitle={error ?? 'Intenta de nuevo en unos momentos.'}
          onRetry={() => {
            if (orderNumber && email) void fetchPaymentInstructions(orderNumber, email);
          }}
        />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
        <EmptyState
          testID="payment-instructions-empty"
          title="Sin instrucciones de pago"
          subtitle="No encontramos instrucciones para este pedido."
        />
      </SafeAreaView>
    );
  }

  const method = methodOf(data);
  const instructions = data.paymentInstructions;
  const paid = PAID_STATUSES.has(normalize(data.paymentStatus));
  const expired =
    EXPIRED_STATUSES.has(normalize(data.paymentStatus)) ||
    isPastDue(data.paymentDueAt ?? instructions?.dueAt);

  const dueText = formatDue(data.paymentDueAt ?? instructions?.dueAt);
  const amount = data.total ?? instructions?.amount ?? 0;
  const reference = referenceOf(instructions);
  const clabe = instructions?.clabe ?? null;
  const bank = instructions?.bank ?? null;
  const recipient = recipientOf(instructions);

  const onCopy = (label: string, value: string) => {
    void copyToClipboard(label, value);
  };

  const renderMethod = () => {
    if (method === 'spei') {
      return (
        <View className="mb-brand-4 rounded-brand-lg bg-brand-white p-brand-4">
          <Text className="mb-brand-3 font-brand-bold text-base text-brand-dark">
            Transferencia SPEI
          </Text>
          {clabe ? (
            <CopyField
              label="CLABE"
              value={clabe}
              testID="payment-instructions-clabe"
              copyTestID="payment-instructions-copy-clabe"
              onCopy={onCopy}
            />
          ) : null}
          {bank ? (
            <View className="mb-brand-2">
              <Text className="text-xs text-brand-dark/60">Banco</Text>
              <Text testID="payment-instructions-bank" className="font-brand text-base text-brand-dark">
                {bank}
              </Text>
            </View>
          ) : null}
          {recipient ? (
            <View className="mb-brand-2">
              <Text className="text-xs text-brand-dark/60">Titular</Text>
              <Text
                testID="payment-instructions-recipient"
                className="font-brand text-base text-brand-dark"
              >
                {recipient}
              </Text>
            </View>
          ) : null}
        </View>
      );
    }

    if (method === 'oxxo') {
      return (
        <View className="mb-brand-4 rounded-brand-lg bg-brand-white p-brand-4">
          <Text className="mb-brand-3 font-brand-bold text-base text-brand-dark">
            Pago en OXXO
          </Text>
          {reference ? (
            <CopyField
              label="Referencia"
              value={reference}
              testID="payment-instructions-reference"
              copyTestID="payment-instructions-copy-reference"
              onCopy={onCopy}
            />
          ) : null}
          {instructions?.barcodeUrl ? (
            <Image
              testID="payment-instructions-barcode"
              source={instructions.barcodeUrl}
              width={240}
              height={120}
              contentFit="contain"
              accessibilityLabel="Código de barras para pago en OXXO"
            />
          ) : null}
        </View>
      );
    }

    return (
      <View className="mb-brand-4 rounded-brand-lg bg-brand-white p-brand-4">
        <Text testID="payment-instructions-generic" className="font-brand text-base text-brand-dark">
          {instructions?.instructions ?? 'Sigue las instrucciones de pago de tu pedido.'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      className="flex-1 bg-brand-medium"
      edges={['top', 'left', 'right']}
      testID="payment-instructions"
    >
      <ScrollView contentContainerClassName="p-brand-4">
        <Text className="mb-brand-1 text-[22px] font-brand-bold text-brand-dark">
          Instrucciones de pago
        </Text>
        <Text className="mb-brand-4 font-brand text-sm text-brand-dark/70">
          Pedido {data.orderNumber}
        </Text>

        {paid ? (
          <View
            testID="payment-instructions-paid"
            className="rounded-brand-lg border border-brand-success/40 bg-brand-white p-brand-4"
          >
            <Text className="font-brand-bold text-base text-brand-success">Pago confirmado</Text>
            <Text className="mt-1 font-brand text-sm text-brand-dark/70">
              Ya recibimos tu pago. No necesitas hacer nada más.
            </Text>
          </View>
        ) : expired ? (
          <View
            testID="payment-instructions-expired"
            className="rounded-brand-lg border border-brand-danger/40 bg-brand-white p-brand-4"
          >
            <Text className="font-brand-bold text-base text-brand-danger">
              Instrucciones vencidas
            </Text>
            <Text className="mt-1 font-brand text-sm text-brand-dark/70">
              El plazo de pago terminó. Vuelve a solicitar tu pedido para generar nuevas
              instrucciones.
            </Text>
          </View>
        ) : (
          <>
            {renderMethod()}

            <View className="mb-brand-4 rounded-brand-lg bg-brand-white p-brand-4">
              <View className="mb-brand-2 flex-row justify-between">
                <Text className="font-brand text-sm text-brand-dark">Monto</Text>
                <Text
                  testID="payment-instructions-amount"
                  className="font-brand-bold text-base text-brand-primary"
                >
                  {formatMXN(amount)}
                </Text>
              </View>
              {dueText ? (
                <View className="flex-row justify-between">
                  <Text className="font-brand text-sm text-brand-dark">Vence</Text>
                  <Text testID="payment-instructions-due" className="font-brand text-sm text-brand-dark">
                    {dueText}
                  </Text>
                </View>
              ) : null}
            </View>

            {copiedLabel ? (
              <Text
                testID="payment-instructions-copied"
                accessibilityRole="alert"
                className="mb-brand-2 text-sm text-brand-success"
              >
                {`Copiado: ${copiedLabel}`}
              </Text>
            ) : null}

            {clipboardError ? (
              <Text
                testID="payment-instructions-clipboard-error"
                accessibilityRole="alert"
                className="mb-brand-2 text-sm text-brand-danger"
              >
                {clipboardError}
              </Text>
            ) : null}

            {data.paymentProofSubmittedAt ? (
              <Text testID="payment-instructions-proof-submitted" className="mb-brand-2 text-sm text-brand-dark/70">
                Comprobante enviado. Estamos revisando tu pago.
              </Text>
            ) : null}

            <Button
              testID="payment-instructions-proof-cta"
              label="Enviar comprobante"
              onPress={() => router.push('/checkout/payment-proof')}
              className="mb-brand-2"
            />
            <Pressable
              testID="payment-instructions-back"
              accessibilityRole="button"
              onPress={() => router.back()}
              className="items-center py-brand-2"
            >
              <Text className="font-brand text-sm text-brand-primary">Volver</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
