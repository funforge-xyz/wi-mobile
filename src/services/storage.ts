import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';
import * as VideoThumbnails from 'expo-video-thumbnails';

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

  async getTrackingRadius(): Promise<number> {
    try {
      const value = await AsyncStorage.getItem('@WiChat_Settings_trackingRadius');
      return value ? parseInt(value, 10) : 1000; // Default to 1000 meters (1km)
    } catch (error) {
      console.error('Error getting tracking radius setting:', error);
      return 1000;
    }
  }

  async setTrackingRadius(value: number): Promise<void> {
    try {
      await AsyncStorage.setItem('@WiChat_Settings_trackingRadius', value.toString());
    } catch (error) {
      console.error('Error setting tracking radius:', error);
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
import { getStorage as getStorageInstance } from './firebase';

export class StorageService {
  async uploadProfilePicture(userId: string, imageUri: string): Promise<{ fullUrl: string; thumbnailUrl: string }> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const storage = getStorage();
      const timestamp = Date.now();

      // Upload full size image
      const imageRef = ref(storage, `profile-pictures/${userId}/${timestamp}.jpg`);
      await uploadBytes(imageRef, blob);
      const fullDownloadURL = await getDownloadURL(imageRef);

      // Create and upload thumbnail
      const thumbnailBlob = await this.createThumbnail(imageUri);
      const thumbnailRef = ref(storage, `profile-pictures/${userId}/${timestamp}_thumb.jpg`);
      await uploadBytes(thumbnailRef, thumbnailBlob);
      const thumbnailDownloadURL = await getDownloadURL(thumbnailRef);

      return {
        fullUrl: fullDownloadURL,
        thumbnailUrl: thumbnailDownloadURL
      };
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  }

  private async createThumbnail(imageUri: string): Promise<Blob> {
    try {
      const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');

      // Create thumbnail with max width/height of 200px and higher quality
      const result = await manipulateAsync(
        imageUri,
        [{ resize: { width: 300 } }],
        {
          compress: 0.7,
          format: SaveFormat.JPEG,
        }
      );

      const response = await fetch(result.uri);
      return await response.blob();
    } catch (error) {
      console.error('Error creating thumbnail:', error);
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

  async uploadPostMedia(userId: string, mediaUri: string, mediaType: 'image' | 'video'): Promise<{ mediaUrl: string; thumbnailUrl?: string }> {
    try {
      const response = await fetch(mediaUri);
      const blob = await response.blob();

      const storage = getStorage();
      const timestamp = Date.now();
      const extension = mediaType === 'video' ? 'mp4' : 'jpg';
      const folderName = mediaType === 'video' ? 'post-videos' : 'post-images';
      const mediaRef = ref(storage, `${folderName}/${userId}/${timestamp}.${extension}`);

      await uploadBytes(mediaRef, blob);
      const mediaUrl = await getDownloadURL(mediaRef);

      if (mediaType === 'video') {
        try {
          // Generate thumbnail for video
          const thumbnailBlob = await this.createVideoThumbnail(mediaUri);
          
          // Check if we got a valid thumbnail (not a placeholder)
          if (thumbnailBlob && thumbnailBlob.size > 100) { // Only upload if we have a real thumbnail
            const thumbnailRef = ref(storage, `post-videos/${userId}/${timestamp}_thumb.jpg`);
            await uploadBytes(thumbnailRef, thumbnailBlob);
            const thumbnailUrl = await getDownloadURL(thumbnailRef);
            
            if (thumbnailUrl) {
              console.log('Thumbnail uploaded successfully:', thumbnailUrl);
              return { mediaUrl, thumbnailUrl };
            } else {
              console.warn('Thumbnail URL is empty, proceeding without thumbnail');
              return { mediaUrl };
            }
          } else {
            console.log('Placeholder thumbnail created, skipping upload');
            return { mediaUrl };
          }
        } catch (thumbnailError) {
          console.warn('Failed to create video thumbnail, proceeding without thumbnail:', thumbnailError);
          // Return video URL without thumbnail
          return { mediaUrl };
        }
      } else {
        // For images, thumbnailUrl should be the same as mediaUrl
        return { mediaUrl, thumbnailUrl: mediaUrl };
      }

      return { mediaUrl };
    } catch (error) {
      console.error(`Error uploading post ${mediaType}:`, error);
      throw error;
    }
  }

  private async createVideoThumbnail(videoUri: string): Promise<Blob> {
    try {
      // Generate thumbnail from first frame (time: 0)
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 0, // First frame
        quality: 0.7,
      });

      // Compress the thumbnail using existing image manipulation
      const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
      
      const result = await manipulateAsync(
        uri,
        [{ resize: { width: 600 } }], // Resize to reasonable size
        {
          compress: 0.7,
          format: SaveFormat.JPEG,
        }
      );

      const response = await fetch(result.uri);
      return await response.blob();
    } catch (error) {
      console.error('Error creating video thumbnail:', error);
      // Return placeholder instead of throwing
      return this.createPlaceholderThumbnail();
    }
  }

  private async createPlaceholderThumbnail(): Promise<Blob> {
    // Create a small placeholder blob to indicate no thumbnail
    // This will be detected by size check and not uploaded
    return new Blob(['placeholder'], { type: 'image/jpeg' });
  }

  async deleteProfilePicture(photoURL: string, thumbnailURL?: string): Promise<void> {
    try {
      if (!photoURL || !photoURL.includes('firebase')) {
        return; // Not a Firebase Storage URL, nothing to delete
      }

      const storage = getStorageInstance();

      // Delete full size image
      const url = new URL(photoURL);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);

      if (pathMatch) {
        const decodedPath = decodeURIComponent(pathMatch[1]);
        const imageRef = ref(storage, decodedPath);
        await deleteObject(imageRef);
        console.log('Profile picture deleted from storage:', decodedPath);
      }

      // Delete thumbnail if provided
      if (thumbnailURL && thumbnailURL.includes('firebase')) {
        const thumbUrl = new URL(thumbnailURL);
        const thumbPathMatch = thumbUrl.pathname.match(/\/o\/(.+)\?/);

        if (thumbPathMatch) {
          const decodedThumbPath = decodeURIComponent(thumbPathMatch[1]);
          const thumbRef = ref(storage, decodedThumbPath);
          await deleteObject(thumbRef);
          console.log('Profile picture thumbnail deleted from storage:', decodedThumbPath);
        }
      }
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      // Don't throw error for delete failures to avoid blocking the UI update
    }
  }
}

export const storageService = new StorageService();