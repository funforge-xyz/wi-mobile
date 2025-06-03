import 'package:flutter/material.dart';

class ZoomButtons extends StatelessWidget {
  static const _zoomLevels = <num>[1, 2, 4];

  final double selected;
  final ValueChanged<double> onSelected;

  ZoomButtons({@required this.selected, @required this.onSelected});

  @override
  Widget build(BuildContext context) {
    final List<Widget> buttons = _zoomLevels
        .map((level) => IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                margin: EdgeInsets.zero,
                clipBehavior: Clip.antiAlias,
                decoration: ShapeDecoration(
                  color:
                      selected == level ? Colors.black26 : Colors.transparent,
                  shape: CircleBorder(),
                ),
                child: Text('${level}x'),
              ),
              onPressed: () {
                onSelected(level.toDouble());
              },
            ))
        .toList();

    return Container(
      height: 100,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: buttons,
      ),
    );
  }
}
