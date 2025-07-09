import React from 'react';
import { View, Text } from 'react-native';
import { useAppSelector } from '../hooks/redux';
import { getTheme } from '../theme';
import PulsingLogo from './PulsingLogo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from '../store';
import FeedSkeleton from './FeedSkeleton';

export default function AppLoadingSkeleton() {
  const { theme } = useAppSelector(state => state.account);
  const colors = getTheme(theme === 'dark');

  return (
    <Provider store={store}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}>
          <PulsingLogo size={80} />
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
            textAlign: 'center',
            marginTop: 24,
          }}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    </Provider>
  );
}