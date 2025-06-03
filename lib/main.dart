import 'package:admob_flutter/admob_flutter.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:wi/data/local/settings.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/auth/login_page.dart';
import 'package:wi/pages/chat/images_page.dart';
import 'package:wi/pages/home/home_page.dart';
import 'package:wi/pages/onboarding/onboarding_page.dart';
import 'package:wi/pages/profile/profile_page.dart';
import 'package:wi/pages/root/root_page.dart';
import 'package:wi/pages/routes.dart';
import 'package:wi/pages/settings/change_password_page.dart';
import 'package:wi/pages/settings/delete_account_page.dart';
import 'package:wi/pages/settings/settings_page.dart';
import 'package:wi/services/background.dart';
import 'package:wi/theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize ads
  Admob.initialize(testDeviceIds: ['AC2349156CD33849B4476BA3B37DCA6A']);
  await Admob.requestTrackingAuthorization();

  // Initialize Dependency Injection
  await Di.init();

  FirebaseMessaging.onBackgroundMessage(
    BackgroundService.handleUpdateTriggerBackgroundMessage,
  );

  runApp(App());
}

class App extends StatelessWidget {
  final _settings = getIt<Settings>();
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      // checkerboardOffscreenLayers: true,
      // checkerboardRasterCacheImages: true,
      title: strings().appName,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      initialRoute: _settings.onboardingDone ? Routes.ROOT : Routes.ONBOARDING,
      routes: {
        Routes.ONBOARDING: (_) => OnboardingPage(),
        Routes.ROOT: (_) => RootPage(),
        Routes.LOGIN: (_) => LoginPage(),
        Routes.HOME: (_) => HomePage(),
        Routes.CHAT_IMAGES: (_) => ImagesPage(),
        Routes.MY_PROFILE: (_) => ProfilePage(),
        Routes.MY_PROFILE_INTEREST_ADD: (_) => Text('profile/interest/add'),
        Routes.SETTINGS: (_) => SettingsPage(),
        Routes.DELETE_ACCOUNT: (_) => DeleteAccountPage(),
        Routes.CHANGE_PASSWORD: (_) => ChangePasswordPage(),
      },
    );
  }
}
