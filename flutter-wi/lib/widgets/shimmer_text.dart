import 'package:flutter/material.dart';

class ShimmerText extends StatelessWidget {
  final double width;
  final double height;

  ShimmerText({this.width = double.infinity, this.height = 12});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(4),
        color: Colors.black,
      ),
    );
  }
}
