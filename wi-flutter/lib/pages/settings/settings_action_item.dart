import 'package:flutter/material.dart';

class SettingsActionItem extends StatelessWidget {
  final String name;
  final String description;
  final Function onTap;
  final Widget actionItem;

  SettingsActionItem({
    @required this.name,
    @required this.description,
    this.onTap,
    this.actionItem,
  });

  final isSwitched = true;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Row(
          children: [
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
            actionItem ?? SizedBox.shrink(),
          ],
        ),
      ),
    );
  }
}
