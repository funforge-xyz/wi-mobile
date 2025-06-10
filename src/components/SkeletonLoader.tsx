
import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useAppSelector } from '../hooks/redux';
import { COLORS } from '../config/constants';

interface SkeletonLoaderProps {
  width: number;
  height: number;
  borderRadius?: number;
  style?: any;
}

export default function SkeletonLoader({ width, height, borderRadius = 0, style }: SkeletonLoaderProps) {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: currentTheme.skeleton,
          opacity,
        },
        style,
      ]}
    />
  );
}

const lightTheme = {
  skeleton: '#E1E9EE',
};

const darkTheme = {
  skeleton: '#2A2A2A',
};
