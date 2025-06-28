import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hive/hive.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:wi/config/app_config.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/auth/login_page.dart';
import 'package:wi/pages/home/home_page.dart';
import 'package:wi/pages/profile/profile_page.dart';
import 'package:wi/pages/root/root_page.dart';
import 'package:wi/pages/routes.dart';
import 'package:wi/pages/settings/account_page.dart';
import 'package:wi/pages/settings/change_password_page.dart';
import 'package:wi/pages/settings/delete_account_page.dart';
import 'package:wi/pages/settings/notifications_page.dart';
import 'package:wi/pages/settings/settings_page.dart';
import 'package:wi/pages/welcome/welcome_page.dart';
import 'package:wi/widgets/better_ink_splash.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Hive.initFlutter();
  // Register Hive adapters like so:
  // Hive.registerAdapter(CurrentEmployeeAdapter());

  // Initialize Dependency Injection
  await Di.init();

  runApp(App());
}

class App extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: strings().appName,
      theme: _buildTheme(dark: false),
      darkTheme: _buildTheme(dark: true),
      home: RootPage(),
      routes: {
        Routes.WELCOME: (_) => WelcomePage(),
        Routes.LOGIN: (_) => LoginPage(),
        Routes.HOME: (_) => HomePage(),
        Routes.CONVERSATION: (_) => Text('conversation'),
        Routes.MY_PROFILE: (_) => ProfilePage(),
        Routes.MY_PROFILE_INTEREST_ADD: (_) => Text('profile/interest/add'),
        Routes.USER_PROFILE: (_) => Text('user'),
        Routes.SETTINGS: (_) => SettingsPage(),
        Routes.ACCOUNT: (_) => AccountPage(),
        Routes.DELETE_ACCOUNT: (_) => DeleteAccountPage(),
        Routes.CHANGE_PASSWORD: (_) => ChangePasswordPage(),
        Routes.NOTIFICATIONS: (_) => NotificationsPage(),
      },
    );
  }

  ThemeData _buildTheme({bool dark = false}) {
    final baseTheme = dark ? ThemeData.dark() : ThemeData.light();
    final textTheme = GoogleFonts.openSansTextTheme(baseTheme.textTheme);
    final borderRadius =
        BorderRadius.circular(AppConfig.STANDARD_CORNER_RADIUS);
    final inputBorderRadius =
        BorderRadius.circular(AppConfig.STANDARD_CORNER_RADIUS);
    final colorSet = dark ? ColorSets.dark : ColorSets.light;
    return ThemeData(
      visualDensity: VisualDensity.adaptivePlatformDensity,
      primaryColor: colorSet.primary,
      accentColor: colorSet.accent,
      backgroundColor: colorSet.background,
      scaffoldBackgroundColor: colorSet.background,
      cardColor: colorSet.surface,
      // floatingActionButtonTheme: FloatingActionButtonThemeData(
      //   foregroundColor: Colors.white,
      //   elevation: 2,
      //   splashColor: Colors.white12,
      // ),
      brightness: dark ? Brightness.dark : Brightness.light,
      dividerColor: dark
          ? Colors.white.withOpacity(0.05)
          : Colors.black.withOpacity(0.05),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
        ),
        backgroundColor: colorSet.primary,
        splashColor: Colors.white12,
      ),
      buttonTheme: ButtonThemeData(
        height: 56,
        shape: RoundedRectangleBorder(
          borderRadius: borderRadius,
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: 24.0,
          vertical: 10.0,
        ),
        textTheme: ButtonTextTheme.primary,
      ),
      appBarTheme: AppBarTheme(
        color: colorSet.surface,
        brightness: dark ? Brightness.dark : Brightness.light,
        textTheme: textTheme.copyWith(
          headline6: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w500,
            color: colorSet.text,
          ),
        ),
      ),
      textTheme: textTheme
          .apply(
            bodyColor: colorSet.text,
            displayColor: colorSet.text,
          )
          .copyWith(
            bodyText1: TextStyle(
              color: colorSet.text.withOpacity(0.6),
            ),
            caption: TextStyle(
              color: colorSet.text.withOpacity(0.6),
            ),
            button: TextStyle(
              fontSize: 16,
              color: colorSet.textOnSecondary,
            ),
          ),
      cardTheme: CardTheme(
        elevation: 0,
        shadowColor: Colors.black.withOpacity(0.2),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderSide: BorderSide(color: colorSet.border, width: 2),
          borderRadius: inputBorderRadius,
        ),
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(color: colorSet.borderFocused, width: 2),
          borderRadius: inputBorderRadius,
        ),
        enabledBorder: OutlineInputBorder(
          borderSide: BorderSide(color: colorSet.border, width: 2),
          borderRadius: inputBorderRadius,
        ),
        disabledBorder: OutlineInputBorder(
          borderSide: BorderSide(color: colorSet.borderDisabled, width: 2),
          borderRadius: inputBorderRadius,
        ),
      ),
      dialogTheme: DialogTheme(
        shape: RoundedRectangleBorder(borderRadius: borderRadius),
      ),
      splashFactory: BetterSplashFactory(),
    );
  }
}
