import 'dart:io';

import 'package:firebase_storage/firebase_storage.dart';
import 'package:wi/data/storage/base.dart';

class ImagesStorage with MediaFirebaseStorage {
  @override
  String get bucketName => Bucket.IMAGES;
  String imagePath(basePath) => "images/$basePath";

  // TODO: Replace StorageUploadTask with custom model
  StorageUploadTask upload(String imageName, File file) {
    return instance.ref().child(imagePath(imageName)).putFile(file);
  }
}
