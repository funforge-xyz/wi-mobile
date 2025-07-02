
import React, { useState } from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { useAppSelector } from '../hooks/redux';
import { getTheme } from '../theme';
import CustomCameraModal from '../components/CustomCameraModal';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
  const navigation = useNavigation();
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const currentTheme = getTheme(isDarkMode);
  
  const [cameraVisible, setCameraVisible] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<{
    uri: string;
    type: 'image' | 'video';
  } | null>(null);

  const handleMediaCaptured = (mediaUri: string, mediaType: 'image' | 'video') => {
    console.log('Media captured, showing preview:', mediaUri, mediaType);
    setCapturedMedia({ uri: mediaUri, type: mediaType });
    setCameraVisible(false);
    setPreviewMode(true);
  };

  const handleCameraClose = () => {
    // Go back to previous screen instead of Root
    navigation.goBack();
  };

  const handlePreviewClose = () => {
    // Close preview and show camera again
    setPreviewMode(false);
    setCapturedMedia(null);
    setCameraVisible(true);
  };

  const handleNext = () => {
    if (capturedMedia) {
      navigation.navigate('CreatePost' as never, { 
        mediaUri: capturedMedia.uri, 
        mediaType: capturedMedia.type 
      } as never);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
      {previewMode && capturedMedia ? (
        // Preview Mode
        <View style={styles.previewContainer}>
          {/* Media Display */}
          <View style={styles.mediaContainer}>
            {capturedMedia.type === 'image' ? (
              <Image 
                source={{ uri: capturedMedia.uri }} 
                style={styles.media}
                resizeMode="contain"
              />
            ) : (
              <Video
                source={{ uri: capturedMedia.uri }}
                style={styles.media}
                resizeMode="contain"
                shouldPlay={true}
                isLooping={true}
                isMuted={false}
              />
            )}
          </View>

          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handlePreviewClose}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Camera Mode
        <CustomCameraModal
          visible={cameraVisible}
          onClose={handleCameraClose}
          onMediaCaptured={handleMediaCaptured}
          currentTheme={currentTheme}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  previewContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: width,
    height: height,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
