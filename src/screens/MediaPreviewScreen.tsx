
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { useAppSelector } from '../hooks/redux';
import { getTheme } from '../theme';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface MediaPreviewRouteParams {
  mediaUri: string;
  mediaType: 'image' | 'video';
}

export default function MediaPreviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { mediaUri, mediaType } = route.params as MediaPreviewRouteParams;
  
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const currentTheme = getTheme(isDarkMode);

  const handleRetake = () => {
    // Navigate back to camera instead of the previous screen
    navigation.navigate('Camera' as never);
  };

  const handleNext = () => {
    navigation.navigate('CreatePost' as never, { 
      mediaUri, 
      mediaType 
    } as never);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'black' }]}>
      {/* Media Display */}
      <View style={styles.mediaContainer}>
        {mediaType === 'image' ? (
          <Image 
            source={{ uri: mediaUri }} 
            style={styles.media}
            resizeMode="contain"
          />
        ) : (
          <Video
            source={{ uri: mediaUri }}
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
          onPress={handleRetake}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
