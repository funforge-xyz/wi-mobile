import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:wi/data/models/document.dart';

extension QuerySnapshotStreamExts on Stream<QuerySnapshot> {
  Stream<List<Document<T>>> asListOfDocuments<T>(
    T Function(DocumentSnapshot) parse,
  ) {
    return map((snapshot) => snapshot.asListOfDocuments((s) => parse(s)));
  }
}

extension QuerySnapshotFutureExts on Future<QuerySnapshot> {
  Future<List<Document<T>>> asListOfDocuments<T>(
    T Function(DocumentSnapshot) parse,
  ) async {
    final docs = await this;
    return docs.asListOfDocuments((s) => parse(s));
  }
}

extension QuerySnapshotExts on QuerySnapshot {
  List<Document<T>> asListOfDocuments<T>(
    T Function(DocumentSnapshot) parse,
  ) {
    return docs.map((s) => Document(snapshot: s, data: parse(s))).toList();
  }
}

extension DocumentSnapshotStreamExts on Stream<DocumentSnapshot> {
  Stream<Document<T>> asDocument<T>(
    T Function(Map<String, dynamic>) parse,
  ) {
    return map(
      (snapshot) => Document(snapshot: snapshot, data: parse(snapshot.data())),
    );
  }
}

extension StorageTaskEventTypeExts on TaskState {
  bool get isRunning => this == TaskState.running;
  bool get isFailure => this == TaskState.error;
  bool get isSuccess => this == TaskState.success;
}
