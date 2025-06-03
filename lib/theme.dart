import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:wi/config/app_config.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/widgets/better_ink_splash.dart';

class AppTheme {
  static ThemeData light = build();
  static ThemeData dark = build(true);

  static ThemeData build([bool dark = false]) {
    // dark = true;
    final baseTheme = dark ? ThemeData.dark() : ThemeData.light();
    final textTheme = GoogleFonts.montserratTextTheme(baseTheme.textTheme);
    final borderRadius =
        BorderRadius.circular(AppConfig.STANDARD_CORNER_RADIUS);
    final inputBorderRadius = BorderRadius.circular(4);
    final colorSet = dark ? ColorSets.dark : ColorSets.light;
    return ThemeData(
      visualDensity: VisualDensity.adaptivePlatformDensity,
      primaryColor: colorSet.primary,
      accentColor: colorSet.accent,
      backgroundColor: colorSet.background,
      scaffoldBackgroundColor: colorSet.background,
      cardColor: colorSet.surface,
      brightness: dark ? Brightness.dark : Brightness.light,
      dividerColor: colorSet.divider,
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
        ),
        backgroundColor: colorSet.primary,
        splashColor: Colors.white12,
      ),
      buttonTheme: ButtonThemeData(
        height: 56,
        buttonColor: colorSet.accent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(100),
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: 24.0,
          vertical: 10.0,
        ),
        textTheme: ButtonTextTheme.primary,
      ),
      appBarTheme: AppBarTheme(
        color: colorSet.background,
        brightness: dark ? Brightness.dark : Brightness.light,
        textTheme: textTheme.copyWith(
          headline6: TextStyle(
            fontSize: 16,
            color: colorSet.text,
          ),
        ),
        iconTheme: IconThemeData(
          color: colorSet.text,
        ),
        actionsIconTheme: IconThemeData(
          color: colorSet.text,
        ),
        centerTitle: true,
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: colorSet.background,
      ),
      textTheme: textTheme
          .apply(
            bodyColor: colorSet.text,
            displayColor: colorSet.text,
          )
          .copyWith(
            bodyText1: TextStyle(
              color: colorSet.text.withOpacity(0.6),
              fontSize: 14,
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
        filled: true,
        fillColor: colorSet.inputFieldBackground,
        hintStyle: TextStyle(fontSize: 14),
        counterStyle: TextStyle(fontSize: 14),
        prefixStyle: TextStyle(fontSize: 14),
        suffixStyle: TextStyle(fontSize: 14),
        helperStyle: TextStyle(fontSize: 14),
        labelStyle: TextStyle(fontSize: 14),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
        border: OutlineInputBorder(
          borderSide: BorderSide(color: colorSet.border, width: 1),
          borderRadius: inputBorderRadius,
        ),
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(color: colorSet.borderFocused, width: 1),
          borderRadius: inputBorderRadius,
        ),
        enabledBorder: OutlineInputBorder(
          borderSide: BorderSide(color: colorSet.border, width: 1),
          borderRadius: inputBorderRadius,
        ),
        disabledBorder: OutlineInputBorder(
          borderSide: BorderSide(color: colorSet.borderDisabled, width: 1),
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
