
import { COLORS, FONTS } from '../config/constants';

export const lightTheme = {
  background: COLORS.background,
  surface: COLORS.surface,
  text: COLORS.text,
  textSecondary: COLORS.textSecondary,
  border: COLORS.border,
  tabBarBackground: COLORS.surface,
  tabBarBorder: COLORS.border,
  tabBarInactive: COLORS.textSecondary,
};

export const darkTheme = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#333333',
  tabBarBackground: '#1E1E1E',
  tabBarBorder: '#333333',
  tabBarInactive: '#B0B0B0',
};

export const getTabBarStyles = (isDarkMode: boolean) => ({
  backgroundColor: isDarkMode ? darkTheme.tabBarBackground : lightTheme.tabBarBackground,
  borderTopColor: isDarkMode ? darkTheme.tabBarBorder : lightTheme.tabBarBorder,
});

export const getTabBarLabelStyle = () => ({
  fontFamily: FONTS.medium,
  fontSize: 12,
});
