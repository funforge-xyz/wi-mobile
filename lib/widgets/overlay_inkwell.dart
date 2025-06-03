import 'package:flutter/material.dart';

class OverlayInkWell extends StatelessWidget {
  final InkWell inkWell;
  final List<Widget> children;

  OverlayInkWell({
    @required this.inkWell,
    @required this.children,
  })  : assert(inkWell != null),
        assert(children != null);

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: <Widget>[
        ...children,
        Positioned.fill(
          child: Material(
            color: Colors.transparent,
            child: inkWell,
          ),
        ),
      ],
    );
  }
}
