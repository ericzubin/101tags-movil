import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SHIPPING_COST } from '@/core/models/checkout.model';
import { formatMXN } from '@/core/utils/format-currency';
import { useAuthStore } from '@/stores/auth-store';
import { selectTotalCount, selectTotalPrice, useCartStore } from '@/stores/cart-store';
import { useCheckoutStore } from '@/stores/checkout-store';
import { brandColors } from '@/theme/tokens';

interface CustomerFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  testID: string;
  placeholder?: string;
  autoCapitalize?: 'none' | 'characters' | 'words' | 'sentences';
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}

function CustomerField({
  label,
  value,
  onChangeText,
  testID,
  placeholder,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
}: CustomerFieldProps) {
  return (
    <View className="mb-brand-3">
      <Text className="text-sm text-brand-dark mb-1.5">{label}</Text>
      <TextInput
        className="bg-brand-white border border-neutral-300 rounded-brand-md px-3 py-2.5 text-base text-brand-dark"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={brandColors.dark}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        accessibilityLabel={label}
        testID={testID}
      />
    </View>
  );
}

export default function ReviewScreen() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const totalCount = useCartStore(selectTotalCount);
  const subtotal = useCartStore(selectTotalPrice);

  const address = useCheckoutStore((s) => s.address);
  const coupon = useCheckoutStore((s) => s.coupon);
  const submission = useCheckoutStore((s) => s.submission);
  const submit = useCheckoutStore((s) => s.submit);

  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');

  useEffect(() => {
    if (!user) return;
    setName((current) => current || user.name);
    setEmail((current) => current || user.email);
    setPhone((current) => current || user.phone || '');
  }, [user]);

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
        <EmptyState
          testID="review-empty"
          title="Tu carrito está vacío"
          subtitle="Agrega productos para continuar con tu compra."
        />
      </SafeAreaView>
    );
  }

  const discountAmount = coupon?.discountAmount ?? 0;
  const shippingDiscount = coupon?.shippingDiscount ?? 0;
  const shipping = Math.max(0, SHIPPING_COST - shippingDiscount);
  const total = Math.max(0, subtotal - discountAmount + shipping);

  const isSubmitting = submission.status === 'submitting';
  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && !isSubmitting;

  const onSubmit = async () => {
    const result = await submit({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
    });
    if (result) router.replace('/checkout/confirmation');
  };

  return (
    <SafeAreaView
      className="flex-1 bg-brand-medium"
      edges={['top', 'left', 'right']}
      testID="checkout-review"
    >
      <ScrollView contentContainerClassName="p-brand-4">
        <Text className="text-[22px] font-brand-bold text-brand-dark mb-brand-4">
          Revisa tu pedido
        </Text>

        <View testID="review-items" className="mb-brand-4 rounded-brand-lg bg-brand-white p-brand-4">
          {items.map((item) => (
            <View
              key={item.variantId}
              testID={`review-item-${item.variantId}`}
              className="mb-brand-2 flex-row justify-between"
            >
              <Text className="flex-1 font-brand text-sm text-brand-dark">
                {`${item.quantity}× ${item.productName}`}
              </Text>
              <Text className="font-brand text-sm text-brand-dark">{formatMXN(item.lineTotal)}</Text>
            </View>
          ))}
        </View>

        <View testID="review-address" className="mb-brand-4 rounded-brand-lg bg-brand-white p-brand-4">
          <Text className="mb-1 text-sm text-brand-dark/60">Dirección de envío</Text>
          <Text className="font-brand text-base text-brand-dark">{address.street}</Text>
          <Text className="font-brand text-sm text-brand-dark/80">
            {[address.neighborhood, address.city, address.state, address.zip]
              .filter(Boolean)
              .join(', ')}
          </Text>
        </View>

        <View className="mb-brand-4 rounded-brand-lg bg-brand-white p-brand-4">
          <Text className="mb-brand-3 font-brand-bold text-base text-brand-dark">
            Datos del cliente
          </Text>
          <CustomerField
            label="Nombre"
            value={name}
            onChangeText={setName}
            testID="review-customer-name"
            placeholder="Nombre completo"
          />
          <CustomerField
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            testID="review-customer-email"
            placeholder="correo@ejemplo.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <CustomerField
            label="Teléfono (opcional)"
            value={phone}
            onChangeText={setPhone}
            testID="review-customer-phone"
            placeholder="55 1234 5678"
            keyboardType="phone-pad"
          />
        </View>

        <View testID="review-summary" className="rounded-brand-lg bg-brand-white p-brand-4">
          <View className="mb-brand-2 flex-row justify-between">
            <Text className="font-brand text-sm text-brand-dark">Artículos</Text>
            <Text testID="review-summary-count" className="font-brand text-sm text-brand-dark">
              {totalCount}
            </Text>
          </View>
          <View className="mb-brand-2 flex-row justify-between">
            <Text className="font-brand text-sm text-brand-dark">Subtotal</Text>
            <Text testID="review-summary-subtotal" className="font-brand text-sm text-brand-dark">
              {formatMXN(subtotal)}
            </Text>
          </View>
          <View className="mb-brand-2 flex-row justify-between">
            <Text className="font-brand text-sm text-brand-dark">Envío</Text>
            <Text testID="review-summary-shipping" className="font-brand text-sm text-brand-dark">
              {formatMXN(shipping)}
            </Text>
          </View>
          {discountAmount > 0 ? (
            <View className="mb-brand-2 flex-row justify-between">
              <Text className="font-brand text-sm text-brand-dark">Descuento</Text>
              <Text testID="review-summary-discount" className="font-brand text-sm text-brand-success">
                {`-${formatMXN(discountAmount)}`}
              </Text>
            </View>
          ) : null}
          <View className="flex-row justify-between border-t border-brand-dark/10 pt-brand-2">
            <Text className="font-brand-bold text-base text-brand-dark">Total</Text>
            <Text testID="review-summary-total" className="font-brand-bold text-base text-brand-primary">
              {formatMXN(total)}
            </Text>
          </View>
        </View>

        {submission.status === 'error' && submission.error ? (
          <Text
            testID="review-error"
            accessibilityRole="alert"
            className="mt-brand-3 text-sm text-brand-danger"
          >
            {submission.error}
          </Text>
        ) : null}

        <Button
          testID="review-submit"
          label="Solicitar pedidos"
          onPress={() => {
            void onSubmit();
          }}
          loading={isSubmitting}
          disabled={!canSubmit}
          className="mt-brand-4"
        />

        <View testID="checkout-legal" className="mt-brand-4 flex-row flex-wrap justify-center">
          <Pressable
            testID="checkout-legal-terms"
            accessibilityRole="link"
            onPress={() => router.push('/legal/terms')}
            className="px-brand-2 py-brand-1 active:opacity-80"
          >
            <Text className="font-brand text-xs text-brand-primary">Términos</Text>
          </Pressable>
          <Pressable
            testID="checkout-legal-privacy"
            accessibilityRole="link"
            onPress={() => router.push('/legal/privacy')}
            className="px-brand-2 py-brand-1 active:opacity-80"
          >
            <Text className="font-brand text-xs text-brand-primary">Privacidad</Text>
          </Pressable>
          <Pressable
            testID="checkout-legal-help"
            accessibilityRole="link"
            onPress={() => router.push('/legal/help')}
            className="px-brand-2 py-brand-1 active:opacity-80"
          >
            <Text className="font-brand text-xs text-brand-primary">Ayuda</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
