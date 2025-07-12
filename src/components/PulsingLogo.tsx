
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

  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
    }}>
        <Image 
          source={require('../../assets/images/app_icon.png')}
          style={{
            width: size * 0.8,
            height: size * 0.8,
          }}
          resizeMode="contain"
        />
    </View>
  );
};

export default PulsingLogo;
