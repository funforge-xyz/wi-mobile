import 'package:flutter/material.dart';

class ImageBackground extends StatelessWidget {
  final double height;
  final double width;
  final Widget child;

  ImageBackground({
    @required this.child,
    this.width,
    this.height,
  }) : assert(child != null);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: width,
      height: height,
      color:
          (theme.brightness == Brightness.light ? Colors.black : Colors.white)
              .withOpacity(0.06),
      child: child,
    );
  }
}
