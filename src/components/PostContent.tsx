
import React from 'react';
import {
  Text,
  StyleSheet,
} from 'react-native';
import { FONTS, SPACING } from '../config/constants';

interface PostContentProps {
  content: string;
  currentTheme: any;
}

export default function PostContent({ content, currentTheme }: PostContentProps) {
  return (
    <Text style={[styles.postContent, { color: currentTheme.text }]}>
      {content}
    </Text>
  );
}

const styles = StyleSheet.create({
  postContent: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    lineHeight: 24,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
});
