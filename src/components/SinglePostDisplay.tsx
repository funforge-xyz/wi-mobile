
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SPACING } from '../config/constants';
import { VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostMedia from './PostMedia';
import PostActions from './PostActions';

const { width } = Dimensions.get('window');

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  content: string;
  mediaURL?: string;
  mediaType?: 'image' | 'video';
  createdAt: Date;
  showLikeCount: boolean;
  allowComments: boolean;
  isPrivate?: boolean;
}

interface SinglePostDisplayProps {
  post: Post;
  liked: boolean;
  likesCount: number;
  commentsCount: number;
  onLikePress: () => void;
  onCommentPress: () => void;
  currentTheme: any;
  videoPlayer?: any;
  isVideoPlaying?: boolean;
  isVideoMuted?: boolean;
  onVideoPlayPause?: () => void;
  onVideoMuteToggle?: () => void;
}

export default function SinglePostDisplay({
  post,
  liked,
  likesCount,
  commentsCount,
  onLikePress,
  onCommentPress,
  currentTheme,
  videoPlayer,
  isVideoPlaying,
  isVideoMuted,
  onVideoPlayPause,
  onVideoMuteToggle,
}: SinglePostDisplayProps) {
  const mediaHeight = post.mediaType === 'video' ? width * 0.75 : width * 0.6; // 4:3 for video, adjust for images

  return (
    <View style={{ backgroundColor: currentTheme.surface }}>
      {/* Header with padding */}
      <View style={styles.headerContainer}>
        <PostHeader
          authorName={post.authorName}
          authorPhotoURL={post.authorPhotoURL}
          createdAt={post.createdAt}
          isAuthorOnline={false}
          isFromConnection={false}
          currentTheme={currentTheme}
        />
      </View>

      {/* Content with padding */}
      {post.content ? (
        <View style={styles.contentContainer}>
          <PostContent
            content={post.content}
            currentTheme={currentTheme}
          />
        </View>
      ) : null}

      {/* Media - Full width, no padding */}
      {post.mediaURL && (
        <View style={styles.mediaContainer}>
          {post.mediaType === 'video' && videoPlayer ? (
            <View style={[styles.videoContainer, { height: mediaHeight }]}>
              <VideoView
                player={videoPlayer}
                style={styles.video}
                allowsFullscreen={false}
                allowsPictureInPicture={false}
                nativeControls={false}
                contentFit="contain"
              />
              
              {/* Video Controls Overlay */}
              <View style={styles.videoControls}>
                {/* Play/Pause Button */}
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={onVideoPlayPause}
                >
                  <Ionicons 
                    name={isVideoPlaying ? "pause" : "play"} 
                    size={30} 
                    color="white" 
                  />
                </TouchableOpacity>

                {/* Mute Button */}
                <TouchableOpacity
                  style={styles.muteButton}
                  onPress={onVideoMuteToggle}
                >
                  <Ionicons 
                    name={isVideoMuted ? "volume-mute" : "volume-high"} 
                    size={24} 
                    color="white" 
                  />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <PostMedia 
              mediaURL={post.mediaURL} 
              mediaType={post.mediaType}
              style={[styles.image, { height: mediaHeight }]}
            />
          )}
        </View>
      )}

      {/* Actions with padding */}
      <View style={styles.actionsContainer}>
        <PostActions
          liked={liked}
          likesCount={likesCount}
          commentsCount={commentsCount}
          showLikeCount={post.showLikeCount}
          allowComments={post.allowComments}
          onLikePress={onLikePress}
          onCommentPress={onCommentPress}
          currentTheme={currentTheme}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  contentContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  mediaContainer: {
    width: '100%',
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    backgroundColor: 'black',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    resizeMode: 'contain',
  },
  videoControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    padding: SPACING.md,
    paddingTop: SPACING.sm,
  },
});
