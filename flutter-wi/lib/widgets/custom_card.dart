import 'package:flutter/material.dart';
import 'package:wi/config/app_config.dart';

class CustomCard extends StatelessWidget {
  final Widget child;
  final Function onTap;

  CustomCard({
    this.child,
    this.onTap,
  }) : assert(child != null);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final borderRadius =
        BorderRadius.circular(AppConfig.STANDARD_CORNER_RADIUS);
    return Container(
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 8,
            offset: Offset(0, 0),
          ),
        ],
        color: theme.colorScheme.surface,
      ),
      child: ClipRRect(
        borderRadius: borderRadius,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: borderRadius,
            child: child,
          ),
        ),
      ),
    );
  }
}
