
import * as ImageManipulator from 'expo-image-manipulator';

export const compressImage = async (uri: string): Promise<string> => {
  try {
    // Get file info to check initial size
    const response = await fetch(uri);
    const blob = await response.blob();
    let initialSize = blob.size;

    console.log('Initial image size:', (initialSize / 1024 / 1024).toFixed(2), 'MB');

    // Start with high quality and reduce if needed
    let quality = 0.7;
    let compressedUri = uri;

    // Keep compressing until under 5MB or quality gets too low
    while (initialSize > 5242880 && quality > 0.3) { // 5MB = 5242880 bytes
      const result = await ImageManipulator.manipulateAsync(
        compressedUri,
        [{ resize: { width: 1920 } }], // Resize to max width 1920px
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      // Check new file size
      const newResponse = await fetch(result.uri);
      const newBlob = await newResponse.blob();
      initialSize = newBlob.size;
      compressedUri = result.uri;

      console.log('Compressed to quality', quality, 'Size:', (initialSize / 1024 / 1024).toFixed(2), 'MB');

      // Reduce quality for next iteration
      quality -= 0.1;
    }

    // Final check
    if (initialSize > 5242880) {
      throw new Error('Unable to compress image below 5MB');
    }

    console.log('Final compressed size:', (initialSize / 1024 / 1024).toFixed(2), 'MB');
    return compressedUri;
  } catch (error) {
    console.error('Image compression error:', error);
    throw error;
  }
};

export const compressVideo = async (uri: string): Promise<string> => {
  try {
    // Get file info to check initial size
    const response = await fetch(uri);
    const blob = await response.blob();
    const initialSize = blob.size;

    console.log('Initial video size:', (initialSize / 1024 / 1024).toFixed(2), 'MB');

    // For videos under 50MB, return as is
    if (initialSize <= 52428800) { // 50MB = 52428800 bytes
      console.log('Video is already under 50MB, no compression needed');
      return uri;
    }

    // For larger videos, we'll use a basic compression approach
    // Since expo-video doesn't have built-in compression, we'll rely on the camera settings
    // to keep videos small during recording
    console.log('Video compression may be needed - consider reducing recording quality');
    
    // Return the original URI since we're limiting recording time and quality in camera
    return uri;
  } catch (error) {
    console.error('Video compression error:', error);
    throw error;
  }
};
