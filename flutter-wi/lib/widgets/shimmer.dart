import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart' as lib;

class Shimmer extends StatelessWidget {
  final Widget child;

  Shimmer({@required this.child}) : assert(child != null);

  @override
  Widget build(BuildContext context) {
    return lib.Shimmer.fromColors(
      baseColor: Colors.grey[200],
      highlightColor: Colors.grey[100],
      child: child,
    );
  }
}
