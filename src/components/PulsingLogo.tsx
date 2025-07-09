
import React, { useEffect, useRef } from 'react';
import { View, Animated, Text } from 'react-native';
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
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
      }}>
        <Text style={{
          fontSize: size * 0.3,
          fontWeight: 'bold',
          color: '#FFFFFF',
          letterSpacing: 1,
        }}>
          Wi
        </Text>
      </Animated.View>
    </View>
  );
};

export default PulsingLogo;
