import { useState, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SPACING } from '../config/constants';
import SkeletonLoader from './SkeletonLoader';

const { width } = Dimensions.get('window');

interface PostMediaProps {
  mediaURL: string;
  style?: any;
}

export default function PostMedia({ mediaURL, style }: PostMediaProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [mediaURL]);

  return (
    <View style={[styles.mediaContainer, style]}>
      <View style={[styles.postImage, { position: 'relative' }]}>
        {loading && !error && (
          <SkeletonLoader
            width="100%"
            height={300}
            borderRadius={0}
            style={{ position: 'absolute' }}
          />
        )}
        <Image
          source={{ uri: mediaURL }}
          style={[styles.image, { opacity: loading || error ? 0 : 1 }]}
          resizeMode="cover"
          onLoadStart={() => {
            setLoading(true);
            setError(false);
          }}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mediaContainer: {
    marginBottom: SPACING.sm,
  },
  postImage: {
    width: '100%',
    minHeight: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  }
});