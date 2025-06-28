import 'package:flutter/material.dart';

class ShimmerCircle extends StatelessWidget {
  final double radius;

  ShimmerCircle(this.radius);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: radius * 2,
      height: radius * 2,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radius),
        color: Colors.black,
      ),
    );
  }
}
