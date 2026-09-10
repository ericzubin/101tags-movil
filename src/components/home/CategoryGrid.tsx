import { Dimensions, Pressable, Text, View } from 'react-native';

import { Image } from '@/components/ui/Image';
import type { HomeContentItem } from '@/core/models/home-content.model';

const TILE_HEIGHT = 96;

export interface CategoryGridProps {
  items: HomeContentItem[];
  onSelect?: (slug: string) => void;
  testID?: string;
}

export function CategoryGrid({ items, onSelect, testID }: CategoryGridProps) {
  const tileWidth = Math.floor(Dimensions.get('window').width / 2) - 16;

  if (items.length === 0) return null;

  return (
    <View className="flex-row flex-wrap px-brand-1" testID={testID ?? 'category-grid'}>
      {items.map((item) => {
        const slug = item.category?.slug;
        const label = item.title ?? item.category?.name ?? 'Categoría';
        return (
          <Pressable
            key={item.id}
            testID={slug ? `category-tile-${slug}` : `category-tile-${item.id}`}
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={() => {
              if (slug) onSelect?.(slug);
            }}
            className="w-1/2 p-brand-1"
          >
            <View className="overflow-hidden rounded-brand-lg bg-brand-white">
              <Image
                source={item.image}
                width={tileWidth}
                height={TILE_HEIGHT}
                contentFit="cover"
              />
              <Text
                numberOfLines={1}
                className="font-brand-bold p-brand-2 text-sm text-brand-dark"
              >
                {label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
