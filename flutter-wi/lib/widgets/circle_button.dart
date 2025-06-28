import 'package:flutter/material.dart';
import 'package:wi/exts/all.dart';
import 'package:wi/widgets/custom_icon.dart';

class CircleButton extends StatelessWidget {
  final IconData icon;
  final CustomIconData customIcon;
  final VoidCallback onPressed;

  CircleButton._({
    this.icon,
    this.customIcon,
    @required this.onPressed,
  });

  CircleButton({
    @required IconData icon,
    @required VoidCallback onPressed,
  }) : this._(
          icon: icon,
          onPressed: onPressed,
        );

  CircleButton.custom({
    @required CustomIconData icon,
    @required VoidCallback onPressed,
  }) : this._(
          customIcon: icon,
          onPressed: onPressed,
        );

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ClipOval(
      child: Material(
        color: theme.isLight ? Colors.black12 : Colors.white12,
        child: IconButton(
          icon: icon != null ? Icon(icon) : CustomIcon(customIcon),
          onPressed: onPressed,
        ),
      ),
    );
  }
}
