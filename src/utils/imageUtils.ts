
import * as ImageManipulator from 'expo-image-manipulator';

export const compressImage = async (uri: string): Promise<string> => {
  try {
    // Get file info to check initial size
    const response = await fetch(uri);
    const blob = await response.blob();
    let initialSize = blob.size;

    console.log('Initial image size:', (initialSize / 1024 / 1024).toFixed(2), 'MB');

    // Start with high quality and reduce if needed
    let quality = 0.8;
    let compressedUri = uri;

    // Keep compressing until under 5MB or quality gets too low
    while (initialSize > 5242880 && quality > 0.1) { // 5MB = 5242880 bytes
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
