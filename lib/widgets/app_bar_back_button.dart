import 'package:flutter/material.dart';
import 'package:wi/config/icons.dart';
import 'package:wi/widgets/app_bar_action.dart';

class AppBarBackButton extends StatelessWidget {
  final Function onTap;
  final Color color;
  AppBarBackButton({this.onTap, this.color});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsetsDirectional.only(start: 8),
      child: AppBarAction(
        child: Icon(I.backButtonArrow, color: color),
        onTap: onTap ?? () => Navigator.pop(context),
      ),
    );
  }
}
