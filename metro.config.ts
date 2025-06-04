
import { getDefaultConfig } from 'expo/metro-config';

const config = getDefaultConfig(__dirname);

// Add Firebase compatibility fixes for Expo SDK 53
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

export default config;
