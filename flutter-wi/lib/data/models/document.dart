import 'package:cloud_firestore/cloud_firestore.dart';

class Document<T> {
  final DocumentSnapshot snapshot;
  final T data;

  DocumentReference get ref => snapshot.reference;

  Document({
    this.snapshot,
    this.data,
  })  : assert(snapshot != null),
        assert(data != null);
}
