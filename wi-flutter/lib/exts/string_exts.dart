import 'package:flutter/material.dart';

extension StringExts on String {
  Color toColor() {
    const defaultColor = Colors.black;
    if (this != null || this.isNotEmpty && this.startsWith('#')) {
      final colorString = this.substring(1);
      var hexString;
      if (this.length == 9) hexString = '0x$colorString';
      if (this.length == 7) hexString = '0xff$colorString';
      if (this.length == 4) hexString = '0xff$colorString$colorString';
      if (hexString == null) return defaultColor;
      return Color(int.parse(hexString));
    }
    return defaultColor;
  }

  String get withApostrophe {
    final endsWithS = this[this.length - 1] == 's';
    final apostrophe = endsWithS ? '\'' : '\'s';
    return this + '$apostrophe';
  }
}
