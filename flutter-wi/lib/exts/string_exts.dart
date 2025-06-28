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

extension UrlExts on String {
  static final _urlRegex = RegExp(
    r'https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}'
    '\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)',
  );
  bool get isUrl => this.startsWith('http') && _urlRegex.hasMatch(this);
}

/// Extension methods which assume this string is a file path (or url) that
/// ends with the file name and the extension, and return relevant information.
extension FilePathExts on String {
  static const _kImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  static final _regex = RegExp(r'.*[\/|\\]((.+)\.(\w+))');

  String get fileNameWithExtension => _regex.firstMatch(this)?.group(1);
  String get fileName => _regex.firstMatch(this)?.group(2);
  String get fileExtension => _regex.firstMatch(this)?.group(3);

  bool get isImage => _kImageExtensions.contains(fileExtension);
}
