
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { createLoginStyles } from '../styles/LoginStyles';
import { useAppSelector } from '../hooks/redux';
import { getTheme } from '../theme';

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
  const currentTheme = getTheme(isDarkMode);
  const styles = createLoginStyles(isDarkMode);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('common.error'),
        'Permission to access media library is required!'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('common.error'),
        'Permission to access camera is required!'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      t('addPost.takePhotoOptional'),
      '',
      [
        {
          text: t('addPost.takePhoto'),
          onPress: takePhoto,
        },
        {
          text: t('addPost.selectPhoto'),
          onPress: pickImage,
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputWrapper}>
        <Ionicons 
          name="person-add-outline" 
          size={20} 
          color={currentTheme.textSecondary} 
          style={styles.inputIcon}
        />
        
        <TouchableOpacity
          style={styles.imagePickerButton}
          onPress={showImageOptions}
        >
          {profileImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: profileImage }} style={styles.profilePreview} />
              <Text style={[styles.imagePickerText, { color: currentTheme.text }]}>
                {t('auth.profilePhotoSelected')}
              </Text>
            </View>
          ) : (
            <Text style={[styles.imagePickerText, { color: currentTheme.textSecondary }]}>
              {t('auth.addProfilePhoto')}
            </Text>
          )}
        </TouchableOpacity>
        
        {profileImage && (
          <TouchableOpacity
            onPress={() => setProfileImage('')}
            style={styles.removeImageIcon}
          >
            <Ionicons
              name="close-outline"
              size={20}
              color={currentTheme.error}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
