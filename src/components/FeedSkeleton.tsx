
import { View, StyleSheet, Dimensions } from 'react-native';
import SkeletonLoader from './SkeletonLoader';

const { width, height } = Dimensions.get('window');

interface FeedSkeletonProps {
  count?: number;
}

export default function FeedSkeleton({ count = 3 }: FeedSkeletonProps) {
  const renderSkeletonPost = (index: number) => (
    <View key={index} style={styles.postContainer}>
      {/* Full screen media skeleton */}
      {/* <View style={styles.mediaContainer}>
        <SkeletonLoader
          width={width}
          height={height}
          borderRadius={0}
          forceDarkTheme={true}
        />
      </View> */}

      {/* Bottom overlay with user info and actions - matches FeedScreen layout */}
      <View style={styles.bottomOverlay}>
        {/* Left content - user info and description */}
        <View style={styles.leftContent}>
          {/* User info */}
          <View style={styles.userInfo}>
            <SkeletonLoader
              width={40}
              height={40}
              borderRadius={20}
              forceDarkTheme={true}
            />
            <View style={styles.authorNameContainer}>
              <SkeletonLoader
                width={120}
                height={16}
                borderRadius={8}
                style={styles.authorName}
                forceDarkTheme={true}
              />
              {/* Connection badge skeleton */}
              <SkeletonLoader
                width={60}
                height={16}
                borderRadius={8}
                style={styles.connectionBadge}
                forceDarkTheme={true}
              />
            </View>
          </View>
          
          {/* Description skeleton */}
          <View style={styles.descriptionContainer}>
            <SkeletonLoader
              width={width * 0.7}
              height={14}
              borderRadius={7}
              style={styles.descriptionLine}
              forceDarkTheme={true}
            />
            <SkeletonLoader
              width={width * 0.5}
              height={14}
              borderRadius={7}
              style={styles.descriptionLine}
              forceDarkTheme={true}
            />
          </View>
        </View>

        {/* Right actions - matches FeedScreen right actions */}
        <View style={styles.rightActions}>
          <View style={styles.actionButton}>
            <SkeletonLoader
              width={28}
              height={28}
              borderRadius={14}
              forceDarkTheme={true}
            />
            <SkeletonLoader
              width={20}
              height={12}
              borderRadius={6}
              style={styles.actionText}
              forceDarkTheme={true}
            />
          </View>
          
          <View style={styles.actionButton}>
            <SkeletonLoader
              width={28}
              height={28}
              borderRadius={14}
              forceDarkTheme={true}
            />
            <SkeletonLoader
              width={15}
              height={12}
              borderRadius={6}
              style={styles.actionText}
              forceDarkTheme={true}
            />
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, index) => renderSkeletonPost(index))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  postContainer: {
    width: width,
    height: height,
    position: 'relative',
    backgroundColor: 'black',
  },
  mediaContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  leftContent: {
    flex: 1,
    marginRight: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    flex: 1,
  },
  authorName: {
    marginRight: 8,
  },
  connectionBadge: {
    marginLeft: 8,
  },
  descriptionContainer: {
    marginTop: 4,
  },
  descriptionLine: {
    marginBottom: 4,
  },
  rightActions: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 24, // Matches FeedScreen marginBottom: 24
  },
  actionText: {
    marginTop: 4,
  },
});
