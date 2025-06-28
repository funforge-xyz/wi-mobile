import 'dart:io';

import 'package:flutter/material.dart';

class CacheImage extends StatelessWidget {
  final Future<File> image;
  final ImageFrameBuilder frameBuilder;
  final double width;
  final double height;
  final Color color;
  final BoxFit fit;

  CacheImage({
    this.image,
    this.frameBuilder,
    this.width,
    this.height,
    this.color,
    this.fit,
  });

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: image,
      builder: (context, snapshot) {
        return Image.file(
          snapshot.data ?? File(''),
          frameBuilder: frameBuilder,
          width: width,
          height: height,
          color: color,
          fit: fit,
        );
      },
    );
  }
}
