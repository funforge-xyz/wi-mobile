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
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

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
  const [recording, setRecording] = useState(false);
  const [cameraMode, setCameraMode] = useState<'picture' | 'video'>('picture');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

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



  const takePicture = async () => {
    if (cameraRef.current && !recording) {
      try {
        console.log('Taking picture...');
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          skipProcessing: false,
          // Maintain 5:4 aspect ratio
          aspect: [5, 4],
        });
        console.log('Picture taken:', photo.uri);
        onMediaCaptured(photo.uri, 'image');
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert(t('common.error'), t('camera.errorTakingPicture', 'Failed to take picture'));
      }
    }
  };

  const handleRecord = async () => {
    if (cameraRef.current) {
      if (recording) {
        // Stop recording
        console.log('Stopping recording manually...');
        cameraRef.current.stopRecording();
        setRecording(false);
      } else {
        // Start recording
        console.log('Starting recording...');
        setRecording(true);
        setRecordingSeconds(0);

        recordingInterval.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);

        try {
          const video = await cameraRef.current.recordAsync({
            quality: '720p' as const,
            maxDuration: 15, // 15 seconds max duration
            // Maintain 5:4 aspect ratio for video
            videoBitrate: 1000000, // 1 Mbps for good quality
          });

          console.log('Video recording completed:', video);
          setVideoUri(video.uri);
          onMediaCaptured(video.uri, 'video');
          setRecording(false);
          setRecordingSeconds(0);
          if (recordingInterval.current) {
            clearInterval(recordingInterval.current);
            recordingInterval.current = null;
          }
        } catch (error) {
          console.error('Error recording video:', error);
          setRecording(false);
          setRecordingSeconds(0);
          if (recordingInterval.current) {
            clearInterval(recordingInterval.current);
            recordingInterval.current = null;
          }
          Alert.alert(t('common.error'), t('camera.errorRecordingVideo', 'Failed to record video'));
        }
      }
    }
  };

  const flipCamera = () => {
    setCameraType(current => (current === 'front' ? 'back' : 'front'));
  };

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newZoom = Math.max(0, Math.min(1, zoom + (event.scale - 1) * 0.005)); // Slower zoom speed
      setZoom(newZoom);
    })
    .runOnJS(true);

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
      {/* Camera View with 5:4 aspect ratio */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
        <GestureDetector gesture={pinchGesture}>
          <CameraView
            style={{ 
              width: width,
              height: width * 0.8, // 5:4 aspect ratio (width * 4/5) - this gives proper proportions
              maxHeight: height * 0.7, // Limit height to avoid stretching
            }}
            facing={cameraType}
            ref={cameraRef}
            mode={cameraMode}
            zoom={zoom}
          />
        </GestureDetector>
      </View>

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
          disabled={recording}
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: recording ? 0.5 : 1,
          }}
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>

        

        <TouchableOpacity
          onPress={flipCamera}
          disabled={recording}
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: recording ? 0.5 : 1,
          }}
        >
          <Ionicons name="camera-reverse" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Max Recording Message */}
      {cameraMode === 'video' && (
        <View
          style={{
            position: 'absolute',
            bottom: 210,
            left: 20,
            right: 20,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: 'white',
              fontSize: 12,
              textAlign: 'center',
              opacity: 0.8,
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: 'rgba(0,0,0,0.4)',
              borderRadius: 12,
            }}
          >
            5:4 ratio • Max recording: 15 seconds
          </Text>
        </View>
      )}

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
            onPress={() => setCameraMode('picture')}
            disabled={recording}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: cameraMode === 'picture' ? 'white' : 'transparent',
              opacity: recording ? 0.5 : 1,
            }}
          >
            <Text
              style={{
                color: cameraMode === 'picture' ? 'black' : 'white',
                fontSize: 16,
                fontWeight: '600',
              }}
            >
              Photo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setCameraMode('video')}
            disabled={recording}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: cameraMode === 'video' ? 'white' : 'transparent',
              opacity: recording ? 0.5 : 1,
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

      {/* Recording Counter - centered with top controls */}
      {recording && (
        <View
          style={{
            position: 'absolute',
            top: 60,
            left: 0,
            right: 0,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: 'rgba(255, 0, 0, 0.9)',
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
            <Text
              style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
              }}
            >
              {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:
              {String(recordingSeconds % 60).padStart(2, '0')}
            </Text>
          </View>
        </View>
      )}

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
        {cameraMode === 'picture' ? (
          /* Photo Capture Button */
          <TouchableOpacity
            onPress={takePicture}
            disabled={recording}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(255,255,255,0.3)',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 4,
              borderColor: 'white',
              opacity: recording ? 0.5 : 1,
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
            onPress={handleRecord}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: recording ? 'rgba(255,0,0,0.8)' : 'rgba(255,255,255,0.3)',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 4,
              borderColor: recording ? 'red' : 'white',
            }}
          >
            {recording ? (
              <View
                style={{
                  width: 30,
                  height: 30,
                  backgroundColor: 'white',
                }}
              />
            ) : (
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: 'red',
                }}
              />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}