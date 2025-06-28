import 'package:flutter/material.dart';

class AppBarAction extends StatelessWidget {
  final Widget child;
  final Function onTap;
  final bool attractive;

  AppBarAction({
    @required this.child,
    this.attractive = false,
    this.onTap,
  }) : assert(child != null);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final borderRadius = BorderRadius.circular(10);
    final elevation = attractive ? 4.0 : 0.0;
    final bgColor = attractive ? theme.primaryColor : Color(0xffe9eef3);
    final fgColor = attractive ? Colors.white : null;
    final brightness = attractive
        ? Brightness.dark
        : theme.brightness == Brightness.light
            ? Brightness.dark
            : Brightness.light;
    return Center(
      child: SizedBox(
        height: 36,
        width: 36,
        child: Material(
          color: bgColor,
          elevation: elevation,
          borderRadius: borderRadius,
          child: InkWell(
            onTap: onTap,
            borderRadius: borderRadius,
            child: Center(
              child: Theme(
                data: theme.copyWith(
                  brightness: brightness,
                  iconTheme: theme.iconTheme.copyWith(color: fgColor),
                ),
                child: child,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
