import 'package:flutter/material.dart';

extension ColorExts on Color {
  /// Returns text color that will be legible on this color.
  Color textColorOnThis() {
    final brightness = textBrightnessOnThis();
    final themeToGetFrom =
        brightness == Brightness.light ? ThemeData.dark() : ThemeData.light();
    return themeToGetFrom.colorScheme.onSurface;
  }

  /// Returns suggested [Brightness] for text that will be displayed
  /// on this color.
  Brightness textBrightnessOnThis() => (this?.computeLuminance() ?? 1) < 0.5
      ? Brightness.light
      : Brightness.dark;
}
