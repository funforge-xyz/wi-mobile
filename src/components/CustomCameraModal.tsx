
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  Alert,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

interface CustomCameraModalProps {
  visible: boolean;
  onClose: () => void;
  onMediaCaptured: (uri: string, type: 'image' | 'video') => void;
  currentTheme: any;
}

export default function CustomCameraModal({
  visible,
  onClose,
  onMediaCaptured,
  currentTheme,
}: CustomCameraModalProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingAnimationRef = useRef(new Animated.Value(1)).current;
  const { t } = useTranslation();

  const MAX_RECORDING_TIME = 15; // 15 seconds

  useEffect(() => {
    (async () => {
      const cameraStatus = await CameraView.requestCameraPermissionsAsync();
      const microphoneStatus = await CameraView.requestMicrophonePermissionsAsync();
      setHasPermission(cameraStatus.status === 'granted' && microphoneStatus.status === 'granted');
    })();
  }, []);

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
            stopRecording();
            return 0;
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
      }
    };
  }, [isRecording]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => false,
      
      onPanResponderGrant: () => {
        // Start recording video on press
        startRecording();
      },
      
      onPanResponderRelease: () => {
        // Stop recording or take photo on release
        if (isRecording) {
          stopRecording();
        } else {
          takePicture();
        }
      },
    })
  ).current;

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          skipProcessing: false,
        });
        if (photo && photo.uri) {
          onMediaCaptured(photo.uri, 'image');
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        setIsRecording(true);
        const video = await cameraRef.current.recordAsync({
          maxDuration: MAX_RECORDING_TIME,
          quality: '720p',
        });
        if (video && video.uri) {
          onMediaCaptured(video.uri, 'video');
        }
      } catch (error) {
        console.error('Error starting recording:', error);
        setIsRecording(false);
        Alert.alert('Error', 'Failed to start recording');
      }
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      try {
        setIsRecording(false);
        await cameraRef.current.stopRecording();
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
  };

  const toggleCameraType = () => {
    setCameraType(cameraType === 'back' ? 'front' : 'back');
  };

  if (hasPermission === null) {
    return <View />;
  }

  if (hasPermission === false) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: currentTheme.background }}>
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
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'black' }}>
        {/* Camera View */}
        <CameraView
          style={{ flex: 1 }}
          facing={cameraType}
          ref={cameraRef}
        >
          {/* Header Controls */}
          <View style={{
            position: 'absolute',
            top: 50,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            zIndex: 1,
          }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>

            {/* Recording Timer */}
            {isRecording && (
              <View style={{
                backgroundColor: 'rgba(255,0,0,0.8)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'white',
                  marginRight: 8,
                }} />
                <Text style={{ color: 'white', fontWeight: 'bold' }}>
                  {`00:${recordingTime.toString().padStart(2, '0')}`}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={toggleCameraType}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="camera-reverse" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View style={{
            position: 'absolute',
            bottom: 50,
            left: 0,
            right: 0,
            alignItems: 'center',
          }}>
            {/* Instructions */}
            <Text style={{
              color: 'white',
              marginBottom: 30,
              textAlign: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 20,
            }}>
              {isRecording 
                ? t('camera.recording', 'Recording... Release to stop')
                : t('camera.instructions', 'Tap for photo, hold for video')
              }
            </Text>

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
        </CameraView>
      </View>
    </Modal>
  );
}
