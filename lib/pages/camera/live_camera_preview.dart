import 'package:camera/camera.dart';
import 'package:flutter/material.dart';

class LiveCameraPreview extends StatelessWidget {
  final CameraController controller;
  final bool scaleFix;

  LiveCameraPreview(this.controller, {this.scaleFix = false});

  @override
  Widget build(BuildContext context) {
    if (controller?.value?.isInitialized != true) {
      // Camera not initialized yet
      return SizedBox.shrink();
    }

    if (!scaleFix) {
      return CameraPreview(controller);
    }


    return AspectRatio(
      aspectRatio: 1,
      child: Center(
        child: CameraPreview(controller),
      ),
    );
  }
}
