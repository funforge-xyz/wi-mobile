
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Settings } from '../services/storage';
import { COLORS, SPACING, FONTS } from '../config/constants';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: 'Connect with People Nearby',
    description: 'Discover and chat with people in your area',
    image: require('../../assets/images/onboarding1.jpg'),
  },
  {
    id: 2,
    title: 'Share Your Moments',
    description: 'Post photos and updates to share with your community',
    image: require('../../assets/images/onboarding2.jpg'),
  },
  {
    id: 3,
    title: 'Stay Connected',
    description: 'Get notifications about what\'s happening around you',
    image: require('../../assets/images/onboarding3.jpg'),
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    onComplete();
  };

  const currentData = onboardingData[currentPage];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipButton}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Image source={currentData.image} style={styles.image} />
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{currentData.title}</Text>
          <Text style={styles.description}>{currentData.description}</Text>
        </View>

        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentPage && styles.activeDot,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentPage === onboardingData.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  skipButton: {
    fontSize: 16,
    color: COLORS.primary,
    fontFamily: FONTS.medium,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  image: {
    width: width * 0.8,
    height: height * 0.4,
    resizeMode: 'contain',
    marginBottom: SPACING.xl,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  footer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
});
