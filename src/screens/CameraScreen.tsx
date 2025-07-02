
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '../hooks/redux';
import { getTheme } from '../theme';
import CustomCameraModal from '../components/CustomCameraModal';
import { useNavigation } from '@react-navigation/native';

export default function CameraScreen() {
  const navigation = useNavigation();
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const currentTheme = getTheme(isDarkMode);
  const [cameraVisible, setCameraVisible] = useState(true);

  const handleMediaCaptured = (mediaUri: string, mediaType: 'image' | 'video') => {
    console.log('Media captured, navigating to preview:', mediaUri, mediaType);
    // Close the camera modal first, then navigate
    setCameraVisible(false);
    // Navigate to preview screen
    navigation.navigate('MediaPreview' as never, { 
      mediaUri, 
      mediaType 
    } as never);
  };

  const handleCameraClose = () => {
    // Navigate to home screen (Root navigator)
    navigation.navigate('Root' as never);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
      <CustomCameraModal
        visible={cameraVisible}
        onClose={handleCameraClose}
        onMediaCaptured={handleMediaCaptured}
        currentTheme={currentTheme}
      />
    </SafeAreaView>
  );
}
