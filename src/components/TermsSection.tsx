
import React from 'react';
import { Text } from 'react-native';

interface TermsSectionProps {
  title: string;
  content: string;
  currentTheme: any;
  styles: any;
  isLastUpdated?: boolean;
}

export default function TermsSection({ 
  title, 
  content, 
  currentTheme, 
  styles, 
  isLastUpdated = false 
}: TermsSectionProps) {
  if (isLastUpdated) {
    return (
      <Text style={[styles.lastUpdated, { color: currentTheme.textSecondary }]}>
        {content}
      </Text>
    );
  }

  return (
    <>
      <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{title}</Text>
      <Text style={[styles.sectionText, { color: currentTheme.textSecondary }]}>
        {content}
      </Text>
    </>
  );
}
