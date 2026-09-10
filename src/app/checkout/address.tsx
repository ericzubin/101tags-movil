import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SHIPPING_COST } from '@/core/models/checkout.model';
import { formatMXN } from '@/core/utils/format-currency';
import { selectTotalCount, selectTotalPrice, useCartStore } from '@/stores/cart-store';
import { useCheckoutStore } from '@/stores/checkout-store';
import { brandColors } from '@/theme/tokens';

import type { PaymentMethod } from '@/core/models/checkout.model';

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: 'Tarjeta',
  oxxo: 'OXXO',
  spei: 'SPEI',
};

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  testID: string;
  error?: string;
  placeholder?: string;
  autoCapitalize?: 'none' | 'characters' | 'words' | 'sentences';
  keyboardType?: 'default' | 'number-pad';
  maxLength?: number;
}

function FormField({
  label,
  value,
  onChangeText,
  testID,
  error,
  placeholder,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  maxLength,
}: FormFieldProps) {
  return (
    <View className="mb-brand-4">
      <Text className="text-sm text-brand-dark mb-1.5">{label}</Text>
      <TextInput
        className="bg-brand-white border border-neutral-300 rounded-brand-md px-3 py-2.5 text-base text-brand-dark"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={brandColors.dark}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        maxLength={maxLength}
        accessibilityLabel={label}
        testID={testID}
      />
      {error ? (
        <Text
          className="text-xs text-brand-danger mt-1"
          accessibilityRole="alert"
          testID={`${testID}-error`}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export default function AddressScreen() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const totalCount = useCartStore(selectTotalCount);
  const subtotal = useCartStore(selectTotalPrice);

  const config = useCheckoutStore((s) => s.config);
  const address = useCheckoutStore((s) => s.address);
  const settlements = useCheckoutStore((s) => s.settlements);
  const coupon = useCheckoutStore((s) => s.coupon);
  const couponMessage = useCheckoutStore((s) => s.couponMessage);
  const fieldErrors = useCheckoutStore((s) => s.fieldErrors);
  const status = useCheckoutStore((s) => s.status);
  const fetchConfig = useCheckoutStore((s) => s.fetchConfig);
  const fetchPolicies = useCheckoutStore((s) => s.fetchPolicies);
  const setAddressField = useCheckoutStore((s) => s.setAddressField);
  const setAddress = useCheckoutStore((s) => s.setAddress);
  const validate = useCheckoutStore((s) => s.validate);
  const applyCoupon = useCheckoutStore((s) => s.applyCoupon);
  const clearCoupon = useCheckoutStore((s) => s.clearCoupon);

  const [couponInput, setCouponInput] = useState('');

  useEffect(() => {
    void fetchConfig();
    void fetchPolicies();
  }, [fetchConfig, fetchPolicies]);

  if (status === 'loading') {
    return (
      <SafeAreaView
        className="flex-1 bg-brand-medium"
        edges={['top', 'left', 'right']}
        testID="checkout-loading"
      />
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
        <ErrorState
          testID="checkout-error"
          onRetry={() => {
            void fetchConfig();
          }}
        />
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
        <EmptyState
          testID="checkout-empty"
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

  const addressComplete =
    address.street.trim().length > 0 &&
    address.city.trim().length > 0 &&
    address.state.trim().length > 0 &&
    /^\d{5}$/.test(address.zip.trim());

  const enabledMethods = config
    ? (Object.keys(config.paymentMethods) as PaymentMethod[]).filter(
        (method) => config.paymentMethods[method],
      )
    : [];

  const onContinue = () => {
    if (!validate()) return;
    router.push('/checkout/review');
  };

  return (
    <SafeAreaView
      className="flex-1 bg-brand-medium"
      edges={['top', 'left', 'right']}
      testID="checkout-address"
    >
      <ScrollView contentContainerClassName="p-brand-4">
        <Text className="text-[22px] font-brand-bold text-brand-dark mb-brand-4">
          Dirección de envío
        </Text>

        <FormField
          label="Calle y número"
          value={address.street}
          onChangeText={(text) => {
            void setAddressField('street', text);
          }}
          testID="address-street"
          error={fieldErrors.street}
          placeholder="Av. Juárez 123"
        />
        <FormField
          label="Colonia (opcional)"
          value={address.neighborhood ?? ''}
          onChangeText={(text) => {
            void setAddressField('neighborhood', text);
          }}
          testID="address-neighborhood"
          error={fieldErrors.neighborhood}
          placeholder="Juárez"
        />
        <FormField
          label="Ciudad"
          value={address.city}
          onChangeText={(text) => {
            void setAddressField('city', text);
          }}
          testID="address-city"
          error={fieldErrors.city}
          placeholder="Ciudad de México"
        />
        <FormField
          label="Estado"
          value={address.state}
          onChangeText={(text) => {
            void setAddressField('state', text);
          }}
          testID="address-state"
          error={fieldErrors.state}
          placeholder="Ciudad de México"
        />
        <FormField
          label="Código postal"
          value={address.zip}
          onChangeText={(text) => {
            void setAddressField('zip', text);
          }}
          testID="address-zip"
          error={fieldErrors.zip}
          placeholder="06600"
          keyboardType="number-pad"
          maxLength={5}
        />

        {settlements.length > 0 ? (
          <View testID="address-settlements" className="mb-brand-4 flex-row flex-wrap">
            {settlements.map((settlement) => (
              <Pressable
                key={settlement.name}
                testID={`address-settlement-${settlement.name}`}
                accessibilityRole="button"
                accessibilityLabel={`Elegir colonia ${settlement.name}`}
                onPress={() => setAddress({ neighborhood: settlement.name })}
                className="mr-brand-2 mb-brand-2 rounded-brand-pill border border-brand-dark/20 bg-brand-white px-brand-3 py-brand-2"
              >
                <Text className="font-brand text-sm text-brand-dark">{settlement.name}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {enabledMethods.length > 0 ? (
          <View testID="checkout-payment-methods" className="mb-brand-4">
            <Text className="text-sm text-brand-dark mb-1.5">Métodos de pago disponibles</Text>
            <View className="flex-row flex-wrap">
              {enabledMethods.map((method) => (
                <View
                  key={method}
                  testID={`payment-method-${method}`}
                  className="mr-brand-2 rounded-brand-pill bg-brand-dark px-brand-3 py-brand-2"
                >
                  <Text className="font-brand text-sm text-brand-white">
                    {PAYMENT_METHOD_LABELS[method]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View className="mb-brand-4">
          <Text className="text-sm text-brand-dark mb-1.5">Cupón</Text>
          <View className="flex-row items-center">
            <TextInput
              className="flex-1 bg-brand-white border border-neutral-300 rounded-brand-md px-3 py-2.5 text-base text-brand-dark"
              value={couponInput}
              onChangeText={setCouponInput}
              placeholder="Código"
              placeholderTextColor={brandColors.dark}
              autoCapitalize="characters"
              accessibilityLabel="Código de cupón"
              testID="coupon-input"
            />
            <Button
              testID="coupon-apply"
              label="Aplicar"
              onPress={() => {
                void applyCoupon(couponInput);
              }}
              className="ml-brand-2"
            />
          </View>
          {couponMessage ? (
            <Text className="text-xs text-brand-dark mt-1" testID="coupon-message">
              {couponMessage}
            </Text>
          ) : null}
          {coupon ? (
            <Pressable
              testID="coupon-clear"
              accessibilityRole="button"
              accessibilityLabel="Quitar cupón"
              onPress={() => {
                setCouponInput('');
                clearCoupon();
              }}
              className="mt-brand-2"
            >
              <Text className="font-brand text-sm text-brand-primary">Quitar cupón</Text>
            </Pressable>
          ) : null}
        </View>

        <View testID="checkout-summary" className="rounded-brand-lg bg-brand-white p-brand-4">
          <View className="flex-row justify-between mb-brand-2">
            <Text className="font-brand text-sm text-brand-dark">Artículos</Text>
            <Text testID="checkout-summary-count" className="font-brand text-sm text-brand-dark">
              {totalCount}
            </Text>
          </View>
          <View className="flex-row justify-between mb-brand-2">
            <Text className="font-brand text-sm text-brand-dark">Subtotal</Text>
            <Text testID="checkout-summary-subtotal" className="font-brand text-sm text-brand-dark">
              {formatMXN(subtotal)}
            </Text>
          </View>
          <View className="flex-row justify-between mb-brand-2">
            <Text className="font-brand text-sm text-brand-dark">Envío</Text>
            <Text testID="checkout-summary-shipping" className="font-brand text-sm text-brand-dark">
              {formatMXN(shipping)}
            </Text>
          </View>
          {discountAmount > 0 ? (
            <View className="flex-row justify-between mb-brand-2">
              <Text className="font-brand text-sm text-brand-dark">Descuento</Text>
              <Text
                testID="checkout-summary-discount"
                className="font-brand text-sm text-brand-success"
              >
                {`-${formatMXN(discountAmount)}`}
              </Text>
            </View>
          ) : null}
          <View className="flex-row justify-between border-t border-brand-dark/10 pt-brand-2">
            <Text className="font-brand-bold text-base text-brand-dark">Total</Text>
            <Text testID="checkout-summary-total" className="font-brand-bold text-base text-brand-primary">
              {formatMXN(total)}
            </Text>
          </View>
        </View>

        <Button
          testID="checkout-continue"
          label="Continuar"
          onPress={onContinue}
          disabled={!addressComplete}
          className="mt-brand-4"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
