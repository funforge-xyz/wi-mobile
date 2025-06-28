import 'package:flutter/material.dart';

class SectionHeader extends StatelessWidget {
  final String text;

  SectionHeader(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(text, style: TextStyle(fontSize: 16));
  }
}
