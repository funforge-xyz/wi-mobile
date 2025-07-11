
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { TFunction } from 'i18next';

export const showImagePickerOptions = (
  onCameraCapture: () => void,
  onImagePicker: () => void,
  t: TFunction
) => {
  Alert.alert(
    t('addPost.selectPhoto'),
    t('addPost.choosePhotoOption'),
    [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('addPost.takePhoto'),
        onPress: onCameraCapture,
      },
      {
        text: t('addPost.chooseFromLibrary'),
        onPress: onImagePicker,
      },
    ],
    { cancelable: true }
  );
};

export const requestCameraPermissions = async (t: TFunction): Promise<boolean> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      t('settings.permissionDenied'),
      t('settings.cameraPermissionRequired')
    );
    return false;
  }
  return true;
};

export const requestMediaLibraryPermissions = async (t: TFunction): Promise<boolean> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      t('settings.permissionDenied'),
      t('settings.mediaLibraryPermissionRequired')
    );
    return false;
  }
  return true;
};

export const launchImagePicker = async (t: TFunction): Promise<string | null> => {
  try {
    const hasPermission = await requestMediaLibraryPermissions(t);
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error('Image picker error:', error);
    Alert.alert(t('common.error'), t('settings.failedToPickImage'));
    return null;
  }
};

export const launchCamera = async (t: TFunction): Promise<string | null> => {
  try {
    const hasPermission = await requestCameraPermissions(t);
    if (!hasPermission) return null;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error('Camera error:', error);
    Alert.alert(t('common.error'), t('settings.failedToTakePhoto'));
    return null;
  }
};
