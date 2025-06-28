import 'package:cloud_firestore/cloud_firestore.dart';

class CollectionType {
  static const PROFILES = 'users';
  static const USER_SETTINGS = 'settings';
}

abstract class FirestoreRepository {
  final instance = Firestore.instance;

  String get collectionType;
}
