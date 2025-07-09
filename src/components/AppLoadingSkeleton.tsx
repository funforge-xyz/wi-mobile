import { View } from 'react-native';
import { darkTheme } from '../theme';
import PulsingLogo from './PulsingLogo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from '../store';

export default function AppLoadingSkeleton() {
  return (
    <Provider store={store}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: darkTheme.background,
        }}>
          <PulsingLogo size={120} />
        </View>
      </SafeAreaView>
    </Provider>
  );
}