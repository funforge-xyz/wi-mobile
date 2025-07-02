
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

interface CustomCameraViewProps {
  onClose: () => void;
  onMediaCaptured: (uri: string, type: 'image' | 'video') => void;
  currentTheme: any;
}

export default function CustomCameraView({
  onClose,
  onMediaCaptured,
  currentTheme,
}: CustomCameraViewProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const cameraRef = useRef<CameraView>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingAnimationRef = useRef(new Animated.Value(1)).current;
  const recordingPromiseRef = useRef<Promise<any> | null>(null);
  const { t } = useTranslation();

  const MAX_RECORDING_TIME = 15; // 15 seconds

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

  useEffect(() => {
    (async () => {
      try {
        console.log('Requesting camera permissions...');

        if (!cameraPermission?.granted) {
          const cameraResult = await requestCameraPermission();
          console.log('Camera permission status:', cameraResult?.status);
        }

        if (!microphonePermission?.granted) {
          const micResult = await requestMicrophonePermission();
          console.log('Microphone permission status:', micResult?.status);
        }

        const hasPerms = cameraPermission?.granted && microphonePermission?.granted;
        console.log('Has all permissions:', hasPerms);
        setHasPermission(hasPerms);
      } catch (error) {
        console.error('Error requesting permissions:', error);
        setHasPermission(false);
      }
    })();
  }, [cameraPermission, microphonePermission]);

  useEffect(() => {
    if (isRecording) {
      console.log('Starting recording UI effects...');
      
      // Start recording animation (pulsing red circle)
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnimationRef, {
            toValue: 0.7,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(recordingAnimationRef, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => {
          const newTime = prevTime + 1;
          console.log('Recording time:', newTime);
          if (newTime >= MAX_RECORDING_TIME) {
            console.log('Max recording time reached, stopping...');
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return newTime;
        });
      }, 1000);
    }

    // Cleanup function
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };
  }, [isRecording]);

  const cleanupRecording = () => {
    console.log('Cleaning up recording state...');
    setIsRecording(false);
    setRecordingTime(0);
    
    // Stop animation
    recordingAnimationRef.stopAnimation();
    recordingAnimationRef.setValue(1);
    
    // Clear timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const processRecordedVideo = (videoResult: any) => {
    console.log('Processing recorded video:', videoResult);
    
    if (videoResult && videoResult.uri) {
      console.log('Video URI:', videoResult.uri);
      console.log('Calling onMediaCaptured with video...');
      
      // Clean up first
      cleanupRecording();
      
      // Then trigger the callback
      onMediaCaptured(videoResult.uri, 'video');
    } else {
      console.error('No video URI in result:', videoResult);
      Alert.alert(t('common.error'), t('camera.errorRecordingVideo', 'Failed to record video'));
      cleanupRecording();
    }
  };

  const takePicture = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        console.log('Taking picture...');
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          skipProcessing: false,
          mirrorImage: false,
        });
        console.log('Picture taken:', photo.uri);
        onMediaCaptured(photo.uri, 'image');
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert(t('common.error'), t('camera.errorTakingPicture', 'Failed to take picture'));
      }
    }
  };

  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        console.log('Starting recording...');
        setIsRecording(true);
        setRecordingTime(0);

        const recordingOptions = {
          maxDuration: MAX_RECORDING_TIME,
          quality: '720p' as const,
        };

        console.log('Recording options:', recordingOptions);
        
        // Start recording and store the promise
        recordingPromiseRef.current = cameraRef.current.recordAsync(recordingOptions);
        
        // Wait for recording to complete
        const video = await recordingPromiseRef.current;
        console.log('Recording completed:', video);
        
        // Process the video
        processRecordedVideo(video);
        
      } catch (error) {
        console.error('Error during recording:', error);
        cleanupRecording();
        Alert.alert(t('common.error'), t('camera.errorRecordingVideo', 'Failed to record video'));
      } finally {
        recordingPromiseRef.current = null;
      }
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      try {
        console.log('Stopping recording manually...');
        
        // Stop the recording
        await cameraRef.current.stopRecording();
        console.log('Recording stopped manually');
        
        // The recordAsync promise should resolve now, but let's handle it explicitly
        if (recordingPromiseRef.current) {
          try {
            const video = await recordingPromiseRef.current;
            console.log('Manual stop - video result:', video);
            processRecordedVideo(video);
          } catch (error) {
            console.error('Error getting video after manual stop:', error);
            cleanupRecording();
          }
        } else {
          console.log('No recording promise to wait for');
          cleanupRecording();
        }
        
      } catch (error) {
        console.error('Error stopping recording:', error);
        cleanupRecording();
      }
    }
  };

  const toggleCameraType = () => {
    setCameraType(cameraType === 'back' ? 'front' : 'back');
  };

  if (hasPermission === null) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'black' 
      }}>
        <Text style={{ color: 'white', fontSize: 18 }}>
          {t('camera.loading', 'Loading camera...')}
        </Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: currentTheme.background 
      }}>
        <Text style={{ color: currentTheme.text, marginBottom: 20 }}>
          {t('camera.permissionRequired', 'Camera permission is required')}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: currentTheme.primary,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8,
          }}
          onPress={onClose}
        >
          <Text style={{ color: currentTheme.background }}>
            {t('common.close', 'Close')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: 'black'
    }}>
      {/* Camera View */}
      <CameraView
        style={{ 
          flex: 1,
          width: '100%',
          height: '100%',
          transform: cameraType === 'front' ? [{ scaleX: -1 }] : undefined,
        }}
        facing={cameraType}
        ref={cameraRef}
      />

      {/* Top Controls */}
      <View
        style={{
          position: 'absolute',
          top: 60,
          left: 20,
          right: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          onPress={onClose}
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>

        {/* Recording Timer */}
        {isRecording && (
          <View
            style={{
              backgroundColor: 'rgba(255,0,0,0.8)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: 'white',
                marginRight: 8,
              }}
            />
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
              {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={toggleCameraType}
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="camera-reverse" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Mode Selection */}
      <View
        style={{
          position: 'absolute',
          bottom: 150,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: 25,
            padding: 4,
          }}
        >
          <TouchableOpacity
            onPress={() => setCameraMode('photo')}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: cameraMode === 'photo' ? 'white' : 'transparent',
            }}
          >
            <Text
              style={{
                color: cameraMode === 'photo' ? 'black' : 'white',
                fontSize: 16,
                fontWeight: '600',
              }}
            >
              Photo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setCameraMode('video')}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: cameraMode === 'video' ? 'white' : 'transparent',
            }}
          >
            <Text
              style={{
                color: cameraMode === 'video' ? 'black' : 'white',
                fontSize: 16,
                fontWeight: '600',
              }}
            >
              Video
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Controls */}
      <View
        style={{
          position: 'absolute',
          bottom: 50,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        {cameraMode === 'photo' ? (
          /* Photo Capture Button */
          <TouchableOpacity
            onPress={takePicture}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(255,255,255,0.3)',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 4,
              borderColor: 'white',
            }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: 'white',
              }}
            />
          </TouchableOpacity>
        ) : (
          /* Video Controls */
          <TouchableOpacity
            onPress={isRecording ? stopRecording : startRecording}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(255,255,255,0.3)',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 4,
              borderColor: 'white',
            }}
          >
            {!isRecording ? (
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: 'red',
                }}
              />
            ) : (
              <Animated.View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: 'red',
                  transform: [{ scale: recordingAnimationRef }],
                }}
              />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
