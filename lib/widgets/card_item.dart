import 'package:flutter/material.dart';
import 'package:wi/widgets/custom_icon.dart';

class CardItem extends StatelessWidget {
  final String name;
  final Widget image;
  final String description;
  final bool descriptionSingleLine;
  final Function onTap;
  final Widget actionItem;

  CardItem({
    @required this.name,
    this.image,
    this.description,
    this.descriptionSingleLine = true,
    this.onTap,
    this.actionItem,
  });

  Widget _buildDescription(ThemeData theme) {
    if (description == null) {
      return SizedBox.shrink();
    }

    return Container(
      child: Text(
        description,
        maxLines: descriptionSingleLine ? 1 : null,
        overflow: descriptionSingleLine
            ? TextOverflow.ellipsis
            : TextOverflow.visible,
        style: TextStyle(color: theme.textTheme.caption.color),
      ),
    );
  }

  Widget _buildImage() {
    if (image == null) {
      return SizedBox.shrink();
    }

    return Row(
      children: <Widget>[
        image,
        SizedBox(width: 16),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Row(
          children: [
            _buildImage(),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    name,
                    style: TextStyle(fontSize: 16),
                  ),
                  _buildDescription(theme),
                ],
              ),
            ),
            actionItem ?? SizedBox.shrink(),
          ],
        ),
      ),
    );
  }
}

class CardItemIcon extends StatelessWidget {
  final IconData icon;
  final CustomIconData customIcon;
  final Image image;
  final iconColor;
  final backgroundColor;

  CardItemIcon({
    this.icon,
    this.customIcon,
    this.iconColor,
    this.backgroundColor,
    this.image,
  });

  Widget _getIcon(iconColor) {
    if (image != null) {
      return image;
    }

    return icon != null
        ? Icon(icon, color: iconColor)
        : CustomIcon(
            customIcon,
            color: iconColor,
          );
  }

  Color _getIconColor(ThemeData theme) {
    if (iconColor != null) {
      return iconColor;
    }

    return theme.brightness == Brightness.light
        ? Color(0xffffffff)
        : Color(0xff262a50);
  }

  Color _getBackgroundColor(ThemeData theme) {
    if (backgroundColor != null) {
      return backgroundColor;
    }

    return theme.brightness == Brightness.light
        ? Color(0xff262a50)
        : Color(0xfffbfbfb);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final backgroundColor = _getBackgroundColor(theme);
    final iconColor = _getIconColor(theme);

    return ClipRRect(
      borderRadius: BorderRadius.circular(10),
      child: SizedBox(
        width: 56,
        height: 56,
        child: Container(
          child: _getIcon(iconColor),
          decoration: BoxDecoration(color: backgroundColor),
        ),
      ),
    );
  }
}

class CardItemDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Divider(
      color: Color.fromRGBO(0, 0, 0, 0.08),
      thickness: 1,
    );
  }
}
