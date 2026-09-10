import { Image as ExpoImage } from 'expo-image';
import { View } from 'react-native';

import { radii } from '@/theme/tokens';
import { resolveMediaUrl } from '@/core/utils/media-url';

export interface ImageProps {
  source: string | null | undefined;
  width?: number;
  height?: number;
  rounded?: boolean;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  accessibilityLabel?: string;
  testID?: string;
}

const PLACEHOLDER_BG = 'rgb(245, 245, 245)';

export function Image({
  source,
  width = 200,
  height = 200,
  rounded = false,
  contentFit = 'cover',
  accessibilityLabel,
  testID,
}: ImageProps) {
  const url = resolveMediaUrl(source);
  if (!url) {
    return (
      <View
        testID={testID ?? 'image-placeholder'}
        accessibilityLabel={accessibilityLabel}
        accessible={!!accessibilityLabel}
        style={{
          width,
          height,
          backgroundColor: PLACEHOLDER_BG,
          borderRadius: rounded ? radii.pill : radii.sm,
        }}
      />
    );
  }
  return (
    <ExpoImage
      source={{ uri: url }}
      style={{
        width,
        height,
        borderRadius: rounded ? radii.pill : radii.sm,
        backgroundColor: PLACEHOLDER_BG,
      }}
      contentFit={contentFit}
      accessibilityLabel={accessibilityLabel}
      accessible={!!accessibilityLabel}
      testID={testID ?? 'expo-image'}
    />
  );
}
