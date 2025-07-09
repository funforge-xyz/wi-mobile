
import React, { useEffect, useRef } from 'react';
import { View, Animated, Image } from 'react-native';
import { useAppSelector } from '../hooks/redux';
import { getTheme } from '../theme';

interface PulsingLogoProps {
  size?: number;
}

const PulsingLogo: React.FC<PulsingLogoProps> = ({ size = 60 }) => {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const colors = getTheme(isDarkMode);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };

    pulse();
  }, [pulseAnim]);

  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Animated.View style={{
        transform: [{ scale: pulseAnim }],
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        elevation: 5,
        padding: size * 0.1,
      }}>
        <Image 
          source={require('../../assets/images/app_icon.png')}
          style={{
            width: size * 0.8,
            height: size * 0.8,
          }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

export default PulsingLogo;
