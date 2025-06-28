import 'dart:async';

import 'package:flutter/material.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/di.dart';

typedef bool _BoolGetter();
typedef FutureOr DismissCallback();

class GuideOverlay extends StatefulWidget {
  final WidgetBuilder imageBuilder;
  final WidgetBuilder titleBuilder;
  final String dismissLabel;
  final _BoolGetter learned;
  final Widget child;
  final DismissCallback onDismiss;

  GuideOverlay({
    @required this.imageBuilder,
    @required this.titleBuilder,
    @required this.child,
    @required this.learned,
    @required this.onDismiss,
    this.dismissLabel,
  });

  @override
  _GuideOverlayState createState() => _GuideOverlayState();
}

class _GuideOverlayState extends State<GuideOverlay> {
  _onDismiss() async {
    await widget.onDismiss();
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();
    final theme = Theme.of(context);
    final colorSet = ColorSet.of(context);
    final learned = widget.learned();
    return Stack(
      children: [
        widget.child,
        if (!learned)
          Positioned.fill(
            child: Material(
              color: Colors.black54,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  widget.imageBuilder(context),
                  SizedBox(height: 32),
                  DefaultTextStyle(
                    style: theme.textTheme.headline6,
                    child: widget.titleBuilder(context),
                  ),
                  SizedBox(height: 32),
                  Material(
                    color: Colors.transparent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(100),
                      side: BorderSide(
                        color: colorSet.text.withOpacity(0.6),
                        width: 1,
                      ),
                    ),
                    child: InkWell(
                      onTap: _onDismiss,
                      borderRadius: BorderRadius.circular(100),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 8,
                        ),
                        child: Text(widget.dismissLabel ?? s.actionCommonGotIt),
                      ),
                    ),
                  )
                ],
              ),
            ),
          ),
      ],
    );
  }
}
