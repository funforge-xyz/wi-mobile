
import React from 'react';
import { View } from 'react-native';
import { useAppSelector } from '../hooks/redux';
import { getTheme } from '../theme';
import SkeletonLoader from './SkeletonLoader';

interface ConnectionsSkeletonProps {
  count?: number;
}

export default function ConnectionsSkeleton({ count = 6 }: ConnectionsSkeletonProps) {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const currentTheme = getTheme(isDarkMode);

  const renderSkeletonItem = (index: number) => (
    <View
      key={index}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: currentTheme.surface,
        marginHorizontal: 16,
        marginVertical: 4,
        borderRadius: 12,
      }}
    >
      <SkeletonLoader
        width={50}
        height={50}
        borderRadius={25}
        backgroundColor={currentTheme.skeletonBase}
        highlightColor={currentTheme.skeletonHighlight}
      />
      
      <View style={{ flex: 1, marginLeft: 12 }}>
        <SkeletonLoader
          width="60%"
          height={16}
          borderRadius={8}
          backgroundColor={currentTheme.skeletonBase}
          highlightColor={currentTheme.skeletonHighlight}
        />
        <View style={{ height: 6 }} />
        <SkeletonLoader
          width="40%"
          height={12}
          borderRadius={6}
          backgroundColor={currentTheme.skeletonBase}
          highlightColor={currentTheme.skeletonHighlight}
        />
      </View>
      
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <SkeletonLoader
          width={36}
          height={36}
          borderRadius={18}
          backgroundColor={currentTheme.skeletonBase}
          highlightColor={currentTheme.skeletonHighlight}
        />
        <SkeletonLoader
          width={36}
          height={36}
          borderRadius={18}
          backgroundColor={currentTheme.skeletonBase}
          highlightColor={currentTheme.skeletonHighlight}
        />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {Array.from({ length: count }, (_, index) => renderSkeletonItem(index))}
    </View>
  );
}
