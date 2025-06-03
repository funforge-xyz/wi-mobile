import 'dart:io';

import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:path_provider/path_provider.dart';
import 'package:video_compress/video_compress.dart';
import 'package:path/path.dart' as p;

abstract class Compression {
  Future<File> compressImage(File input);
  Future<File> compressVideo(File input);
  Future<File> getVideoThumbnail(File input);
}

class CompressionImpl extends Compression {
  String _dir;

  CompressionImpl() {
    getTemporaryDirectory().then((dir) => _dir = dir.path);
  }

  @override
  Future<File> compressImage(File input) async {
    return FlutterImageCompress.compressAndGetFile(
      input.path,
      p.join(_dir, '${DateTime.now().millisecondsSinceEpoch}.jpg'),
      quality: 40,
    );
  }

  @override
  Future<File> compressVideo(File input) async {
    final resultInfo = await VideoCompress.compressVideo(
      input.path,
      quality: VideoQuality.DefaultQuality,
      deleteOrigin: true,
    );
    return resultInfo.file;
  }

  @override
  Future<File> getVideoThumbnail(File input) {
    return VideoCompress.getFileThumbnail(input.path, quality: 100);
  }
}
