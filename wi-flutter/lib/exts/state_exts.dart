import 'package:flutter/material.dart';
import 'package:wi/exts/scaffold_exts.dart';

extension StateExts on State {
  ScaffoldFeatureController<SnackBar, SnackBarClosedReason> showSnackBar({
    String message,
    SnackBarAction action,
    Duration duration,
  }) {
    return Scaffold.of(context).showSnackBarFast(
      context,
      message: message,
      action: action,
      duration: duration,
    );
  }
}
