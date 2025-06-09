import AsyncStorage from '@react-native-async-storage/async-storage';

export class Settings {
  private static readonly ONBOARDING_DONE_KEY = 'onboarding_done';
  private static readonly USER_SETTINGS_KEY = 'user_settings';
  private static readonly DARK_MODE_KEY = 'dark_mode';

  async getOnboardingDone(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(Settings.ONBOARDING_DONE_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Error getting onboarding status:', error);
      return false;
    }
  }

  async setOnboardingDone(done: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(Settings.ONBOARDING_DONE_KEY, done.toString());
    } catch (error) {
      console.error('Error setting onboarding status:', error);
    }
  }

  async getDarkMode(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(Settings.DARK_MODE_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Error getting dark mode status:', error);
      return false;
    }
  }

  async setDarkMode(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(Settings.DARK_MODE_KEY, enabled.toString());
    } catch (error) {
      console.error('Error setting dark mode status:', error);
    }
  }

  async getUserSettings(): Promise<any> {
    try {
      const value = await AsyncStorage.getItem(Settings.USER_SETTINGS_KEY);
      return value ? JSON.parse(value) : {};
    } catch (error) {
      console.error('Error getting user settings:', error);
      return {};
    }
  }

  async setUserSettings(settings: any): Promise<void> {
    try {
      await AsyncStorage.setItem(Settings.USER_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error setting user settings:', error);
    }
  }
}

export class Credentials {
  private static TOKEN_KEY = 'auth_token';
  private static USER_KEY = 'user_data';

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(Credentials.TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(Credentials.TOKEN_KEY, token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(Credentials.TOKEN_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  async getUser(): Promise<any> {
    try {
      const value = await AsyncStorage.getItem(Credentials.USER_KEY);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async setUser(user: any): Promise<void> {
    try {
      await AsyncStorage.setItem(Credentials.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error setting user:', error);
    }
  }

  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(Credentials.USER_KEY);
    } catch (error) {
      console.error('Error removing user:', error);
    }
  }
}
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getStorage as getStorageInstance } from './firebase';

export class StorageService {
  async uploadProfilePicture(userId: string, imageUri: string): Promise<string> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const storage = getStorage();
      const imageRef = ref(storage, `profile-pictures/${userId}/${Date.now()}.jpg`);

      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);

      return downloadURL;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  }

  async uploadPostImage(userId: string, imageUri: string): Promise<string> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const storage = getStorage();
      const imageRef = ref(storage, `post-images/${userId}/${Date.now()}.jpg`);

      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);

      return downloadURL;
    } catch (error) {
      console.error('Error uploading post image:', error);
      throw error;
    }
  }

  async deleteProfilePicture(photoURL: string): Promise<void> {
    try {
      if (!photoURL || !photoURL.includes('firebase')) {
        return; // Not a Firebase Storage URL, nothing to delete
      }

      const storage = getStorageInstance();
      
      // Extract the path from the download URL
      const url = new URL(photoURL);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
      
      if (pathMatch) {
        const decodedPath = decodeURIComponent(pathMatch[1]);
        const imageRef = ref(storage, decodedPath);
        await deleteObject(imageRef);
        console.log('Profile picture deleted from storage:', decodedPath);
      }
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      // Don't throw error for delete failures to avoid blocking the UI update
    }
  }
}

export const storageService = new StorageService();