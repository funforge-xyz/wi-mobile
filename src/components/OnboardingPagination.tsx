
import { View } from 'react-native';
import { styles } from '../styles/OnboardingStyles';

interface OnboardingPaginationProps {
  totalPages: number;
  currentPage: number;
}

export default function OnboardingPagination({ totalPages, currentPage }: OnboardingPaginationProps) {
  return (
    <View style={styles.pagination}>
      {Array.from({ length: totalPages }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === currentPage && styles.activeDot,
          ]}
        />
      ))}
    </View>
  );
}
