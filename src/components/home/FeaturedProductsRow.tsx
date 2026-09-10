import { ScrollView, Text, View } from 'react-native';

import { ProductCard } from '@/components/catalog/ProductCard';
import type { ProductSummary } from '@/core/models/catalog.model';

export interface FeaturedProductsRowProps {
  products: ProductSummary[];
  onSelectProduct?: (product: ProductSummary) => void;
  testID?: string;
}

export function FeaturedProductsRow({
  products,
  onSelectProduct,
  testID,
}: FeaturedProductsRowProps) {
  return (
    <View className="mt-brand-6" testID={testID ?? 'featured-products-row'}>
      <Text className="font-brand-bold mb-brand-3 px-brand-4 text-xl text-brand-dark">
        Destacados
      </Text>
      {products.length === 0 ? (
        <Text className="font-brand px-brand-4 text-sm text-brand-dark/60" testID="featured-empty">
          Pronto habrá productos destacados
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row px-brand-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onPress={onSelectProduct} />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
