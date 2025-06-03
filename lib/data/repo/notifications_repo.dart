import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:wi/data/models/document.dart';
import 'package:wi/data/models/notification_record.dart';
import 'package:wi/exts/all.dart';

import 'firestore_repo.dart';

class NotificationsRepo with FirestoreRepo {
  @override
  CollectionReference get collection =>
      instance.collection(CollectionType.NOTIFICATIONS);

  Stream<List<Document<NotificationRecord>>> getNotifications(
    String userId, {
    DocumentSnapshot cursor,
  }) {
    var query = collection
        .where('targetUserId', isEqualTo: userId)
        .orderBy('createdAt', descending: true)
        .limit(20);
    if (cursor != null) {
      query = query.startAfterDocument(cursor);
    }
    return query
        .snapshots()
        .asListOfDocuments((s) => NotificationRecord.fromJson(s.data()));
  }

  Stream<int> getUnopenedCount(String userId) {
    return collection
        .where('targetUserId', isEqualTo: userId)
        .where('read', isNull: true)
        .snapshots()
        .map((event) => event.size);
  }

  Future markAsOpened(String notificationId) async {
    collection.doc(notificationId).update({'open': Timestamp.now()});
  }

  Future markAsRead(String notificationId) async {
    collection.doc(notificationId).update({'read': Timestamp.now()});
  }
}
