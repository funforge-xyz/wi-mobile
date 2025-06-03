import 'package:flutter/material.dart';
import 'package:wi/config/colors.dart';

class SettingsSectionLabel extends StatelessWidget {
  final String label;
  SettingsSectionLabel(this.label);
  @override
  Widget build(BuildContext context) {
    final colorSet = ColorSet.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Text(
        label ?? '?',
        style: TextStyle(
          color: colorSet.textLighter,
          fontSize: 18,
        ),
      ),
    );
  }
}
