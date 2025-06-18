
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../config/constants';
import { styles } from '../styles/LoginStyles';

interface LoginImagePickerProps {
  profileImage: string;
  setProfileImage: (uri: string) => void;
}

export default function LoginImagePicker({ profileImage, setProfileImage }: LoginImagePickerProps) {
  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add a photo',
      [
        {
          text: 'Camera',
          onPress: handleCameraCapture,
        },
        {
          text: 'Photo Library',
          onPress: handleImagePicker,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      // Check file size (2.5MB = 2,621,440 bytes)
      if (asset.fileSize && asset.fileSize > 2621440) {
        Alert.alert('File Too Large', 'Please select an image smaller than 2.5MB');
        return;
      }

      setProfileImage(asset.uri);
    }
  };

  const handleCameraCapture = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access the camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 2621440) {
        Alert.alert('File Too Large', 'Please select an image smaller than 2.5MB');
        return;
      }

      setProfileImage(asset.uri);
    }
  };

  return (
    <TouchableOpacity style={styles.imagePickerContainer} onPress={showImagePickerOptions}>
      <View style={styles.imagePickerContent}>
        <Ionicons name="camera-outline" size={20} color={COLORS.textSecondary} />
        <Text style={[styles.imagePickerText, { color: COLORS.textSecondary }]}>
          {profileImage ? 'Change Profile Picture' : 'Add Profile Picture (optional)'}
        </Text>
      </View>
      {profileImage && (
        <View style={styles.selectedImageContainer}>
          <Image source={{ uri: profileImage }} style={styles.selectedImage} />
          <TouchableOpacity 
            style={styles.removeImageButton} 
            onPress={() => setProfileImage('')}
          >
            <Ionicons name="trash" size={16} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}
