import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuantityStepper } from '@/components/product/QuantityStepper';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatMXN } from '@/core/utils/format-currency';
import { selectTotalCount, selectTotalPrice, useCartStore } from '@/stores/cart-store';

import type { CartItem } from '@/core/models/cart.model';

interface CartRowProps {
  item: CartItem;
  onChangeQuantity: (quantity: number) => void;
  onRemove: () => void;
}

function CartRow({ item, onChangeQuantity, onRemove }: CartRowProps) {
  const variantLabel = [item.size, item.color].filter(Boolean).join(' · ');

  return (
    <View
      testID={`cart-item-${item.variantId}`}
      className="mx-brand-4 mb-brand-3 rounded-brand-lg bg-brand-white p-brand-3"
    >
      <View className="flex-row">
        <View className="flex-1">
          <Text className="font-brand-bold text-base text-brand-dark">{item.productName}</Text>
          {variantLabel ? (
            <Text className="font-brand text-sm text-brand-dark/60">{variantLabel}</Text>
          ) : null}
          <Text
            testID={`cart-line-total-${item.variantId}`}
            className="mt-1 font-brand-bold text-base text-brand-primary"
          >
            {formatMXN(item.lineTotal)}
          </Text>
        </View>
        <Pressable
          testID={`cart-remove-${item.variantId}`}
          accessibilityRole="button"
          accessibilityLabel={`Quitar ${item.productName}`}
          onPress={onRemove}
          className="h-8 justify-center active:opacity-80"
        >
          <Text className="font-brand text-sm text-brand-primary">Quitar</Text>
        </Pressable>
      </View>

      <View className="mt-brand-3 flex-row items-center justify-between">
        <QuantityStepper
          value={item.quantity}
          max={item.stock}
          onChange={onChangeQuantity}
          testID={`cart-stepper-${item.variantId}`}
        />
        <Text className="font-brand text-sm text-brand-dark/60">
          {`${formatMXN(item.price)} c/u`}
        </Text>
      </View>
    </View>
  );
}

function CartSkeleton() {
  return (
    <SafeAreaView
      className="flex-1 bg-brand-medium"
      edges={['top', 'left', 'right']}
      testID="cart-skeleton"
    >
      <View className="p-brand-4">
        {[0, 1, 2].map((i) => (
          <View key={i} className="mb-brand-4 flex-row">
            <Skeleton width={80} height={80} />
            <View className="ml-brand-3 flex-1">
              <Skeleton width="80%" height={16} />
              <View className="mt-brand-2">
                <Skeleton width="40%" height={14} />
              </View>
              <View className="mt-brand-2">
                <Skeleton width="30%" height={14} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

export default function CartTab() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const status = useCartStore((s) => s.status);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const totalCount = useCartStore(selectTotalCount);
  const totalPrice = useCartStore(selectTotalPrice);

  useEffect(() => {
    void fetchCart();
  }, [fetchCart]);

  if (status === 'loading') {
    return <CartSkeleton />;
  }

  if (status === 'error') {
    return (
      <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
        <ErrorState
          testID="cart-error"
          onRetry={() => {
            void fetchCart();
          }}
        />
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
        <EmptyState
          testID="cart-empty"
          title="Tu carrito está vacío"
          subtitle="Agrega productos para verlos aquí."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
      <FlatList
        testID="cart-list"
        data={items}
        keyExtractor={(item) => String(item.variantId)}
        contentContainerClassName="py-brand-4"
        renderItem={({ item }) => (
          <CartRow
            item={item}
            onChangeQuantity={(quantity) => {
              void updateItem(item.variantId, quantity);
            }}
            onRemove={() => {
              void removeItem(item.variantId);
            }}
          />
        )}
      />
      <View
        testID="cart-total"
        className="border-t border-brand-dark/10 bg-brand-white p-brand-4"
      >
        <View className="flex-row items-center justify-between">
          <Text className="font-brand text-base text-brand-dark">{`Total (${totalCount} artículos)`}</Text>
          <Text testID="cart-total-value" className="font-brand-bold text-xl text-brand-primary">
            {formatMXN(totalPrice)}
          </Text>
        </View>
        <Button
          testID="cart-continue"
          label="Continuar"
          onPress={() => router.push('/checkout/address')}
          className="mt-brand-3"
        />
      </View>
    </SafeAreaView>
  );
}
