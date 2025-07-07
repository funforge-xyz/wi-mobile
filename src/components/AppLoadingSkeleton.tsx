
import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from '../store';
import FeedSkeleton from './FeedSkeleton';

export default function AppLoadingSkeleton() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            {/* App header skeleton */}
            <View style={{
              height: 60,
              backgroundColor: '#FFFFFF',
              borderBottomWidth: 1,
              borderBottomColor: '#E5E5E5',
              justifyContent: 'center',
              alignItems: 'center',
              paddingTop: 10,
            }}>
              <View style={{
                width: 100,
                height: 20,
                backgroundColor: '#E5E5E5',
                borderRadius: 10,
              }} />
            </View>

            {/* Main content skeleton */}
            <View style={{ flex: 1 }}>
              <FeedSkeleton count={4} />
            </View>
            
            {/* Bottom tab skeleton */}
            <View style={{
              height: 80,
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#E5E5E5',
              flexDirection: 'row',
              justifyContent: 'space-around',
              alignItems: 'center',
              paddingBottom: 20,
            }}>
              {['Feed', 'Nearby', 'Chats', 'Profile'].map((label, index) => (
                <View key={index} style={{
                  alignItems: 'center',
                  opacity: 0.4,
                }}>
                  <View style={{
                    width: 24,
                    height: 24,
                    backgroundColor: '#E5E5E5',
                    borderRadius: 12,
                    marginBottom: 4,
                  }} />
                  <View style={{
                    width: label.length * 6,
                    height: 12,
                    backgroundColor: '#E5E5E5',
                    borderRadius: 6,
                  }} />
                </View>
              ))}
            </View>
          </View>
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}
