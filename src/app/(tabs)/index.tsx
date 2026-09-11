import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FeaturedProductsRow } from '@/components/home/FeaturedProductsRow';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { normalizeHomeContent } from '@/components/home/normalize-home-content';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ProductSummary } from '@/core/models/catalog.model';
import type { HomeContentItem } from '@/core/models/home-content.model';
import { catalogKeys, homeKeys } from '@/core/query/keys';
import { catalogService } from '@/core/services/catalog-service';
import { homeService } from '@/core/services/home-service';

function HomeSkeleton() {
  return (
    <View className="flex-1 bg-brand-medium p-brand-4" testID="home-skeleton">
      <Skeleton height={200} rounded />
      <View className="mt-brand-4 flex-row justify-between">
        <View className="w-[48%]">
          <Skeleton height={120} rounded />
        </View>
        <View className="w-[48%]">
          <Skeleton height={120} rounded />
        </View>
      </View>
      <View className="mt-brand-6">
        <Skeleton width="60%" height={20} />
      </View>
      <View className="mt-brand-3 flex-row">
        <View className="mr-brand-3">
          <Skeleton width={160} height={200} rounded />
        </View>
        <Skeleton width={160} height={200} rounded />
      </View>
    </View>
  );
}

function RibbonBand({ items }: { items: HomeContentItem[] }) {
  const first = items[0];
  if (!first) return null;

  return (
    <View
      className="mx-brand-4 mt-brand-6 rounded-brand-lg bg-brand-dark p-brand-4"
      testID="home-ribbon"
    >
      <Text className="text-center font-brand-bold text-base text-white">
        {first.title ?? 'Novedades 101tags'}
      </Text>
      {first.subtitle ? (
        <Text className="mt-brand-1 text-center font-brand text-sm text-white/80">
          {first.subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export default function HomeTab() {
  const router = useRouter();
  const homeQuery = useQuery({
    queryKey: homeKeys.content(),
    queryFn: () => homeService.getHomeContent(),
  });
  const featuredQuery = useQuery({
    queryKey: catalogKeys.products({ featured: true, perPage: 8 }),
    queryFn: () => catalogService.getProducts({ featured: true, perPage: 8 }),
  });

  const home = normalizeHomeContent(homeQuery.data?.data);
  const featured = featuredQuery.data?.data ?? [];

  const isLoading = homeQuery.isLoading || featuredQuery.isLoading;
  const isError = homeQuery.isError && featuredQuery.isError;

  const retry = () => {
    void homeQuery.refetch();
    void featuredQuery.refetch();
  };

  if (isLoading) return <HomeSkeleton />;
  if (isError) return <ErrorState onRetry={retry} testID="home-error" />;

  const hero = home?.hero ?? [];
  const categories = home?.featuredCategory ?? [];
  const ribbon = home?.ribbon ?? [];

  const isEmpty =
    hero.length === 0 && categories.length === 0 && ribbon.length === 0 && featured.length === 0;

  if (isEmpty) {
    return (
      <View className="flex-1 bg-brand-medium">
        <EmptyState
          title="Bienvenido a 101tags"
          subtitle="Pronto verás aquí nuestras novedades."
          testID="home-empty"
        />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-brand-medium" testID="home-scroll">
      <HeroCarousel items={hero} />
      <CategoryGrid
        items={categories}
        onSelect={(slug) => router.push(`/(tabs)/catalog?category=${slug}`)}
      />
      <FeaturedProductsRow
        products={featured}
        onSelectProduct={(product: ProductSummary) => router.push(`/product/${product.slug}`)}
      />
      <RibbonBand items={ribbon} />
      <View className="h-brand-6" />
    </ScrollView>
  );
}
