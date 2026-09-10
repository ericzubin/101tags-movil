import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { CategoryTree } from '@/components/catalog/CategoryTree';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Category, ProductSummary } from '@/core/models/catalog.model';
import { catalogKeys } from '@/core/query/keys';
import { catalogService } from '@/core/services/catalog-service';
import { brandColors } from '@/theme/tokens';

export const DEFAULT_SEGMENT = 'basicos' as const;

type Selection = { slug: string; name: string; kind: 'category' | 'subcategory' };

function findCategoryName(categories: Category[] | undefined, slug: string): string | null {
  if (!categories) return null;
  for (const category of categories) {
    if (category.slug === slug) return category.name;
    const child = category.children?.find((c) => c.slug === slug);
    if (child) return child.name;
  }
  return null;
}

function TreeSkeleton() {
  return (
    <View className="flex-1 bg-brand-medium p-brand-4" testID="catalog-tree-skeleton">
      {[0, 1, 2, 3].map((i) => (
        <View key={i} className="mb-brand-3 flex-row items-center">
          <Skeleton width={48} height={48} rounded />
          <View className="ml-brand-3 flex-1">
            <Skeleton width="60%" height={16} />
            <View className="mt-brand-1">
              <Skeleton width="30%" height={12} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function ListSkeleton() {
  return (
    <View
      className="flex-1 flex-row flex-wrap justify-between p-brand-4"
      testID="catalog-list-skeleton"
    >
      {[0, 1, 2, 3].map((i) => (
        <View key={i} className="mb-brand-3 w-[48%]">
          <Skeleton height={160} rounded />
          <View className="mt-brand-2">
            <Skeleton width="80%" height={14} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function CatalogTab() {
  const params = useLocalSearchParams<{ category?: string; subcategory?: string }>();
  const initialSelection: Selection | null = params.subcategory
    ? { slug: params.subcategory, name: params.subcategory, kind: 'subcategory' }
    : params.category
      ? { slug: params.category, name: params.category, kind: 'category' }
      : null;
  const [selection, setSelection] = useState<Selection | null>(initialSelection);

  const categoriesQuery = useQuery({
    queryKey: catalogKeys.categories(DEFAULT_SEGMENT),
    queryFn: () => catalogService.getCategories(DEFAULT_SEGMENT),
  });

  const productFilters = selection
    ? selection.kind === 'category'
      ? { category: [selection.slug] }
      : { subcategory: [selection.slug] }
    : null;

  const productsQuery = useQuery({
    queryKey: catalogKeys.products(productFilters ?? {}),
    queryFn: () => catalogService.getProducts(productFilters ?? {}),
    enabled: !!productFilters,
  });

  const categories = categoriesQuery.data?.data ?? [];

  if (selection) {
    const products: ProductSummary[] = productsQuery.data?.data ?? [];
    const title = findCategoryName(categoriesQuery.data?.data, selection.slug) ?? selection.name;

    return (
      <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
        <View className="flex-row items-center border-b border-brand-dark/10 bg-white px-brand-4 py-brand-3">
          <Pressable
            testID="catalog-back-to-tree"
            accessibilityRole="button"
            onPress={() => setSelection(null)}
            className="flex-row items-center active:opacity-80"
          >
            <Ionicons name="arrow-back" size={20} color={brandColors.dark} />
            <Text className="font-brand-bold ml-1 text-base text-brand-dark">Categorías</Text>
          </Pressable>
          <Text
            testID="catalog-list-title"
            numberOfLines={1}
            className="ml-3 flex-1 text-right font-brand text-sm text-brand-dark/60"
          >
            {title}
          </Text>
        </View>

        {productsQuery.isLoading ? (
          <ListSkeleton />
        ) : productsQuery.isError ? (
          <ErrorState onRetry={() => productsQuery.refetch()} testID="catalog-list-error" />
        ) : products.length === 0 ? (
          <EmptyState title="Sin productos" subtitle="Esta categoría aún no tiene productos." />
        ) : (
          <ScrollView className="flex-1" testID="catalog-list-scroll">
            <ProductGrid
              products={products}
              onSelectProduct={(product) => router.push(`/product/${product.slug}`)}
            />
            <View className="h-brand-6" />
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
      {categoriesQuery.isLoading ? (
        <TreeSkeleton />
      ) : categoriesQuery.isError ? (
        <ErrorState onRetry={() => categoriesQuery.refetch()} testID="catalog-tree-error" />
      ) : categories.length === 0 ? (
        <EmptyState title="Sin categorías" />
      ) : (
        <ScrollView className="flex-1" testID="catalog-tree-scroll">
          <CategoryTree categories={categories} onSelect={setSelection} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
