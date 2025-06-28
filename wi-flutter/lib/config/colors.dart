import 'package:flutter/material.dart';

class C {
  static final outline = Colors.black12;
  static final border = Colors.black26;
  static final placeholder = Colors.black38;
}

class ColorSet {
  final Color primary;
  final Color accent;
  final Color surface;
  final Color background;
  final Color text;
  final Color textOnPrimary;
  final Color textOnSecondary;
  final Color border;
  final Color borderFocused;
  final Color borderDisabled;
  ColorSet({
    @required this.primary,
    @required this.accent,
    @required this.surface,
    @required this.background,
    @required this.text,
    @required this.textOnPrimary,
    @required this.textOnSecondary,
    @required this.border,
    @required this.borderFocused,
    @required this.borderDisabled,
  });
}

class ColorSets {
  static final light = ColorSet(
    primary: Color(0xff4a56ff),
    accent: Color(0xff368be8),
    surface: Colors.white,
    background: Colors.white,
    text: Color(0xff2e3256),
    textOnPrimary: Colors.white,
    textOnSecondary: Colors.white,
    border: Color(0xffe9eef3).withOpacity(0.7),
    borderFocused: Color(0xff368be8),
    borderDisabled: Color(0xffe9eef3).withOpacity(0.5),
  );
  static final dark = ColorSet(
    primary: Color(0xff4853ff),
    accent: Color(0xff368be8),
    surface: Color(0xff1e3c52),
    background: Color(0xff05263f),
    text: Colors.white,
    textOnPrimary: Colors.white,
    textOnSecondary: Colors.white,
    border: Colors.white.withOpacity(0.18),
    borderFocused: Color(0xff368be8),
    borderDisabled: Colors.white.withOpacity(0.05),
  );
}
