import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { couponDiscountLabel, formatCouponExpiry } from '@/core/models/coupon.model';
import { authGuard } from '@/core/navigation/guards';
import { formatMXN } from '@/core/utils/format-currency';
import { isAuthenticated, useAuthStore } from '@/stores/auth-store';
import { useCheckoutStore } from '@/stores/checkout-store';
import { filterCoupons, useCouponStore } from '@/stores/coupon-store';
import { brandColors } from '@/theme/tokens';

import type { CouponDefinition } from '@/core/models/coupon.model';

function ListSkeleton() {
  return (
    <View className="flex-1 bg-brand-medium p-brand-4" testID="coupons-skeleton">
      {[0, 1, 2].map((i) => (
        <View key={i} className="mb-brand-3 rounded-brand-lg bg-brand-white p-brand-4">
          <Skeleton width="40%" height={16} />
          <View className="mt-brand-2">
            <Skeleton width="70%" height={14} />
          </View>
        </View>
      ))}
    </View>
  );
}

interface CouponRowProps {
  coupon: CouponDefinition;
  applied: boolean;
  appliedValid: boolean;
  message: string | null;
  onApply: () => void;
}

function CouponRow({ coupon, applied, appliedValid, message, onApply }: CouponRowProps) {
  const discount = couponDiscountLabel(coupon);
  const expiry = formatCouponExpiry(coupon.expiresAt);

  return (
    <View
      testID={`coupon-item-${coupon.code}`}
      className="mb-brand-3 rounded-brand-lg bg-brand-white p-brand-4"
    >
      <View className="flex-row items-center justify-between">
        <Text
          testID={`coupon-code-${coupon.code}`}
          className="font-brand-bold text-base text-brand-primary"
        >
          {coupon.code}
        </Text>
        <Text
          testID={`coupon-discount-${coupon.code}`}
          className="font-brand-bold text-sm text-brand-dark"
        >
          {discount}
        </Text>
      </View>
      <Text className="mt-brand-1 font-brand-bold text-base text-brand-dark">{coupon.title}</Text>
      {coupon.description ? (
        <Text className="mt-brand-1 font-brand text-sm text-brand-dark/70">
          {coupon.description}
        </Text>
      ) : null}
      {coupon.storeName ? (
        <Text className="mt-brand-1 font-brand text-xs text-brand-dark/50">{coupon.storeName}</Text>
      ) : null}
      {coupon.minSubtotal ? (
        <Text className="mt-brand-1 font-brand text-xs text-brand-dark/60">
          {`Mínimo ${formatMXN(coupon.minSubtotal)}`}
        </Text>
      ) : null}
      {expiry ? (
        <Text
          testID={`coupon-expires-${coupon.code}`}
          className="mt-brand-1 font-brand text-xs text-brand-dark/50"
        >
          {`Vence ${expiry}`}
        </Text>
      ) : null}
      <Pressable
        testID={`coupon-apply-${coupon.code}`}
        accessibilityRole="button"
        onPress={onApply}
        className="mt-brand-3 items-center rounded-brand-lg bg-brand-primary py-3 active:opacity-80"
      >
        <Text className="font-brand-bold text-sm text-white">Aplicar en checkout</Text>
      </Pressable>
      {applied && message ? (
        <Text
          testID={`coupon-message-${coupon.code}`}
          className="mt-brand-2 font-brand text-sm text-brand-dark"
        >
          {message}
        </Text>
      ) : null}
      {appliedValid ? (
        <Pressable
          testID={`coupon-checkout-${coupon.code}`}
          accessibilityRole="button"
          onPress={() => router.push('/checkout/address')}
          className="mt-brand-2 items-center rounded-brand-lg border border-brand-primary py-3 active:opacity-80"
        >
          <Text className="font-brand-bold text-sm text-brand-primary">Ir al checkout</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Cuponera (M6.2). Lists the authenticated user's assigned/public coupons and
 * lets them search the wallet. Applying a coupon delegates to
 * `checkout-store.applyCoupon`, which reuses the real `validateCoupon` with the
 * cart items — the backend remains the authority on eligibility (AC4/AC5).
 *
 * @see .spec/2026-09-11-m6-2-coupons.md
 */
export default function CouponsScreen() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const coupons = useCouponStore((s) => s.coupons);
  const query = useCouponStore((s) => s.query);
  const status = useCouponStore((s) => s.status);
  const fetchCoupons = useCouponStore((s) => s.fetchCoupons);
  const setQuery = useCouponStore((s) => s.setQuery);

  const couponValidation = useCheckoutStore((s) => s.coupon);
  const couponMessage = useCheckoutStore((s) => s.couponMessage);
  const applyCoupon = useCheckoutStore((s) => s.applyCoupon);

  const [appliedCode, setAppliedCode] = useState<string | null>(null);

  const authed = isAuthenticated({ token, user });
  const guard = authGuard({ isAuthenticated: authed, isHydrated });
  const email = user?.email;

  useEffect(() => {
    if (authed && isHydrated) void fetchCoupons(email);
  }, [authed, isHydrated, fetchCoupons, email]);

  const visibleCoupons = useMemo(() => filterCoupons(coupons, query), [coupons, query]);

  if (!isHydrated) return null;
  if (guard !== true) return <Redirect href={guard.redirect} />;

  if (status === 'loading' && coupons.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
        <ListSkeleton />
      </SafeAreaView>
    );
  }

  if (status === 'error' && coupons.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
        <ErrorState
          testID="coupons-error"
          title="No pudimos cargar tus cupones"
          onRetry={() => void fetchCoupons(email)}
        />
      </SafeAreaView>
    );
  }

  const handleApply = (code: string) => {
    setAppliedCode(code);
    void applyCoupon(code, email);
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
      <View className="px-brand-4 pb-brand-2 pt-brand-3">
        <View className="flex-row items-center rounded-brand-lg bg-brand-white px-brand-3">
          <Ionicons name="search" size={18} color={brandColors.dark} />
          <TextInput
            testID="coupons-search"
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar cupón"
            placeholderTextColor={brandColors.dark}
            autoCapitalize="none"
            autoCorrect={false}
            className="ml-brand-2 flex-1 py-brand-3 font-brand text-base text-brand-dark"
          />
        </View>
      </View>
      <FlatList
        testID="coupons-list"
        data={visibleCoupons}
        keyExtractor={(coupon) => coupon.id}
        contentContainerClassName="px-brand-4 pb-brand-4"
        refreshControl={
          <RefreshControl
            testID="coupons-refresh"
            refreshing={status === 'loading' && coupons.length > 0}
            onRefresh={() => void fetchCoupons(email)}
            tintColor={brandColors.primary}
            colors={[brandColors.primary]}
          />
        }
        renderItem={({ item }) => (
          <CouponRow
            coupon={item}
            applied={appliedCode === item.code}
            appliedValid={appliedCode === item.code && couponValidation?.valid === true}
            message={appliedCode === item.code ? couponMessage : null}
            onApply={() => handleApply(item.code)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            testID="coupons-empty"
            title={query.trim() ? 'Sin resultados' : 'Sin cupones disponibles'}
            subtitle={
              query.trim()
                ? 'Prueba con otro término de búsqueda.'
                : 'Cuando tengas cupones aparecerán aquí.'
            }
          />
        }
      />
    </SafeAreaView>
  );
}
