
import { useState, useEffect } from 'react';
import { View, Image } from 'react-native';
import SkeletonLoader from './SkeletonLoader';

interface AvatarImageProps {
  source: any;
  style: any;
  [key: string]: any;
}

export default function AvatarImage({ source, style, ...props }: AvatarImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [source?.uri]);

  return (
    <View style={[style, { position: 'relative' }]}>
      {loading && !error && (
        <SkeletonLoader
          width={style?.width || 50}
          height={style?.height || 50}
          borderRadius={style?.borderRadius || 25}
          style={{ position: 'absolute' }}
        />
      )}
      <Image
        source={source}
        style={[style, { opacity: loading || error ? 0 : 1 }]}
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
}
