import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';
import { useAppSelector } from '../hooks/redux';

export default function HomeScreen() {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Home</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color={currentTheme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Ionicons name="home-outline" size={64} color={currentTheme.textSecondary} />
        <Text style={[styles.title, { color: currentTheme.text }]}>Welcome to WI</Text>
        <Text style={[styles.subtitle, { color: currentTheme.textSecondary }]}>
          Your home for connecting with people nearby
        </Text>
      </View>
    </SafeAreaView>
  );
}

const lightTheme = {
  background: COLORS.background,
  surface: COLORS.surface,
  text: COLORS.text,
  textSecondary: COLORS.textSecondary,
  border: COLORS.border,
};

const darkTheme = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#333333',
};

const styles = StyleSheet.create({
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 24,
  },
});
```

```text
The provided code is for the HomeScreen component and doesn't include any tab navigation or ProfileScreen. The instructions ask to replace ProfileScreen with UserPostsScreen in tab navigation, but there's no tab navigation in this code. Therefore, I cannot apply the changes directly to this file. Assuming this HomeScreen is one of the tabs, the change would need to happen in the file where the Tab Navigation is defined, most likely App.js or similar.