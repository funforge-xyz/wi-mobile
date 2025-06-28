import 'package:flutter/material.dart';

enum CustomOutlineButtonSize { small, normal }

class CustomOutlineButton extends StatelessWidget {
  final String label;
  final Function onTap;
  final bool showArrow;
  final CustomOutlineButtonSize size;

  CustomOutlineButton({
    @required this.label,
    @required this.onTap,
    this.showArrow = true,
    this.size = CustomOutlineButtonSize.small,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final borderRadius = BorderRadius.circular(8);
    final color = theme.primaryColor;
    final textColor =
        theme.brightness == Brightness.light ? color : Colors.white;
    return SizedBox(
      height: size == CustomOutlineButtonSize.small ? 36 : 40,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Material(
            color: Colors.transparent,
            shape: RoundedRectangleBorder(
              borderRadius: borderRadius,
              side: BorderSide(
                width: 1,
                color: theme.dividerColor,
              ),
            ),
            child: InkWell(
              borderRadius: borderRadius,
              onTap: onTap,
              splashColor: color.withOpacity(0.2),
              highlightColor: color.withOpacity(0.2),
              child: Padding(
                padding: const EdgeInsets.only(left: 10, right: 4),
                child: Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: <Widget>[
                      Padding(
                        padding: const EdgeInsets.only(bottom: 2),
                        child: Text(
                          label,
                          style: TextStyle(
                            color: textColor,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      SizedBox(width: 4),
                      if (showArrow)
                        Icon(
                          Icons.chevron_right,
                          color: textColor,
                          size: 22,
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
