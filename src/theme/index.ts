
import { COLORS } from '../config/constants';

export interface Theme {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarInactive: string;
  primary: string;
  secondary: string;
  error: string;
  success: string;
  warning: string;
  shimmer: string;
  skeleton: string;
}

export const lightTheme: Theme = {
  background: COLORS.background,
  surface: COLORS.surface,
  text: COLORS.text,
  textSecondary: COLORS.textSecondary,
  border: COLORS.border,
  tabBarBackground: COLORS.surface,
  tabBarBorder: COLORS.border,
  tabBarInactive: COLORS.textSecondary,
  primary: COLORS.primary,
  secondary: COLORS.secondary,
  error: COLORS.error,
  success: COLORS.success,
  warning: COLORS.warning,
  shimmer: COLORS.shimmer,
  skeleton: COLORS.skeleton
};

export const darkTheme: Theme = {
  background: COLORS.darkBackground,
  surface: COLORS.darkSurface,
  text: COLORS.darkText,
  textSecondary: COLORS.darkTextSecondary,
  border: COLORS.darkBorder,
  tabBarBackground: COLORS.darkSurface,
  tabBarBorder: COLORS.darkBorder,
  tabBarInactive: COLORS.darkTextSecondary,
  primary: COLORS.primary,
  secondary: COLORS.secondary,
  error: COLORS.error,
  success: COLORS.success,
  warning: COLORS.warning,
  shimmer: COLORS.darkShimmer,
  skeleton: COLORS.darkSkeleton
};

export const getTheme = (isDarkMode: boolean): Theme => {
  return isDarkMode ? darkTheme : lightTheme;
};

export const getTabBarStyles = (isDarkMode: boolean) => ({
  backgroundColor: isDarkMode ? darkTheme.tabBarBackground : lightTheme.tabBarBackground,
  borderTopColor: isDarkMode ? darkTheme.tabBarBorder : lightTheme.tabBarBorder,
});
