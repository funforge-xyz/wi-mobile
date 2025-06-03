import 'package:flutter/material.dart';

/// A [MaterialPageRoute] that simply fades in and out.
class FadingMaterialRoute<T> extends MaterialPageRoute<T> {
  FadingMaterialRoute({
    @required WidgetBuilder builder,
    RouteSettings settings,
    bool maintainState = true,
    bool fullscreenDialog = false,
  }) : super(
          builder: builder,
          settings: settings,
          fullscreenDialog: fullscreenDialog,
        );

  @override
  Color get barrierColor => null;

  @override
  String get barrierLabel => null;

  @override
  Widget buildTransitions(BuildContext context, Animation<double> animation,
      Animation<double> secondaryAnimation, Widget child) {
    return FadeTransition(
      opacity: Tween<double>(
        begin: 0.0,
        end: 1.0,
      ).animate(animation),
      child: FadeTransition(
        opacity: Tween<double>(
          begin: 1.0,
          end: 0.0,
        ).animate(secondaryAnimation),
        child: child,
      ),
    );
  }

  @override
  Widget buildPage(BuildContext context, Animation<double> animation,
      Animation<double> secondaryAnimation) {
    return builder(context);
  }

  @override
  Duration get transitionDuration => Duration(milliseconds: 200);
}
