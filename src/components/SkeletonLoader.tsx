import { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useAppSelector } from '../hooks/redux';

interface SkeletonLoaderProps {
  width: number;
  height: number;
  borderRadius?: number;
  style?: any;
}

export default function SkeletonLoader({ width, height, borderRadius = 0, style }: SkeletonLoaderProps) {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      })
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: currentTheme.skeleton,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: currentTheme.shimmer,
            transform: [{ translateX }],
            width: width * 0.3,
          },
        ]}
      />
    </View>
  );
}

const lightTheme = {
  skeleton: '#E1E9EE',
  shimmer: '#F5F5F5',
};

const darkTheme = {
  skeleton: '#2A2A2A',
  shimmer: '#3A3A3A',
};