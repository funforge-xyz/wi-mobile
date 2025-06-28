import 'package:flutter/material.dart';
import 'package:wi/config/colors.dart';

class PassiveTextButton extends StatelessWidget {
  final Widget child;
  final Function onTap;
  PassiveTextButton({
    @required this.child,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colorSet = ColorSet.of(context);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(4),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: DefaultTextStyle(
          style: TextStyle(
            color: colorSet.textLighter,
          ),
          child: child,
        ),
      ),
    );
  }
}
