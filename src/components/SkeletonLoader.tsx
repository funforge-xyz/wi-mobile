import { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useAppSelector } from '../hooks/redux';
import { getTheme } from '../theme';

interface SkeletonLoaderProps {
  width: number | string;
  height: number | string;
  borderRadius?: number;
  style?: any;
  forceDarkTheme?: boolean;
}

export default function SkeletonLoader({ width, height, borderRadius = 0, style, forceDarkTheme = false }: SkeletonLoaderProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const currentTheme = getTheme(forceDarkTheme || isDarkMode);

  // Use theme colors or force dark theme
  const skeletonColor = forceDarkTheme ? '#1a1a1a' : currentTheme.skeleton;
  const shimmerColor = forceDarkTheme ? '#2a2a2a' : currentTheme.shimmer;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      })
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  // Calculate numeric width for animation - use 200 as default for percentage widths
  const numericWidth = typeof width === 'string' ? 200 : width;
  
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-numericWidth * 1.5, numericWidth * 1.5],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: skeletonColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: shimmerColor,
            transform: [{ translateX }],
            width: typeof width === 'string' ? '50%' : width * 0.5,
            opacity: 0.8,
          },
        ]}
      />
    </View>
  );
}