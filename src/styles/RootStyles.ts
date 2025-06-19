import { FONTS } from '../config/constants';
import { getTheme, getTabBarStyles as getTabBarStylesFromTheme } from '../theme';

export const getTheme = (isDarkMode: boolean) => {
  return getTheme(isDarkMode);
};

export const getTabBarStyles = (isDarkMode: boolean) => {
  return getTabBarStylesFromTheme(isDarkMode);
};

export const getTabBarLabelStyle = () => ({
  fontFamily: FONTS.medium,
  fontSize: 12,
});