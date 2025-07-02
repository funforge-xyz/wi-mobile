
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Alert,
  Animated,
  PanResponder,
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
  console.log('CustomCameraView render');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingAnimationRef = useRef(new Animated.Value(1)).current;
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
          if (newTime >= MAX_RECORDING_TIME) {
            console.log('Max recording time reached, stopping...');
            stopRecording();
            return prevTime; // Keep the time at max, don't reset to 0 yet
          }
          return newTime;
        });
      }, 1000);
    } else {
      // Stop animation and timer
      recordingAnimationRef.stopAnimation();
      recordingAnimationRef.setValue(1);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingTime(0);
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (recordingTimeout.current) {
        clearTimeout(recordingTimeout.current);
        recordingTimeout.current = null;
      }
    };
  }, [isRecording]);

  const pressStartTime = useRef<number | null>(null);
  const recordingTimeout = useRef<NodeJS.Timeout | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => false,

      onPanResponderGrant: () => {
        // Record the press start time
        pressStartTime.current = Date.now();

        // Set a timeout to start recording after 1 second
        recordingTimeout.current = setTimeout(() => {
          startRecording();
        }, 1000);
      },

      onPanResponderRelease: () => {
        // Clear the recording timeout
        if (recordingTimeout.current) {
          clearTimeout(recordingTimeout.current);
          recordingTimeout.current = null;
        }

        const pressEndTime = Date.now();
        const pressDuration = pressStartTime.current ? pressEndTime - pressStartTime.current : 0;

        console.log('Button released - isRecording:', isRecording, 'pressDuration:', pressDuration);

        if (isRecording) {
          // Stop recording if currently recording
          console.log('Stopping recording from button release');
          stopRecording();
        } else if (pressDuration < 1000) {
          // Take photo if press was less than 1 second and not recording
          console.log('Taking photo');
          takePicture();
        }

        // Reset press start time
        pressStartTime.current = null;
      },
    })
  ).current;

  const takePicture = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        console.log('Taking picture...');
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          skipProcessing: false,
          mirrorImage: false, // Don't mirror front camera images
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

        // Start recording animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(recordingAnimationRef, {
              toValue: 0.3,
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

        const video = await cameraRef.current.recordAsync({
          maxDuration: MAX_RECORDING_TIME,
          quality: '720p',
        });

        console.log('Recording completed automatically:', video.uri);
        setIsRecording(false);
        onMediaCaptured(video.uri, 'video');
      } catch (error) {
        console.error('Error recording video:', error);
        setIsRecording(false);
        Alert.alert(t('common.error'), t('camera.errorRecordingVideo', 'Failed to record video'));
      }
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      try {
        console.log('Stopping recording...');
        setIsRecording(false); // Set this immediately to stop timer and animation
        
        // Stop the recording
        cameraRef.current.stopRecording();
        
        // Note: The video result will be handled in the recordAsync promise resolution
        // in the startRecording function
      } catch (error) {
        console.error('Error stopping recording:', error);
        setIsRecording(false);
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
          height: '100%'
        }}
        facing={cameraType}
        ref={cameraRef}
      />

      {/* UI Overlay - Outside CameraView */}
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

        {/* Recording Timer - moved to center */}
        {isRecording ? (
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
        ) : (
          <View style={{ width: 50 }} />
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
        {/* Capture Button */}
        <View
          {...panResponder.panHandlers}
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
          <Animated.View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: isRecording ? 'red' : 'white',
              transform: [{ scale: recordingAnimationRef }],
            }}
          />
        </View>
      </View>
    </View>
  );
}
