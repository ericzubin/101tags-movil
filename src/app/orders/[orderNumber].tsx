import { useQuery } from '@tanstack/react-query';
import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { HttpError } from '@/core/api/client';
import { authGuard } from '@/core/navigation/guards';
import { orderKeys } from '@/core/query/keys';
import { orderService } from '@/core/services/order-service';
import { formatMXN } from '@/core/utils/format-currency';
import { isAuthenticated, useAuthStore } from '@/stores/auth-store';
import { useOrderStore } from '@/stores/order-store';
import { brandColors } from '@/theme/tokens';

import type { OrderDetail, OrderItem, SupplierRatingState } from '@/core/models/order.model';
import {
  SUPPLIER_RATING_COMMENT_MAX,
  SUPPLIER_RATING_MAX,
  canCancelOrder,
  canReturnOrder,
  hasTracking,
  isValidSupplierRating,
} from '@/core/models/order.model';

const STAR_VALUES = [1, 2, 3, 4, 5];
const RATING_RANGE_ERROR = 'Selecciona una calificación de 1 a 5 estrellas.';

function DetailSkeleton() {
  return (
    <View testID="order-detail-skeleton" className="flex-1 bg-brand-medium p-brand-4">
      <Skeleton width="50%" height={20} />
      <View className="mt-brand-4">
        <Skeleton width="100%" height={72} />
      </View>
      <View className="mt-brand-4">
        <Skeleton width="100%" height={120} />
      </View>
    </View>
  );
}

function variantLabel(item: OrderItem): string {
  return [item.size, item.color].filter(Boolean).join(' · ');
}

function SummaryRow({
  label,
  value,
  testID,
  emphasis,
}: {
  label: string;
  value: string;
  testID: string;
  emphasis?: boolean;
}) {
  return (
    <View className="mb-brand-1 flex-row items-center justify-between">
      <Text className="font-brand text-sm text-brand-dark/70">{label}</Text>
      <Text
        testID={testID}
        className={
          emphasis
            ? 'font-brand-bold text-base text-brand-primary'
            : 'font-brand text-sm text-brand-dark'
        }
      >
        {value}
      </Text>
    </View>
  );
}

function SupplierRatingBlock({
  orderNumber,
  state,
}: {
  orderNumber: string;
  state: SupplierRatingState;
}) {
  const ratingStatus = useOrderStore((s) => s.ratingStatus);
  const ratingError = useOrderStore((s) => s.ratingError);
  const ratingMessage = useOrderStore((s) => s.ratingMessage);
  const submitRating = useOrderStore((s) => s.submitRating);
  const resetRatingSubmission = useOrderStore((s) => s.resetRatingSubmission);

  const [selected, setSelected] = useState(0);
  const [comment, setComment] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    resetRatingSubmission();
  }, [resetRatingSubmission]);

  if (!state.canRate && !state.hasRated) return null;

  if (state.hasRated) {
    const stars = Math.max(0, Math.min(SUPPLIER_RATING_MAX, state.rating?.stars ?? 0));
    const display = `${'★'.repeat(stars)}${'☆'.repeat(SUPPLIER_RATING_MAX - stars)}`;

    return (
      <View
        testID="supplier-rating-block"
        className="mt-brand-4 rounded-brand-lg bg-brand-white p-brand-4"
      >
        <Text className="mb-brand-2 font-brand-bold text-base text-brand-dark">
          Tu calificación
        </Text>
        <View testID="supplier-rating-display">
          <Text testID="supplier-rating-stars" className="text-[24px] text-brand-warning">
            {display}
          </Text>
          {state.rating?.comment ? (
            <Text
              testID="supplier-rating-comment"
              className="mt-brand-1 font-brand text-sm text-brand-dark/70"
            >
              {state.rating.comment}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  const isSubmitting = ratingStatus === 'submitting';

  const onSubmit = () => {
    if (isSubmitting) return;

    if (!isValidSupplierRating(selected)) {
      setValidationError(RATING_RANGE_ERROR);
      return;
    }

    const trimmedComment = comment.trim();
    if (trimmedComment.length > SUPPLIER_RATING_COMMENT_MAX) {
      setValidationError(
        `El comentario no puede exceder ${SUPPLIER_RATING_COMMENT_MAX} caracteres.`,
      );
      return;
    }

    setValidationError(null);
    void submitRating(
      orderNumber,
      trimmedComment ? { rating: selected, comment: trimmedComment } : { rating: selected },
    );
  };

  return (
    <View
      testID="supplier-rating-block"
      className="mt-brand-4 rounded-brand-lg bg-brand-white p-brand-4"
    >
      <Text className="mb-brand-2 font-brand-bold text-base text-brand-dark">
        Califica al proveedor
      </Text>

      {ratingStatus === 'success' ? (
        <Text testID="rating-success" className="font-brand-bold text-sm text-brand-success">
          {ratingMessage}
        </Text>
      ) : (
        <View testID="supplier-rating-form">
          {ratingStatus === 'error' && ratingError ? (
            <Text
              testID="rating-error"
              accessibilityRole="alert"
              className="mb-brand-2 font-brand text-sm text-brand-danger"
            >
              {ratingError}
            </Text>
          ) : null}

          <View className="flex-row">
            {STAR_VALUES.map((value) => (
              <Pressable
                key={value}
                testID={`rating-star-${value}`}
                accessibilityRole="button"
                accessibilityLabel={`${value} estrellas`}
                disabled={isSubmitting}
                onPress={() => {
                  setSelected(value);
                  setValidationError(null);
                }}
                className="mr-brand-1"
              >
                <Text
                  className={
                    value <= selected
                      ? 'text-[28px] text-brand-warning'
                      : 'text-[28px] text-brand-dark/20'
                  }
                >
                  {value <= selected ? '★' : '☆'}
                </Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            testID="rating-comment"
            accessibilityLabel="Comentario"
            className="mt-brand-3 rounded-brand-md border border-neutral-300 bg-brand-white px-3 py-2.5 text-base text-brand-dark"
            value={comment}
            onChangeText={(text) => {
              setComment(text);
              if (validationError) setValidationError(null);
            }}
            placeholder="Cuéntanos tu experiencia (opcional)"
            placeholderTextColor={brandColors.dark}
            maxLength={SUPPLIER_RATING_COMMENT_MAX}
            multiline
            numberOfLines={3}
          />

          {validationError ? (
            <Text
              testID="rating-validation-error"
              accessibilityRole="alert"
              className="mt-1 font-brand text-xs text-brand-danger"
            >
              {validationError}
            </Text>
          ) : null}

          <Button
            testID="rating-submit"
            label="Enviar calificación"
            className="mt-brand-3"
            loading={isSubmitting}
            onPress={onSubmit}
          />
        </View>
      )}
    </View>
  );
}

function DetailBody({ order }: { order: OrderDetail }) {
  const timeline = order.tracking.timeline ?? [];
  const showTracking = hasTracking(order.tracking);

  return (
    <ScrollView className="flex-1 bg-brand-medium" testID="order-detail">
      <View className="p-brand-4">
        <View className="rounded-brand-lg bg-brand-white p-brand-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-brand-bold text-lg text-brand-dark">{order.orderNumber}</Text>
            <Text testID="order-detail-status" className="font-brand text-sm text-brand-dark/70">
              {order.status}
            </Text>
          </View>
          <Text className="mt-brand-1 font-brand text-xs text-brand-dark/60">
            {`Pago: ${order.paymentStatus}`}
          </Text>
        </View>

        <Text className="mb-brand-2 mt-brand-4 font-brand-bold text-base text-brand-dark">
          Artículos
        </Text>
        {order.items.map((item, index) => (
          <View
            key={`${item.productName}-${index}`}
            testID={`order-item-${index}`}
            className="mb-brand-2 rounded-brand-lg bg-brand-white p-brand-4"
          >
            <Text testID={`order-item-name-${index}`} className="font-brand-bold text-base text-brand-dark">
              {item.productName}
            </Text>
            {variantLabel(item) ? (
              <Text testID={`order-item-variant-${index}`} className="mt-1 font-brand text-sm text-brand-dark/70">
                {variantLabel(item)}
              </Text>
            ) : null}
            <View className="mt-brand-2 flex-row items-center justify-between">
              <Text testID={`order-item-qty-${index}`} className="font-brand text-sm text-brand-dark/70">
                {item.quantity}
              </Text>
              <Text testID={`order-item-unit-${index}`} className="font-brand text-sm text-brand-dark/70">
                {formatMXN(item.unitPrice)}
              </Text>
              <Text
                testID={`order-item-total-${index}`}
                className="font-brand-bold text-sm text-brand-dark"
              >
                {formatMXN(item.totalPrice)}
              </Text>
            </View>
          </View>
        ))}

        <Text className="mb-brand-2 mt-brand-4 font-brand-bold text-base text-brand-dark">
          Resumen
        </Text>
        <View className="rounded-brand-lg bg-brand-white p-brand-4">
          <SummaryRow label="Subtotal" value={formatMXN(order.subtotal)} testID="order-subtotal" />
          <SummaryRow label="Envío" value={formatMXN(order.shippingCost)} testID="order-shipping" />
          <SummaryRow
            label={order.couponCode ? `Descuento (${order.couponCode})` : 'Descuento'}
            value={formatMXN(order.discountAmount)}
            testID="order-discount"
          />
          <View className="my-brand-2 border-t border-brand-dark/10" />
          <SummaryRow label="Total" value={formatMXN(order.total)} testID="order-total" emphasis />
        </View>

        {timeline.length > 0 ? (
          <View testID="order-timeline" className="mt-brand-4 rounded-brand-lg bg-brand-white p-brand-4">
            <Text className="mb-brand-3 font-brand-bold text-base text-brand-dark">Progreso</Text>
            {timeline.map((step) => (
              <View key={step.key} testID={`timeline-step-${step.key}`} className="mb-brand-2">
                <Text
                  className={
                    step.current
                      ? 'font-brand-bold text-sm text-brand-primary'
                      : step.completed
                        ? 'font-brand text-sm text-brand-dark'
                        : 'font-brand text-sm text-brand-dark/40'
                  }
                >
                  {step.label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {showTracking ? (
          <View testID="order-tracking" className="mt-brand-4 rounded-brand-lg bg-brand-white p-brand-4">
            <Text className="mb-brand-2 font-brand-bold text-base text-brand-dark">Seguimiento</Text>
            {order.tracking.carrier ? (
              <Text testID="order-tracking-carrier" className="font-brand text-sm text-brand-dark">
                {order.tracking.carrier}
              </Text>
            ) : null}
            {order.tracking.number ? (
              <Text testID="order-tracking-number" className="font-brand text-sm text-brand-dark/70">
                {order.tracking.number}
              </Text>
            ) : null}
          </View>
        ) : null}

        <SupplierRatingBlock orderNumber={order.orderNumber} state={order.supplierRating} />

        {canReturnOrder(order.status) || canCancelOrder(order.status) ? (
          <View testID="order-actions" className="mt-brand-4">
            {canReturnOrder(order.status) ? (
              <Button
                testID="order-return-action"
                label="Solicitar devolución"
                onPress={() =>
                  router.push(
                    `/orders/request?orderNumber=${encodeURIComponent(order.orderNumber)}&type=return`,
                  )
                }
              />
            ) : null}
            {canCancelOrder(order.status) ? (
              <Button
                testID="order-cancel-action"
                label="Cancelar pedido"
                variant="secondary"
                className="mt-brand-2"
                onPress={() =>
                  router.push(
                    `/orders/request?orderNumber=${encodeURIComponent(order.orderNumber)}&type=cancellation`,
                  )
                }
              />
            ) : null}
          </View>
        ) : null}

        <Pressable
          testID="order-detail-back"
          accessibilityRole="button"
          onPress={() => router.replace('/orders')}
          className="mt-brand-4 items-center py-brand-2"
        >
          <Text className="font-brand text-sm text-brand-primary">Volver a mis pedidos</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

export default function OrderDetailScreen() {
  const { orderNumber } = useLocalSearchParams<{ orderNumber: string }>();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const authed = isAuthenticated({ token, user });
  const guard = authGuard({ isAuthenticated: authed, isHydrated });

  const query = useQuery({
    queryKey: orderKeys.detail(orderNumber ?? ''),
    queryFn: () => orderService.getOrder(orderNumber),
    enabled: authed && !!orderNumber,
  });

  if (!isHydrated) return null;
  if (guard !== true) return <Redirect href={guard.redirect} />;

  if (query.isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Pedido' }} />
        <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
          <DetailSkeleton />
        </SafeAreaView>
      </>
    );
  }

  const isNotFound = query.error instanceof HttpError && query.error.status === 404;

  if (isNotFound) {
    return (
      <>
        <Stack.Screen options={{ title: 'Pedido' }} />
        <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
          <EmptyState
            testID="order-not-found"
            title="Pedido no encontrado"
            subtitle="El pedido que buscas no existe o no pertenece a tu cuenta."
            actionLabel="Volver a mis pedidos"
            onAction={() => router.replace('/orders')}
          />
        </SafeAreaView>
      </>
    );
  }

  if (query.isError || !query.data) {
    return (
      <>
        <Stack.Screen options={{ title: 'Pedido' }} />
        <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
          <ErrorState
            testID="order-detail-error"
            title="No pudimos cargar el pedido"
            onRetry={() => query.refetch()}
          />
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: query.data.orderNumber }} />
      <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
        <DetailBody order={query.data} />
      </SafeAreaView>
    </>
  );
}
