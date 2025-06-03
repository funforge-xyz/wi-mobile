import 'dart:io';

import 'package:firebase_storage/firebase_storage.dart';
import 'package:wi/data/storage/base.dart';
import 'package:wi/data/storage/cache_managers.dart';
import 'package:wi/di.dart';

class ImagesStorage with MediaFirebaseStorage {
  final _imageCacheManager = getIt<ImageCacheManager>();

  @override
  String get bucketName => Bucket.IMAGES;
  String imagePath(basePath) => "images/$basePath";

  // TODO: Replace StorageUploadTask with custom model
  UploadTask upload(String imageName, File file) {
    return instance.ref().child(imagePath(imageName)).putFile(file);
  }

  Future<File> getImageFile(String url) async {
    if (url == null) return null;
    return await _imageCacheManager.getSingleFile(url);
  }
}
