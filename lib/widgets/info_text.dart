import 'package:flutter/material.dart';

class InfoText extends StatelessWidget {
  final String text;

  const InfoText(
    this.text,
  );

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Text(this.text,
        style: TextStyle(color: theme.textTheme.caption.color));
  }
}
