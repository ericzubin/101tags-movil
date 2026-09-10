import { Pressable, Text, View } from 'react-native';

import { Image } from '@/components/ui/Image';
import type { ProductSummary } from '@/core/models/catalog.model';
import { formatMXN } from '@/core/utils/format-currency';

export interface ProductCardProps {
  product: ProductSummary;
  onPress?: (product: ProductSummary) => void;
  testID?: string;
}

export function ProductCard({ product, onPress, testID }: ProductCardProps) {
  return (
    <Pressable
      onPress={() => onPress?.(product)}
      testID={testID ?? `product-card-${product.slug}`}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatMXN(product.minPrice)}`}
      className="mr-3 w-40 overflow-hidden rounded-lg bg-white active:opacity-80"
    >
      <Image
        source={product.image}
        width={160}
        height={160}
        contentFit="cover"
        testID="product-card-image"
      />
      <View className="p-2">
        <Text numberOfLines={2} className="font-brand text-sm text-brand-dark">
          {product.name}
        </Text>
        <Text className="font-brand-bold mt-1 text-base text-brand-primary">
          {formatMXN(product.minPrice)}
        </Text>
        {!product.inStock ? (
          <Text className="font-brand mt-1 text-xs text-red-600">Sin stock</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
