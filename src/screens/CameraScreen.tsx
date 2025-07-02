
import React, { useState } from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useAppSelector } from '../hooks/redux';
import { getTheme } from '../theme';
import CustomCameraView from '../components/CustomCameraView';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
  const [capturedMedia, setCapturedMedia] = useState<{uri: string, type: 'image' | 'video'} | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const navigation = useNavigation();
  const { theme } = useAppSelector(state => state.theme);
  const currentTheme = getTheme(theme);

  // Initialize video player for video preview
  const player = useVideoPlayer(capturedMedia?.uri || '', player => {
    player.loop = true;
    player.muted = isMuted;
  });

  const handleCameraClose = () => {
    navigation.goBack();
  };

  const handleMediaCaptured = (uri: string, type: 'image' | 'video') => {
    console.log(`Media captured: ${type} - ${uri}`);
    setCapturedMedia({ uri, type });
    setShowPreview(true);
    setIsPlaying(false);
  };

  const handleRetake = () => {
    setCapturedMedia(null);
    setShowPreview(false);
    setIsPlaying(false);
  };

  const handleNext = () => {
    if (capturedMedia) {
      // Pause video before navigating
      if (capturedMedia.type === 'video' && player && isPlaying) {
        player.pause();
        setIsPlaying(false);
      }
      
      // Navigate to create post screen with the media
      navigation.navigate('CreatePost', { 
        mediaUri: capturedMedia.uri, 
        mediaType: capturedMedia.type 
      });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (player) {
      player.muted = !isMuted;
    }
  };

  const togglePlayPause = () => {
    if (player) {
      if (isPlaying) {
        player.pause();
      } else {
        player.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'black',
    },
    previewContainer: {
      flex: 1,
      backgroundColor: 'black',
    },
    mediaContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: width,
      height: height,
      resizeMode: 'cover',
    },
    video: {
      width: width,
      height: height,
    },
    topControls: {
      position: 'absolute',
      top: 60,
      left: 20,
      right: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 10,
    },
    closeButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    muteButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    bottomControls: {
      position: 'absolute',
      bottom: 50,
      left: 20,
      right: 20,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      zIndex: 10,
    },
    retakeButton: {
      backgroundColor: 'rgba(255,255,255,0.3)',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 25,
      borderWidth: 2,
      borderColor: 'white',
    },
    retakeButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    nextButton: {
      backgroundColor: currentTheme.primary,
      paddingHorizontal: 30,
      paddingVertical: 12,
      borderRadius: 25,
    },
    nextButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {showPreview && capturedMedia ? (
        // Preview Mode
        <View style={styles.previewContainer}>
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleRetake}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>

            {/* Mute button for video */}
            {capturedMedia.type === 'video' && (
              <TouchableOpacity
                style={styles.muteButton}
                onPress={toggleMute}
              >
                <Ionicons 
                  name={isMuted ? "volume-mute" : "volume-high"} 
                  size={24} 
                  color="white" 
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Media Display */}
          <View style={styles.mediaContainer}>
            {capturedMedia.type === 'image' ? (
              <Image source={{ uri: capturedMedia.uri }} style={styles.image} />
            ) : (
              <View style={{ position: 'relative' }}>
                <VideoView
                  style={styles.video}
                  player={player}
                  allowsFullscreen={false}
                  allowsPictureInPicture={false}
                  nativeControls={false}
                />
                {/* Play/Pause Button Overlay */}
                <TouchableOpacity
                  onPress={togglePlayPause}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: [{ translateX: -30 }, { translateY: -30 }],
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={30} 
                    color="white" 
                  />
                </TouchableOpacity>
              </View>
            )}
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
        <CustomCameraView
          onClose={handleCameraClose}
          onMediaCaptured={handleMediaCaptured}
          currentTheme={currentTheme}
        />
      )}
    </SafeAreaView>
  );
}
