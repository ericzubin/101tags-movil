import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { Image } from '@/components/ui/Image';
import type { HomeContentItem } from '@/core/models/home-content.model';

const HERO_HEIGHT = 200;

export function toInternalHeroRoute(link: string | null | undefined): string | null {
  if (!link) return null;
  if (!link.startsWith('/') || link.startsWith('//')) return null;
  if (link.startsWith('/tienda')) return null;
  return link;
}

export interface HeroCarouselProps {
  items: HomeContentItem[];
  testID?: string;
}

export function HeroCarousel({ items, testID }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const { width } = useWindowDimensions();

  if (items.length === 0) return null;

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(Math.min(Math.max(next, 0), items.length - 1));
  };

  return (
    <View testID={testID ?? 'hero-carousel'}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
      >
        {items.map((item) => {
          const route = toInternalHeroRoute(item.link);
          return (
            <Pressable
              key={item.id}
              testID={`hero-item-${item.id}`}
              accessibilityRole="button"
              accessibilityLabel={item.title ?? item.alt ?? 'Promoción'}
              accessibilityState={{ disabled: !route }}
              disabled={!route}
              onPress={() => {
                if (route) router.push(route);
              }}
              style={{ width }}
            >
              <Image source={item.image} width={width} height={HERO_HEIGHT} contentFit="cover" />
              {item.title || item.subtitle ? (
                <View className="absolute bottom-0 left-0 right-0 bg-black/50 p-brand-4">
                  {item.title ? (
                    <Text className="font-brand-bold text-lg text-white">{item.title}</Text>
                  ) : null}
                  {item.subtitle ? (
                    <Text className="font-brand text-sm text-white">{item.subtitle}</Text>
                  ) : null}
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
      <View
        testID="hero-counter"
        className="absolute right-brand-3 top-brand-3 rounded-brand-pill bg-black/60 px-brand-3 py-brand-1"
      >
        <Text className="font-brand text-xs text-white">
          {activeIndex + 1}/{items.length}
        </Text>
      </View>
    </View>
  );
}
