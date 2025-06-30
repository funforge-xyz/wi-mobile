import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../config/constants';
import { createLoginStyles } from '../styles/LoginStyles';
import { useAppSelector } from '../hooks/redux';

interface LoginImagePickerProps {
  profileImage: string;
  setProfileImage: (image: string) => void;
}

export default function LoginImagePicker({
  profileImage,
  setProfileImage,
}: LoginImagePickerProps) {
  const { t } = useTranslation();
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const styles = createLoginStyles(isDarkMode);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert(t('auth.imagePicker'), t('auth.imagePickerError'));
    }
  };

  const removeImage = () => {
    setProfileImage('');
  };

  return (
    <View style={styles.imagePickerContainer}>
      <TouchableOpacity
        style={styles.imagePickerContent}
        onPress={pickImage}
      >
        <Ionicons name="camera-outline" size={20} style={styles.icon} />
        <Text style={styles.imagePickerText}>
          {t('auth.profilePictureOptional')}
        </Text>
        <Ionicons name="chevron-forward" size={16} style={styles.icon} />
      </TouchableOpacity>

      {profileImage && (
        <View style={styles.selectedImageContainer}>
          <Image source={{ uri: profileImage }} style={styles.selectedImage} />
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={removeImage}
          >
            <Ionicons name="close-circle" size={24} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}