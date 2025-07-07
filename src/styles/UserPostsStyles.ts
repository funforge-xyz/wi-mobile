import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { getTheme } from '../theme';

const { width } = Dimensions.get('window');

export { getTheme };

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  profileHeader: {
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: SPACING.md,
  },
  placeholderAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  statsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  stat: {
    alignItems: 'center',
    marginRight: SPACING.xl,
  },
  statNumber: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  postItem: {
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  postAuthorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAuthorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.sm,
  },
  postAuthorAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  postAuthorName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  postMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postTime: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  privateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  privateText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginLeft: SPACING.xs,
  },
  postContent: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  postMedia: {
    width: '100%',
    height: 300,
    marginTop: SPACING.sm,
    borderRadius: 8,
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginLeft: SPACING.xs,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
  gridContent: {
    paddingHorizontal: 0,
    paddingTop: SPACING.sm,
  },
  gridRow: {
    justifyContent: 'flex-start',
  },
  gridItem: {
    position: 'relative',
    overflow: 'hidden',
  },
  gridItemImage: {
    width: '100%',
    height: '100%',
  },
  gridItemPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridItemSkeleton: {
    borderRadius: 0,
    overflow: 'hidden',
  },
  skeletonShimmer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.7,
  },
});