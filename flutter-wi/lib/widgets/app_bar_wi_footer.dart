import 'package:flutter/material.dart';
import 'package:wi/di.dart';

class AppBarWIFooter extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final s = strings();
    final theme = Theme.of(context);

    return Container(
      padding: EdgeInsets.only(top: 20, bottom: 20),
      child: Text(
        s.labelCommonFooter,
        textAlign: TextAlign.center,
        style: TextStyle(color: theme.textTheme.caption.color),
      ),
    );
  }
}
