import 'package:flutter/material.dart';
import 'package:wi/config/icons.dart';
import 'package:wi/widgets/app_bar_action.dart';

class AppBarBackButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsetsDirectional.only(start: 8),
      child: AppBarAction(
        child: Icon(I.arrowLeft),
        attractive: true,
        onTap: () => Navigator.pop(context),
      ),
    );
  }
}
