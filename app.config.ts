export default {
  expo: {
    name: "WiChat",
    slug: "wichat",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/app_icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/welcome.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
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
        UIBackgroundModes: ["location", "fetch", "remote-notification"]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/app_icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.wichat.app",
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION"
      ]
    },
    web: {
      favicon: "./assets/images/app_icon.png"
    }
  }
};