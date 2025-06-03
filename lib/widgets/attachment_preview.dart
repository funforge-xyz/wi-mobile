import 'package:flutter/material.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/config/icons.dart';
import 'package:wi/data/models/attachment.dart';
import 'package:wi/exts/all.dart';

import 'custom_icon.dart';

class AttachmentPreview extends StatelessWidget {
  final Attachment attachment;
  final Function onTap;
  final bool onOwnMessage;

  AttachmentPreview(
    this.attachment, {
    this.onTap,
    this.onOwnMessage = false,
  });

  final _borderRadius = BorderRadius.circular(8);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorSet = ColorSet.of(context);
    final bgColor = theme.isDark
        ? onOwnMessage ? Colors.white12 : Colors.black12
        : onOwnMessage ? Colors.black12 : Colors.white12;
    final textColor = theme.isDark
        ? onOwnMessage ? ColorSets.dark.text : ColorSets.light.text
        : onOwnMessage ? ColorSets.light.text : ColorSets.dark.text;
    final iconColor = textColor.withOpacity(0.6);
    return Container(
      height: 48,
      decoration: BoxDecoration(
        borderRadius: _borderRadius,
        border: Border.all(
          width: 1,
          color: onOwnMessage ? Colors.transparent : theme.dividerColor,
        ),
      ),
      child: Material(
        color: bgColor,
        borderRadius: _borderRadius,
        child: InkWell(
          onTap: onTap,
          borderRadius: _borderRadius,
          highlightColor: theme.primaryColor.withOpacity(0.2),
          splashColor: theme.primaryColor.withOpacity(0.2),
          child: Row(
            children: <Widget>[
              SizedBox(width: 8),
              CustomIcon(
                I.attachment,
                color: iconColor,
              ),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  attachment.name ?? '?',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: textColor,
                  ),
                ),
              ),
              SizedBox(width: 8),
            ],
          ),
        ),
      ),
    );
  }
}
