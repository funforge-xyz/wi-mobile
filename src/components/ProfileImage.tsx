import { memo, useState, useEffect } from 'react';
import { View, Image } from 'react-native';
import SkeletonLoader from './SkeletonLoader';

interface ProfileImageProps {
  uri: string;
  style: any;
  [key: string]: any;
}

const ProfileImage = memo(({ uri, style, ...props }: ProfileImageProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const imageWidth = typeof style?.width === 'number' ? style.width : 100;
  const imageHeight = typeof style?.height === 'number' ? style.height : 100;

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [uri]);

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