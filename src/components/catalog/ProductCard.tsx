import { Pressable, Text, View } from 'react-native';

import { Image } from '@/components/ui/Image';
import type { ProductSummary } from '@/core/models/catalog.model';
import { formatMXN } from '@/core/utils/format-currency';

export interface ProductCardProps {
  product: ProductSummary;
  onPress?: (product: ProductSummary) => void;
  testID?: string;
  className?: string;
}

export function ProductCard({ product, onPress, testID, className }: ProductCardProps) {
  return (
    <Pressable
      onPress={() => onPress?.(product)}
      testID={testID ?? `product-card-${product.slug}`}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatMXN(product.minPrice)}`}
      className={`${className ?? 'mr-3 w-40'} overflow-hidden rounded-lg bg-white active:opacity-80`}
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
          <Text className="mt-1 font-brand text-xs text-red-600">Sin stock</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
