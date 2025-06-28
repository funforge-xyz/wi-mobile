import 'package:flutter/material.dart';
import 'package:wi/config/colors.dart';

class AppBarAction extends StatelessWidget {
  final Widget child;
  final Function onTap;

  AppBarAction({
    @required this.child,
    this.onTap,
  }) : assert(child != null);

  @override
  Widget build(BuildContext context) {
    final borderRadius = BorderRadius.circular(40);
    return Center(
      child: SizedBox(
        height: 40,
        width: 40,
        child: InkWell(
          onTap: onTap,
          borderRadius: borderRadius,
          child: Center(
            child: child,
          ),
        ),
      ),
    );
  }
}
