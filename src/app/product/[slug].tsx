import { useQuery } from '@tanstack/react-query';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { AddToCartButton } from '@/components/product/AddToCartButton';
import { ProductGallery } from '@/components/product/ProductGallery';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { VariantSelector } from '@/components/product/VariantSelector';
import {
  availableColors,
  availableSizes,
  clampQuantity,
  findVariant,
  isSelectable,
} from '@/components/product/variant-logic';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { HttpError } from '@/core/api/client';
import { catalogKeys } from '@/core/query/keys';
import { catalogService } from '@/core/services/catalog-service';
import { formatMXN } from '@/core/utils/format-currency';

function DetailSkeleton() {
  return (
    <View testID="detail-skeleton" className="flex-1 bg-brand-medium p-brand-4">
      <Skeleton height={280} />
      <View className="mt-4">
        <Skeleton width="70%" height={24} />
      </View>
      <View className="mt-4">
        <Skeleton width="40%" height={20} />
      </View>
      <View className="mt-6">
        <Skeleton width="100%" height={64} />
      </View>
      <View className="mt-6">
        <Skeleton width="100%" height={48} />
      </View>
    </View>
  );
}

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const query = useQuery({
    queryKey: catalogKeys.product(slug ?? ''),
    queryFn: () => catalogService.getProductBySlug(slug),
    enabled: !!slug,
  });

  const product = query.data;
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!product) return;
    const sizes = availableSizes(product.variants);
    const colors = availableColors(product.variants);
    setSize((current) => current ?? (sizes.length === 1 ? sizes[0] : null));
    setColor((current) => current ?? (colors.length === 1 ? colors[0] : null));
  }, [product]);

  const variant = product ? findVariant(product.variants, size, color) : null;

  useEffect(() => {
    setQty((current) => clampQuantity(current, variant?.stock ?? 0));
  }, [variant]);

  if (query.isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Producto' }} />
        <DetailSkeleton />
      </>
    );
  }

  const isNotFound = query.error instanceof HttpError && query.error.status === 404;

  if (isNotFound) {
    return (
      <>
        <Stack.Screen options={{ title: 'Producto' }} />
        <EmptyState
          title="Producto no encontrado"
          subtitle="El producto que buscas no existe o ya no está disponible."
          actionLabel="Volver al catálogo"
          onAction={() => router.replace('/(tabs)/catalog')}
          testID="product-not-found"
        />
      </>
    );
  }

  if (query.isError || !product) {
    return (
      <>
        <Stack.Screen options={{ title: 'Producto' }} />
        <ErrorState onRetry={() => query.refetch()} />
      </>
    );
  }

  const canAdd = !!variant && variant.stock > 0;
  const priceLabel = variant
    ? formatMXN(variant.price)
    : product.minPrice === product.maxPrice
      ? formatMXN(product.minPrice)
      : `${formatMXN(product.minPrice)} – ${formatMXN(product.maxPrice)}`;

  const handleSelectSize = (nextSize: string) => {
    setSize(nextSize);
    setColor((current) =>
      current && !isSelectable(product.variants, nextSize, current) ? null : current,
    );
  };

  const handleSelectColor = (nextColor: string) => {
    setColor(nextColor);
    setSize((current) =>
      current && !isSelectable(product.variants, current, nextColor) ? null : current,
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: product.name }} />
      <ScrollView className="flex-1 bg-brand-medium" testID="product-detail">
        <ProductGallery images={product.images} fallbackImage={product.image} />
        <View className="p-brand-4">
          <Text className="font-brand-bold text-xl text-brand-dark">{product.name}</Text>
          <Text testID="product-price" className="font-brand-bold mt-2 text-2xl text-brand-primary">
            {priceLabel}
          </Text>
          {variant && variant.stock > 0 && variant.stock <= 5 ? (
            <Text testID="stock-hint" className="mt-1 font-brand text-sm text-brand-primary">
              {`Quedan ${variant.stock}`}
            </Text>
          ) : null}
          {product.description ? (
            <Text className="mt-4 font-brand text-base text-brand-dark/80">
              {product.description}
            </Text>
          ) : null}

          {product.variants.length === 0 ? (
            <Text
              testID="product-unavailable"
              className="font-brand-bold mt-4 text-base text-brand-dark"
            >
              No disponible
            </Text>
          ) : (
            <View className="mt-6">
              <VariantSelector
                variants={product.variants}
                selectedSize={size}
                selectedColor={color}
                onSelectSize={handleSelectSize}
                onSelectColor={handleSelectColor}
              />
            </View>
          )}

          <View className="mt-6 flex-row items-center justify-between">
            <Text className="font-brand-bold text-sm text-brand-dark">Cantidad</Text>
            <QuantityStepper value={qty} max={variant?.stock ?? 0} onChange={setQty} />
          </View>

          <View className="mt-6">
            <AddToCartButton
              disabled={!canAdd}
              onPress={() => Alert.alert('Carrito', 'El carrito llega en la Fase 3.')}
            />
          </View>
        </View>
      </ScrollView>
    </>
  );
}
