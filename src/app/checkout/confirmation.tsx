import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatMXN } from '@/core/utils/format-currency';
import { useCheckoutStore } from '@/stores/checkout-store';

const MANUAL_PAYMENT_METHODS = new Set(['oxxo', 'spei']);

export default function ConfirmationScreen() {
  const router = useRouter();
  const result = useCheckoutStore((s) => s.submission.result);
  const lastCustomerEmail = useCheckoutStore((s) => s.lastCustomerEmail);

  if (!result) {
    return (
      <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
        <EmptyState
          testID="confirmation-empty"
          title="Sin pedido reciente"
          subtitle="Cuando solicites tus pedidos verás aquí la confirmación."
          actionLabel="Seguir comprando"
          onAction={() => router.replace('/(tabs)')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-brand-medium"
      edges={['top', 'left', 'right']}
      testID="checkout-confirmation"
    >
      <ScrollView contentContainerClassName="p-brand-4">
        <Text className="mb-brand-2 text-[22px] font-brand-bold text-brand-dark">
          ¡Pedidos solicitados!
        </Text>
        <Text className="mb-brand-4 font-brand text-base text-brand-dark/70">{result.message}</Text>

        <View className="mb-brand-4 rounded-brand-lg bg-brand-white p-brand-4">
          <Text className="text-sm text-brand-dark/60">Número de compra</Text>
          <Text
            testID="confirmation-purchase-number"
            className="font-brand-bold text-lg text-brand-primary"
          >
            {result.purchaseNumber}
          </Text>
        </View>

        <View testID="confirmation-orders" className="mb-brand-4">
          {result.orders.map((order) => (
            <View
              key={order.orderNumber}
              testID={`confirmation-order-${order.orderNumber}`}
              className="mb-brand-3 rounded-brand-lg bg-brand-white p-brand-4"
            >
              <View className="flex-row justify-between">
                <Text className="font-brand-bold text-base text-brand-dark">{order.orderNumber}</Text>
                <Text className="font-brand-bold text-base text-brand-dark">
                  {formatMXN(order.total)}
                </Text>
              </View>
              <Text className="mt-1 font-brand text-sm text-brand-dark/60">{order.status}</Text>

              {MANUAL_PAYMENT_METHODS.has((order.paymentMethod ?? '').toLowerCase()) ? (
                <Button
                  testID={`confirmation-instructions-${order.orderNumber}`}
                  label="Ver instrucciones de pago"
                  variant="secondary"
                  className="mt-brand-3"
                  onPress={() =>
                    router.push({
                      pathname: '/checkout/payment-instructions',
                      params: { orderNumber: order.orderNumber, email: lastCustomerEmail ?? '' },
                    })
                  }
                />
              ) : null}
            </View>
          ))}
        </View>

        <Button
          testID="confirmation-continue"
          label="Seguir comprando"
          variant="secondary"
          onPress={() => router.replace('/(tabs)')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
