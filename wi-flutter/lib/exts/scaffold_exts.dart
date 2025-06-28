import 'package:flutter/material.dart';

extension ScaffoldStateExts on ScaffoldState {
  ScaffoldFeatureController<SnackBar, SnackBarClosedReason> showSnackBarFast(
    BuildContext context, {
    String message,
    SnackBarAction action,
    Duration duration,
  }) {
    final scaffold = Scaffold.of(context)..removeCurrentSnackBar();
    return scaffold.showSnackBar(SnackBar(
      content: Text(message),
      action: action,
      duration: duration ?? Duration(seconds: 3),
    ));
  }
}
