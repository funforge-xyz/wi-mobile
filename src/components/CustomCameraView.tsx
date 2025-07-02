
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Alert,
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
  const [cameraType] = useState<'front' | 'back'>('back');
  const [isRecording, setIsRecording] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const [countdown, setCountdown] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { t } = useTranslation();

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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

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

  const startVideoRecording = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        console.log('Starting 5-second video recording...');
        setIsRecording(true);
        setCountdown(5);

        // Start countdown
        countdownIntervalRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Auto-stop after 5 seconds
        recordingTimeoutRef.current = setTimeout(async () => {
          if (cameraRef.current && isRecording) {
            try {
              console.log('Auto-stopping recording after 5 seconds...');
              await cameraRef.current.stopRecording();
            } catch (error) {
              console.error('Error auto-stopping recording:', error);
            }
          }
        }, 5000);

        // Start recording - this will resolve when recording stops
        const video = await cameraRef.current.recordAsync({
          quality: '720p' as const,
        });

        console.log('Video recording completed:', video);
        
        // Clear timeouts and reset state
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
        }
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
        
        setIsRecording(false);
        setCountdown(0);

        if (video && video.uri) {
          console.log('Video URI:', video.uri);
          onMediaCaptured(video.uri, 'video');
        } else {
          console.error('No video URI in result:', video);
          Alert.alert(t('common.error'), t('camera.errorRecordingVideo', 'Failed to record video'));
        }

      } catch (error) {
        console.error('Error during video recording:', error);
        // Clear timeouts and reset state on error
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
        }
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
        setIsRecording(false);
        setCountdown(0);
        Alert.alert(t('common.error'), t('camera.errorRecordingVideo', 'Failed to record video'));
      }
    }
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
          disabled={isRecording}
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: isRecording ? 0.5 : 1,
          }}
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>

        {/* Recording Indicator */}
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
              {countdown > 0 ? countdown : 'REC'}
            </Text>
          </View>
        )}

        <View style={{ width: 50 }} />
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
            disabled={isRecording}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: cameraMode === 'photo' ? 'white' : 'transparent',
              opacity: isRecording ? 0.5 : 1,
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
            disabled={isRecording}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: cameraMode === 'video' ? 'white' : 'transparent',
              opacity: isRecording ? 0.5 : 1,
            }}
          >
            <Text
              style={{
                color: cameraMode === 'video' ? 'black' : 'white',
                fontSize: 16,
                fontWeight: '600',
              }}
            >
              Video (5s)
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
            disabled={isRecording}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(255,255,255,0.3)',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 4,
              borderColor: 'white',
              opacity: isRecording ? 0.5 : 1,
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
          /* Video Recording Button */
          <TouchableOpacity
            onPress={startVideoRecording}
            disabled={isRecording}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: isRecording ? 'rgba(255,0,0,0.8)' : 'rgba(255,255,255,0.3)',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 4,
              borderColor: isRecording ? 'red' : 'white',
              opacity: isRecording ? 1 : 1,
            }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: isRecording ? 8 : 30,
                backgroundColor: 'red',
              }}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
