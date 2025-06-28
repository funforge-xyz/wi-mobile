import 'package:flutter/material.dart';

class CommonProgressIndicator extends StatelessWidget {
  final EdgeInsets padding;
  final Color color;

  const CommonProgressIndicator({
    this.padding = const EdgeInsets.all(8.0),
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding,
      child: SizedBox(
        height: 32,
        width: 32,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          valueColor: AlwaysStoppedAnimation(color),
        ),
      ),
    );
  }
}
