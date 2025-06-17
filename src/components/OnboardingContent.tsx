
import React from 'react';
import { View, Text, Image } from 'react-native';
import { styles } from '../styles/OnboardingStyles';

interface OnboardingContentProps {
  title: string;
  description: string;
  image: any;
}

export default function OnboardingContent({ title, description, image }: OnboardingContentProps) {
  return (
    <View style={styles.content}>
      <Image source={image} style={styles.image} />
      
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}
