import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCheckoutStore } from '@/stores/checkout-store';

import type { PaymentProofAsset } from '@/core/models/checkout.model';

function formatSize(bytes: number | null | undefined): string | null {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) return null;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export default function PaymentProofScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderNumber?: string; email?: string }>();
  const storeOrderNumber = useCheckoutStore((s) => s.paymentInstructions?.orderNumber);
  const storeEmail = useCheckoutStore((s) => s.lastCustomerEmail);
  const proof = useCheckoutStore((s) => s.proof);
  const submitProof = useCheckoutStore((s) => s.submitProof);

  const [asset, setAsset] = useState<PaymentProofAsset | null>(null);

  const orderNumber = params.orderNumber ?? storeOrderNumber ?? null;
  const email = params.email ?? storeEmail ?? null;

  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    // AC5 — cancel is a no-op: keep the previous selection untouched.
    if (result.canceled || !result.assets?.length) return;

    const picked = result.assets[0];
    setAsset({
      uri: picked.uri,
      name: picked.name,
      type: picked.mimeType ?? null,
      size: picked.size ?? null,
    });
  };

  const submit = () => {
    if (!asset || !orderNumber || !email) return;
    void submitProof(orderNumber, email, asset);
  };

  if (!orderNumber || !email) {
    return (
      <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
        <EmptyState
          testID="payment-proof-empty"
          title="Sin pedido para comprobante"
          subtitle="Abre esta pantalla desde las instrucciones de pago de un pedido manual."
          actionLabel="Volver"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  if (proof.status === 'success') {
    return (
      <SafeAreaView
        className="flex-1 bg-brand-medium"
        edges={['top', 'left', 'right']}
        testID="payment-proof-success"
      >
        <ScrollView contentContainerClassName="p-brand-4">
          <Text className="mb-brand-3 text-[22px] font-brand-bold text-brand-dark">
            Comprobante enviado
          </Text>
          <Text className="mb-brand-4 font-brand text-base text-brand-dark/70">
            Estamos revisando tu pago. Te avisaremos cuando el proveedor lo valide.
          </Text>
          <Button
            testID="payment-proof-back"
            label="Volver"
            variant="secondary"
            onPress={() => router.back()}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const sizeLabel = formatSize(asset?.size);

  return (
    <SafeAreaView
      className="flex-1 bg-brand-medium"
      edges={['top', 'left', 'right']}
      testID="payment-proof"
    >
      <ScrollView contentContainerClassName="p-brand-4">
        <Text className="mb-brand-1 text-[22px] font-brand-bold text-brand-dark">
          Enviar comprobante
        </Text>
        <Text className="mb-brand-4 font-brand text-sm text-brand-dark/70">Pedido {orderNumber}</Text>

        <View className="mb-brand-4 rounded-brand-lg bg-brand-white p-brand-4">
          <Text className="mb-brand-1 font-brand-bold text-base text-brand-dark">
            Comprobante de pago
          </Text>
          <Text className="mb-brand-3 font-brand text-sm text-brand-dark/70">
            Formatos permitidos: JPG, PNG, WEBP o PDF. Máximo 8 MB.
          </Text>

          <Button
            testID="payment-proof-pick"
            label="Seleccionar archivo"
            variant="secondary"
            onPress={() => void pick()}
          />

          {asset ? (
            <View className="mt-brand-3">
              <Text testID="payment-proof-file-name" className="font-brand text-base text-brand-dark">
                {asset.name}
              </Text>
              {sizeLabel ? (
                <Text testID="payment-proof-file-size" className="font-brand text-sm text-brand-dark/60">
                  {sizeLabel}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {proof.error ? (
          <Text
            testID="payment-proof-error"
            accessibilityRole="alert"
            className="mb-brand-3 text-sm text-brand-danger"
          >
            {proof.error}
          </Text>
        ) : null}

        {proof.status === 'error' ? (
          <Button testID="payment-proof-retry" label="Reintentar" onPress={submit} />
        ) : (
          <Button
            testID="payment-proof-submit"
            label="Enviar comprobante"
            onPress={submit}
            disabled={!asset}
            loading={proof.status === 'submitting'}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
