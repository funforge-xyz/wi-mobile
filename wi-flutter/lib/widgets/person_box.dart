import 'package:flutter/material.dart';
import 'package:wi/exts/all.dart';

/// Displays image, title, subtitle and a timestamp for friend requets,
/// promotions, chat entries, etc.
///
/// Probably need a better name.
class PersonBox extends StatelessWidget {
  final String image;
  final String name;
  final String summary;
  final DateTime date;
  final Function onTap;

  PersonBox({
    @required this.image,
    @required this.name,
    @required this.summary,
    @required this.date,
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
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: SizedBox(
                width: 56,
                height: 56,
                child: Image.network(image),
              ),
            ),
            SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    name ?? '?',
                    style: TextStyle(fontSize: 16),
                  ),
                  SizedBox(height: 2),
                  Text(
                    summary ?? '?',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: theme.textTheme.caption.color),
                  )
                ],
              ),
            ),
            SizedBox(width: 16),
            Text(
              date.readable(showTime: true),
              style: TextStyle(
                color: theme.textTheme.caption.color,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
