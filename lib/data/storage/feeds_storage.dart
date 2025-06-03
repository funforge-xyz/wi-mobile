import 'dart:io';

import 'package:firebase_storage/firebase_storage.dart';
import 'package:wi/data/storage/base.dart';
import 'package:wi/data/storage/cache_managers.dart';
import 'package:wi/di.dart';
import 'package:wi/exts/all.dart';

class FeedsStorage with MediaFirebaseStorage {
  final _cacheManager = getIt<FeedCache>();

  @override
  String get bucketName => Bucket.FEEDS;

  UploadTask uploadMedia(File file, String userId) {
    final now = DateTime.now().millisecondsSinceEpoch;
    return instance
        .ref()
        .child(bucketName)
        .child('$userId-$now.${file.path.fileExtension}')
        .putFile(file);
  }

  UploadTask uploadThumb(File file, String userId) {
    final now = DateTime.now().millisecondsSinceEpoch;
    return instance
        .ref()
        .child(bucketName)
        .child('$userId-$now-thumb.jpg')
        .putFile(file);
  }

  Future<File> getMediaFile(String url) async {
    if (url == null) return null;
    return await _cacheManager.getSingleFile(url);
  }
}
