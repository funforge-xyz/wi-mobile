import 'dart:io';

import 'package:firebase_storage/firebase_storage.dart';
import 'package:wi/data/storage/base.dart';
import 'package:wi/data/storage/cache_managers.dart';
import 'package:wi/di.dart';
import 'package:wi/exts/all.dart';

enum CacheSource { genericImages, messageImages }

class AttachmentsStorage with MediaFirebaseStorage {
  final _imageCacheManager = getIt<ImageCacheManager>();
  final _messageImageCacheManager = getIt<MessageImageCacheManager>();

  @override
  String get bucketName => Bucket.ATTACHMENTS;
  String itemPath(String threadId, String fileName) =>
      "$threadId-${DateTime.now().millisecondsSinceEpoch}-$fileName";

  // TODO: Replace StorageUploadTask with custom model
  UploadTask upload(File file, String threadId) {
    return instance
        .ref()
        .child(bucketName)
        .child(itemPath(threadId, file.path.fileNameWithExtension))
        .putFile(file);
  }

  Future<File> getImageFile(
    String url, {
    CacheSource source = CacheSource.genericImages,
  }) async {
    if (url == null) return null;
    final manager = source == CacheSource.genericImages
        ? _imageCacheManager
        : _messageImageCacheManager;
    return await manager.getSingleFile(url);
  }
}
