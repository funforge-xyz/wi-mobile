import 'package:flutter/material.dart';
import 'package:wi/config/colors.dart';

class InputLabel extends StatelessWidget {
  final String label;
  InputLabel(this.label);
  @override
  Widget build(BuildContext context) {
    final colorSet = ColorSet.of(context);
    return Text(
      label ?? '?',
      style: TextStyle(
        color: colorSet.textLabel,
      ),
    );
  }
}
