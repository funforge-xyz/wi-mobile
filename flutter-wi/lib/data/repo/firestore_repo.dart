import 'package:cloud_firestore/cloud_firestore.dart';

class CollectionType {
  static const USERS = 'users';
  static const USER_SETTINGS = 'settings';
  static const THREADS = 'threads';
  static const POSTS = 'posts';
  static const NOTIFICATIONS = 'notifications';
}

abstract class FirestoreRepo {
  final instance = FirebaseFirestore.instance;
  CollectionReference get collection;
}
