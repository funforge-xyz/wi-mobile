
import { memo, useState, useEffect } from 'react';
import { View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SkeletonLoader from './SkeletonLoader';

interface ProfileImageProps {
  uri?: string;
  style: any;
  showPlaceholder?: boolean;
  placeholderIcon?: string;
  placeholderSize?: number;
  placeholderBackgroundColor?: string;
  placeholderIconColor?: string;
  [key: string]: any;
}

const ProfileImage = memo(({ 
  uri, 
  style, 
  showPlaceholder = true,
  placeholderIcon = 'person-add',
  placeholderSize = 40,
  placeholderBackgroundColor,
  placeholderIconColor,
  ...props 
}: ProfileImageProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const imageWidth = typeof style?.width === 'number' ? style.width : 100;
  const imageHeight = typeof style?.height === 'number' ? style.height : 100;

  useEffect(() => {
    if (uri && uri.trim() !== '') {
      setLoading(true);
      setError(false);
    } else {
      setLoading(false);
      setError(true);
    }
  }, [uri]);

  if (!uri || uri.trim() === '' || error) {
    if (showPlaceholder) {
      return (
        <View style={[
          style, 
          { 
            backgroundColor: placeholderBackgroundColor || '#f0f0f0',
            justifyContent: 'center',
            alignItems: 'center'
          }
        ]}>
          <Ionicons 
            name={placeholderIcon as any} 
            size={placeholderSize} 
            color={placeholderIconColor || '#666'} 
          />
        </View>
      );
    }
    return null;
  }

  return (
    <View style={[{ position: 'relative', overflow: 'hidden' }, style]}>
      {loading && !error && (
        <SkeletonLoader
          width={imageWidth}
          height={imageHeight}
          borderRadius={style?.borderRadius || 50}
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
        />
      )}
      <Image
        source={{ uri, cache: 'reload' }}
        style={[style, { opacity: loading ? 0 : 1 }]}
        onLoadStart={() => {
          setLoading(true);
          setError(false);
        }}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        {...props}
      />
    </View>
  );
});

export default ProfileImage;
