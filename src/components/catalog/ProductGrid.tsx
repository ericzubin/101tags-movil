import { View } from 'react-native';

import { ProductCard } from './ProductCard';
import type { ProductSummary } from '@/core/models/catalog.model';

export interface ProductGridProps {
  products: ProductSummary[];
  onSelectProduct: (product: ProductSummary) => void;
  testID?: string;
}

export function ProductGrid({ products, onSelectProduct, testID }: ProductGridProps) {
  return (
    <View testID={testID ?? 'product-grid'} className="flex-row flex-wrap justify-between px-3">
      {products.map((p) => (
        <View key={p.slug} className="w-1/2 p-1">
          <ProductCard product={p} onPress={onSelectProduct} className="mr-0 w-full" />
        </View>
      ))}
    </View>
  );
}
