import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Wi Chat App",
  slug: "wi-chat-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/app_icon_bg.png",
  userInterfaceStyle: "automatic",
  splash: {
    backgroundColor: "#FA4169",
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: false,
    config: {
      usesNonExemptEncryption: false
    },
    buildNumber: "4",
    googleServicesFile: "./GoogleService-Info.plist",
    bundleIdentifier: "com.wichatapp",
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
    googleServicesFile: process.env.AGS || '',
    adaptiveIcon: {
      foregroundImage: "./assets/images/app_icon_bg.png",
      backgroundColor: "#FA4169"
    },
    package: "com.wichatapp",
    permissions: [
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION", 
      "ACCESS_BACKGROUND_LOCATION",
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",
      "android.permission.INTERNET",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.READ_EXTERNAL_STORAGE"
    ],
  },
  notification: {
    icon: "./assets/images/app_icon_bg.png"
  },
  web: {
    favicon: "./assets/images/app_icon_bg.png"
  },
  plugins: [
    "expo-camera",
    "expo-location",
    "expo-notifications",
    "expo-font",
    "expo-system-ui",
    [
      "expo-splash-screen",
      {
        "backgroundColor": "#FA4169",
        "dark": {
          "image": "./assets/images/app_icon.png",
          "backgroundColor": "#FA4169"
        },
        "image": "./assets/images/app_icon.png",
        "imageWidth": 144
      }
    ]
  ],
  extra: {
    eas: {
      projectId: "262d6739-ab83-497f-a5f4-b8852d594e76"
    }
  },
  owner: "wichatapp"
});