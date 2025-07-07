
import { StyleSheet } from 'react-native';
import { FONTS, SPACING } from '../config/constants';
import { getTheme } from '../theme';

export const createConnectionsStyles = (isDarkMode: boolean) => {
  const theme = getTheme(isDarkMode);
  
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      borderBottomWidth: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: FONTS.bold,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      margin: SPACING.lg,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: 12,
      gap: SPACING.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      fontFamily: FONTS.regular,
      paddingVertical: SPACING.xs,
    },
    connectionItem: {
      marginHorizontal: SPACING.lg,
      marginVertical: SPACING.xs / 2,
      borderRadius: 12,
      overflow: 'hidden',
    },
    connectionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACING.md,
    },
    connectionInfo: {
      flex: 1,
      marginLeft: SPACING.md,
    },
    connectionName: {
      fontSize: 16,
      fontFamily: FONTS.medium,
      marginBottom: SPACING.xs / 2,
    },
    connectionDate: {
      fontSize: 14,
      fontFamily: FONTS.regular,
    },
    connectionActions: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    actionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteButton: {
      backgroundColor: '#ff4757',
    },
    blockButton: {
      backgroundColor: '#ff6348',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: SPACING.xl,
    },
    emptyListContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: SPACING.xl,
    },
    emptyTitle: {
      fontSize: 20,
      fontFamily: FONTS.bold,
      textAlign: 'center',
      marginTop: SPACING.lg,
      marginBottom: SPACING.sm,
    },
    emptySubtitle: {
      fontSize: 16,
      fontFamily: FONTS.regular,
      textAlign: 'center',
      lineHeight: 22,
    },
    listContent: {
      paddingVertical: SPACING.sm,
    },
  });
};
