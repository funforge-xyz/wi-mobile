
import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Wi Chat App",
  slug: "wi-chat-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/app_icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/welcome.png",
    resizeMode: "contain",
    backgroundColor: "#6366F1",
    dark: {
      image: "./assets/images/welcome.png",
      resizeMode: "contain",
      backgroundColor: "#121212"
    }
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.wichat.app",
    infoPlist: {
      NSLocationAlwaysAndWhenInUseUsageDescription: "WiChat needs location access to find nearby users and enable location-based features.",
      NSLocationAlwaysUsageDescription: "WiChat needs background location access to keep finding nearby users even when the app is not active.",
      NSLocationWhenInUseUsageDescription: "WiChat needs location access to find nearby users around you.",
      UIBackgroundModes: ["location", "fetch", "remote-notification"],
      NSCameraUsageDescription: "This app needs access to camera to take photos and videos",
      NSMicrophoneUsageDescription: "This app needs access to microphone to record videos"
    }
  },
  android: {
    edgeToEdgeEnabled: true,
    googleServicesFile: "./google-services.json",
    adaptiveIcon: {
      foregroundImage: "./assets/images/app_icon.png",
      backgroundColor: "#6366F1"
    },
    permissions: [
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_BACKGROUND_LOCATION",
      "android.permission.INTERNET",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.READ_EXTERNAL_STORAGE"
    ],
    notification: {
      icon: "./assets/images/app_icon.png"
    }
  },
  web: {
    favicon: "./assets/images/app_icon.png"
  },
  plugins: [
    "expo-camera",
    "expo-location", 
    "expo-notifications",
    "@react-native-firebase/app",
    "@react-native-firebase/auth",
    "@react-native-firebase/messaging",
    "expo-font",
    "expo-system-ui"
  ],
  edgeToEdgeEnabled: true,
  extra: {
    eas: {
      projectId: "262d6739-ab83-497f-a5f4-b8852d594e76"
    }
  }
});
