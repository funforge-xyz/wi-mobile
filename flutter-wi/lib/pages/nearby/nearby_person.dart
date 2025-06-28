import 'package:flutter/material.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/di.dart';
import 'package:wi/widgets/avatar.dart';
import 'package:wi/widgets/tap_tooltip.dart';

class NearbyPerson extends StatelessWidget {
  final String image;
  final String name;
  final String summary;
  final bool onSameWifi;
  final bool isBlocked;
  final Function onTap;

  NearbyPerson({
    @required this.image,
    @required this.name,
    @required this.summary,
    this.onSameWifi = false,
    this.isBlocked = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final s = strings();
    final theme = Theme.of(context);
    final colorSet = ColorSet.of(context);
    if (name == null) {
      // Hide ourselves if this user somehow doesn't have a name.
      return SizedBox.shrink();
    }
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(4),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        child: Row(
          children: [
            Stack(
              children: [
                Avatar(image, size: 48),
                if (onSameWifi)
                  Positioned.fill(
                    child: Align(
                      alignment: Alignment.bottomRight,
                      child: TapTooltip(
                        message: s.messageNearbySameWifi,
                        child: Material(
                          elevation: 2,
                          shape: CircleBorder(),
                          child: Padding(
                            padding: const EdgeInsets.all(4),
                            child: Icon(
                              Icons.wifi,
                              color: colorSet.textLighter,
                              size: 12,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  if(isBlocked) ...[
                    Text(
                      name + ' - Blocked' ?? '?',
                      style: TextStyle(
                        color: theme.textTheme.caption.color,
                      ),
                    ),
                  ]else ...[
                    Text(name ?? '?'),
                  ],
                  if (summary?.isNotEmpty == true) ...[
                    SizedBox(height: 4),
                    Text(
                      summary ?? '?',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: theme.textTheme.caption.color,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
