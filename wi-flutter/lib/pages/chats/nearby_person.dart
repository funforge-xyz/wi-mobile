import 'package:flutter/material.dart';
import 'package:wi/di.dart';
import 'package:wi/widgets/custom_outline_button.dart';

class NearbyPerson extends StatelessWidget {
  final String image;
  final String name;
  final String summary;
  final Function onStartChatTap;
  final Function onViewProfileTap;

  NearbyPerson({
    @required this.image,
    @required this.name,
    @required this.summary,
    this.onStartChatTap,
    this.onViewProfileTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final s = strings();
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
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
              SizedBox(height: 4),
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
              ),
              SizedBox(height: 8),
              Row(
                children: [
                  CustomOutlineButton(
                    label: s.actionCommonStartChat,
                    onTap: onStartChatTap,
                  ),
                  SizedBox(width: 8),
                  CustomOutlineButton(
                    label: s.actionCommonViewProfile,
                    onTap: onViewProfileTap,
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
