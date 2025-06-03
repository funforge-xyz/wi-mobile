import 'package:firebase_storage/firebase_storage.dart';

class Bucket {
  static const IMAGES = 'images';
  static const ATTACHMENTS = 'attachments';
  static const FEEDS = 'feeds';
}

abstract class MediaFirebaseStorage {
  final instance = FirebaseStorage.instance;

  String get bucketName;
}
