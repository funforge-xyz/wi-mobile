import 'package:flutter/material.dart';

class C {
  static final outline = Colors.black12;
  static final border = Colors.black26;
  static final placeholder = Colors.black38;
  static Color surfaceOverlay(Brightness brightness) =>
      Color(0xffe9eef3).withOpacity(brightness == Brightness.light ? 0.6 : 0.2);
  static final cameraOverlay = Color(0xff1d1e2c).withOpacity(0.5);
  static final cameraBackground = Color(0xff1f191b);
}

class ColorSet {
  final Color primary;
  final Color accent;
  final Color surface;
  final Color background;
  final Color divider;
  final Color text;
  final Color textLight;
  final Color textLighter;
  final Color textLabel;
  final Color textOnPrimary;
  final Color textOnSecondary;
  final Color border;
  final Color borderFocused;
  final Color borderDisabled;
  final Color inputFieldBackground;
  final Color like;
  ColorSet({
    @required this.primary,
    @required this.accent,
    @required this.surface,
    @required this.background,
    @required this.divider,
    @required this.text,
    @required this.textLight,
    @required this.textLighter,
    @required this.textLabel,
    @required this.textOnPrimary,
    @required this.textOnSecondary,
    @required this.border,
    @required this.borderFocused,
    @required this.borderDisabled,
    @required this.inputFieldBackground,
    @required this.like,
  });

  static ColorSet of(BuildContext context) {
    return Theme.of(context).brightness == Brightness.light
        ? ColorSets.light
        : ColorSets.dark;
  }
}

class ColorSets {
  static final light = ColorSet(
    primary: Color(0xfffa4169),
    accent: Color(0xfffa4169),
    surface: Color(0xfff7f7fb),
    background: Colors.white,
    divider: Colors.black.withOpacity(0.15),
    text: Color(0xff1d1e2c),
    textLight: Color(0xff333333),
    textLighter: Color(0xff757575),
    textLabel: Color(0xff606e7d),
    textOnPrimary: Colors.white,
    textOnSecondary: Colors.white,
    border: Color(0xffd9d9d9),
    borderFocused: Color(0xfffa4169),
    borderDisabled: Color(0xffe9eef3).withOpacity(0.5),
    inputFieldBackground: Colors.white,
    like: Color(0xfffe2042),
  );
  static final dark = ColorSet(
    primary: Color(0xfffa4169),
    accent: Color(0xfffa4169),
    surface: Color(0xff262224),
    background: Color(0xff1f191b),
    divider: Colors.white.withOpacity(0.15),
    text: Colors.white,
    textLight: Colors.white70,
    textLighter: Colors.white60,
    textLabel: Colors.white54,
    textOnPrimary: Colors.white,
    textOnSecondary: Colors.white,
    border: Colors.transparent,
    borderFocused: Color(0xfffa4169),
    borderDisabled: Colors.white.withOpacity(0.05),
    inputFieldBackground: Color(0xff262224),
    like: Color(0xfffe2042),
  );
}
