
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';
import { useAppSelector } from '../hooks/redux';
import { SPACING } from '../config/constants';

interface NearbySkeletonProps {
  count?: number;
}

export default function NearbySkeleton({ count = 5 }: NearbySkeletonProps) {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  const renderSkeletonPerson = (index: number) => (
    <View key={index} style={[styles.personContainer, { backgroundColor: currentTheme.surface }]}>
      <View style={styles.personInfo}>
        {/* Avatar */}
        <SkeletonLoader
          width={50}
          height={50}
          borderRadius={25}
          style={styles.avatar}
        />
        
        {/* Person details */}
        <View style={styles.personDetails}>
          <SkeletonLoader
            width={140}
            height={16}
            borderRadius={8}
            style={styles.personName}
          />
          <SkeletonLoader
            width={200}
            height={12}
            borderRadius={6}
            style={styles.personBio}
          />
        </View>
      </View>
      
      {/* Chevron icon */}
      <SkeletonLoader
        width={20}
        height={20}
        borderRadius={10}
        style={styles.chevron}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, index) => renderSkeletonPerson(index))}
    </View>
  );
}

const lightTheme = {
  surface: '#FFFFFF',
};

const darkTheme = {
  surface: '#1E1E1E',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  personContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 12,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: SPACING.md,
  },
  personDetails: {
    flex: 1,
  },
  personName: {
    marginBottom: SPACING.xs,
  },
  personBio: {
    marginBottom: 0,
  },
  chevron: {},
});
