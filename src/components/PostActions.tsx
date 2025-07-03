
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SPACING } from '../config/constants';

interface PostActionsProps {
  liked: boolean;
  likesCount: number;
  commentsCount: number;
  showLikeCount: boolean;
  allowComments: boolean;
  onLikePress: () => void;
  onCommentPress: () => void;
  currentTheme: any;
}

export default function PostActions({
  liked,
  likesCount,
  commentsCount,
  showLikeCount,
  allowComments,
  onLikePress,
  onCommentPress,
  currentTheme,
}: PostActionsProps) {
  return (
    <View style={[styles.postActions, { borderTopColor: currentTheme.border }]}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onLikePress}
      >
        <Ionicons 
          name={liked ? "heart" : "heart-outline"} 
          size={24} 
          color={liked ? "red" : currentTheme.textSecondary} 
        />
        {showLikeCount && (
          <Text style={[styles.actionText, { color: currentTheme.textSecondary }]}>
            {likesCount}
          </Text>
        )}
      </TouchableOpacity>

      {allowComments && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onCommentPress}
        >
          <Ionicons name="chatbubble-outline" size={24} color={currentTheme.textSecondary} />
          <Text style={[styles.actionText, { color: currentTheme.textSecondary }]}>
            {commentsCount}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  postActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  actionText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginLeft: SPACING.xs,
  },
});
