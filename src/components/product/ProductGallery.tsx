import { useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { Image } from '@/components/ui/Image';

export interface GalleryImage {
  path: string;
  url: string;
}

export interface ProductGalleryProps {
  images: GalleryImage[];
  fallbackImage?: string | null;
  width?: number;
  testID?: string;
}

export function ProductGallery({
  images,
  fallbackImage = null,
  width,
  testID,
}: ProductGalleryProps) {
  const { width: windowWidth } = useWindowDimensions();
  const itemWidth = width ?? windowWidth;
  const [index, setIndex] = useState(0);

  const sources =
    images.length > 0 ? images.map((image) => image.url) : fallbackImage ? [fallbackImage] : [];

  if (sources.length === 0) {
    return (
      <Image source={null} width={itemWidth} height={itemWidth} testID="gallery-placeholder" />
    );
  }

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / itemWidth);
    setIndex(Math.min(Math.max(next, 0), sources.length - 1));
  };

  return (
    <View testID={testID ?? 'product-gallery'}>
      <ScrollView
        testID="gallery-scroll"
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
      >
        {sources.map((source, i) => (
          <Image
            key={`${source}-${i}`}
            source={source}
            width={itemWidth}
            height={itemWidth}
            testID={`gallery-image-${i}`}
          />
        ))}
      </ScrollView>
      <View className="absolute bottom-3 right-3 rounded-brand-pill bg-brand-dark/70 px-3 py-1">
        <Text testID="gallery-indicator" className="font-brand text-xs text-white">
          {`${index + 1}/${sources.length}`}
        </Text>
      </View>
    </View>
  );
}
