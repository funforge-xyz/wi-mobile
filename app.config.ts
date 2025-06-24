import {ExpoConfig, ConfigContext} from 'expo/config';

export default ({config}: ConfigContext): ExpoConfig => ({
  ...config,
  slug: 'wi-chat-app',
  name: 'Wi Chat App',
});
