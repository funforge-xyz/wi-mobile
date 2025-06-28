import 'package:flutter/material.dart';

class SettingsItem extends StatelessWidget {
  final Widget image;
  final String name;
  final String description;
  final Function onTap;

  SettingsItem({
    @required this.image,
    @required this.name,
    @required this.description,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Row(
          children: [
            image,
            SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    name,
                    style: TextStyle(fontSize: 16),
                  ),
                  SizedBox(height: 2),
                  Text(
                    description ?? '',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: theme.textTheme.caption.color),
                  )
                ],
              ),
            ),
            SizedBox(width: 16),
          ],
        ),
      ),
    );
  }
}
