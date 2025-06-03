import 'package:flutter/material.dart';
import 'package:wi/config/colors.dart';

class InputBackground extends StatelessWidget {
  final Widget child;
  final bool showShadow;
  final bool showBackgroundColor;

  InputBackground({
    @required this.child,
    this.showShadow = true,
    this.showBackgroundColor = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: showBackgroundColor
            ? ColorSet.of(context).inputFieldBackground
            : null,
        boxShadow: [
          if (showShadow)
            BoxShadow(
              offset: Offset(0, 2),
              blurRadius: 4,
              color: Colors.black.withOpacity(0.07),
            ),
        ],
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(4),
          bottomRight: Radius.circular(4),
        ),
      ),
      child: child,
    );
  }
}
