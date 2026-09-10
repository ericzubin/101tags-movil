import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import { radii } from '@/theme/tokens';

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  rounded?: boolean;
  testID?: string;
}

const SKELETON_BG = 'rgb(229, 231, 235)';

export function Skeleton({ width = '100%', height = 16, rounded = false, testID }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      testID={testID ?? 'skeleton'}
      style={{
        width,
        height,
        opacity,
        backgroundColor: SKELETON_BG,
        borderRadius: rounded ? radii.pill : radii.sm,
      }}
    />
  );
}
