import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { CategoryTree } from '@/components/catalog/CategoryTree';
import { EMPTY_FILTERS, FiltersSheet, type FiltersValue } from '@/components/catalog/FiltersSheet';
import { ProductCard } from '@/components/catalog/ProductCard';
import { SortChips, type SortKey } from '@/components/catalog/SortChips';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { CatalogFilters, Category, ProductSummary } from '@/core/models/catalog.model';
import { catalogKeys } from '@/core/query/keys';
import { catalogService } from '@/core/services/catalog-service';
import { brandColors } from '@/theme/tokens';

export const DEFAULT_SEGMENT = 'basicos' as const;

const SEARCH_DEBOUNCE_MS = 350;

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

function dedupeBySlug(products: ProductSummary[]): ProductSummary[] {
  const seen = new Set<string>();
  const out: ProductSummary[] = [];
  for (const product of products) {
    if (seen.has(product.slug)) continue;
    seen.add(product.slug);
    out.push(product);
  }
  return out;
}

function countActiveFilters(filters: FiltersValue): number {
  return (
    filters.sizes.length +
    filters.colors.length +
    (filters.priceMin !== undefined ? 1 : 0) +
    (filters.priceMax !== undefined ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.onSale ? 1 : 0)
  );
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

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [filters, setFilters] = useState<FiltersValue>(EMPTY_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const categoriesQuery = useQuery({
    queryKey: catalogKeys.categories(DEFAULT_SEGMENT),
    queryFn: () => catalogService.getCategories(DEFAULT_SEGMENT),
  });

  const categorySlug = selection?.kind === 'category' ? selection.slug : undefined;

  const filtersQuery = useQuery({
    queryKey: catalogKeys.filters(DEFAULT_SEGMENT, categorySlug),
    queryFn: () => catalogService.getFilters(DEFAULT_SEGMENT, categorySlug),
    enabled: sheetOpen,
  });

  const combinedFilters: CatalogFilters = {
    category: selection?.kind === 'category' ? [selection.slug] : undefined,
    subcategory: selection?.kind === 'subcategory' ? [selection.slug] : undefined,
    q: debouncedSearch || undefined,
    sort,
    sizes: filters.sizes.length > 0 ? filters.sizes : undefined,
    colors: filters.colors.length > 0 ? filters.colors : undefined,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
    inStock: filters.inStock,
    onSale: filters.onSale,
  };

  const productsQuery = useInfiniteQuery({
    queryKey: catalogKeys.products(combinedFilters),
    queryFn: ({ pageParam, signal }) =>
      catalogService.getProducts({ ...combinedFilters, page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.lastPage ? lastPage.currentPage + 1 : undefined,
    enabled: !!selection,
  });

  const products = useMemo(
    () => dedupeBySlug(productsQuery.data?.pages.flatMap((page) => page.data) ?? []),
    [productsQuery.data],
  );

  const categories = categoriesQuery.data?.data ?? [];
  const activeFiltersCount = countActiveFilters(filters);

  if (selection) {
    const title = findCategoryName(categoriesQuery.data?.data, selection.slug) ?? selection.name;
    const handleApplyFilters = (next: FiltersValue) => {
      setFilters(next);
      setSheetOpen(false);
    };

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

        <View className="border-b border-brand-dark/10 bg-white">
          <View className="flex-row items-center px-brand-4 pt-brand-3">
            <TextInput
              testID="catalog-search-input"
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar productos"
              placeholderTextColor={brandColors.dark}
              returnKeyType="search"
              autoCorrect={false}
              accessibilityLabel="Buscar productos"
              className="mr-brand-3 flex-1 rounded-brand-pill border border-brand-dark/20 px-brand-4 py-brand-2 font-brand text-sm text-brand-dark"
            />
            <Pressable
              testID="catalog-open-filters"
              accessibilityRole="button"
              onPress={() => setSheetOpen(true)}
              className="flex-row items-center rounded-brand-pill bg-brand-dark px-brand-4 py-brand-2 active:opacity-80"
            >
              <Ionicons name="options-outline" size={16} color={brandColors.white} />
              <Text className="ml-1 font-brand-bold text-sm text-white">Filtros</Text>
              {activeFiltersCount > 0 ? (
                <View className="ml-brand-1 rounded-brand-pill bg-brand-primary px-brand-2">
                  <Text testID="catalog-active-filters-count" className="font-brand-bold text-xs text-white">
                    {activeFiltersCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </View>
          <SortChips value={sort} onChange={setSort} />
        </View>

        {productsQuery.isLoading ? (
          <ListSkeleton />
        ) : productsQuery.isError && !productsQuery.data ? (
          <ErrorState onRetry={() => productsQuery.refetch()} testID="catalog-list-error" />
        ) : (
          <FlatList
            testID="catalog-product-list"
            data={products}
            keyExtractor={(product) => String(product.id)}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            initialNumToRender={12}
            onEndReachedThreshold={0.5}
            onEndReached={() => {
              if (productsQuery.hasNextPage && !productsQuery.isFetchingNextPage) {
                void productsQuery.fetchNextPage();
              }
            }}
            renderItem={({ item }) => (
              <View testID={`catalog-list-item-${item.slug}`} className="w-1/2 p-1">
                <ProductCard
                  product={item}
                  onPress={(product) => router.push(`/product/${product.slug}`)}
                  className="mr-0 w-full"
                />
              </View>
            )}
            ListFooterComponent={
              productsQuery.isFetchingNextPage ? (
                <ActivityIndicator
                  testID="catalog-list-loading-more"
                  color={brandColors.primary}
                  className="py-brand-4"
                />
              ) : null
            }
            ListEmptyComponent={
              <EmptyState
                title="Sin productos"
                subtitle="Esta categoría aún no tiene productos."
              />
            }
          />
        )}

        <FiltersSheet
          visible={sheetOpen}
          options={filtersQuery.data ?? null}
          value={filters}
          loading={filtersQuery.isLoading}
          onApply={handleApplyFilters}
          onClear={() => setFilters(EMPTY_FILTERS)}
          onClose={() => setSheetOpen(false)}
        />
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
