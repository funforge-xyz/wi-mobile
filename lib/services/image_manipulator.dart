import 'dart:io';
import 'package:image/image.dart' as i;

abstract class ImageManipulator {
  Future<File> flipAndCropFeedPost(
    File file,
    double aspectRatio, {
    bool flip = false,
  });
}

class ImageManipulatorImpl extends ImageManipulator {
  /// Flips and crops an image as required to make it suitable for a feed post.
  ///
  /// Uses the entire height of the image and adjusts the width based on its
  /// aspect ratio, and takes the crop from the center of the image.
  ///
  /// We do this to ensure the final image that is posted is exactly what the
  /// poster framed.
  @override
  Future<File> flipAndCropFeedPost(
    File file,
    double aspectRatio, {
    bool flip = false,
  }) async {
    var image = i.decodeImage(await file.readAsBytes());
    // Bake orientation to ensure flip works as intended.
    image = i.bakeOrientation(image);
    if (flip) {
      image = i.flip(image, i.Flip.horizontal);
    }

    // Calcuate the width of crop rectangle.
    final cropWidth = image.height / aspectRatio;
    // The amount of horizontal space left around the crop rectangle.
    final leftoverWidth = image.width - cropWidth;
    // The width of the leftover space on each side of the crop rectangle.
    final leftoverSide = leftoverWidth / 2;
    // The left x coordinate of the crop rect.
    final xPoint = leftoverSide;

    image = i.copyCrop(
      image,
      xPoint.round(),
      0,
      cropWidth.round(),
      image.height,
    );

    // Overwrite the original file with our changes.
    await file.writeAsBytes(i.encodeJpg(image, quality: 100));

    return file;
  }
}
