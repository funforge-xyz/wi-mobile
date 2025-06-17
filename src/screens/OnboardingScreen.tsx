import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { onboardingData, getNextButtonText } from '../utils/onboardingUtils';
import { styles } from '../styles/OnboardingStyles';
import OnboardingHeader from '../components/OnboardingHeader';
import OnboardingContent from '../components/OnboardingContent';
import OnboardingPagination from '../components/OnboardingPagination';
import OnboardingFooter from '../components/OnboardingFooter';

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
    if (onComplete) {
      onComplete();
    }
  };

  const currentData = onboardingData[currentPage];
  const buttonText = getNextButtonText(currentPage, onboardingData.length);

  return (
    <SafeAreaView style={styles.container}>
      <OnboardingHeader onSkip={handleSkip} />
      
      <OnboardingContent
        title={currentData.title}
        description={currentData.description}
        image={currentData.image}
      />
      
      <OnboardingPagination
        totalPages={onboardingData.length}
        currentPage={currentPage}
      />
      
      <OnboardingFooter
        buttonText={buttonText}
        onNext={handleNext}
      />
    </SafeAreaView>
  );
}

