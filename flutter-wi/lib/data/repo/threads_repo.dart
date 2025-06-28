import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:image_size_getter/image_size_getter.dart';
import 'package:wi/data/models/attachment.dart';
import 'package:wi/data/models/document.dart';
import 'package:wi/data/models/message.dart';
import 'package:wi/data/models/thread.dart';
import 'package:wi/exts/all.dart';
import 'package:wi/widgets/attachment_upload.dart';

import 'firestore_repo.dart';

class ThreadsRepo with FirestoreRepo {
  @override
  CollectionReference get collection =>
      instance.collection(CollectionType.THREADS);

  Stream<List<Document<Thread>>> getThreadsWithUser(
    String userId, {
    DocumentSnapshot cursor,
  }) {
    var query = collection
        .where('users', arrayContains: userId)
        .orderBy('lastUpdated', descending: true)
        .limit(20);
    if (cursor != null) {
      query = query.startAfterDocument(cursor);
    }
    return query.snapshots().asListOfDocuments((s) {
      return Thread.fromJson(s.data());
    });
  }

  Future<String> getExistingThreadId({
    @required String myId,
    @required String partnerId,
  }) async {
    final threads = await collection.where('users', arrayContains: myId).get();
    final common = threads?.docs?.where(
      (thread) => (thread.data()['users'] as List).contains(partnerId),
    );
    return common.firstOrNull()?.id;
  }

  DocumentReference startThread({
    @required String myId,
    @required String partnerId,
  }) {
    assert(myId != null);
    assert(partnerId != null);
    final thread = collection.doc();
    thread.set(
      Thread(
        created: Timestamp.now(),
        lastUpdated: Timestamp.now(),
        users: [myId, partnerId],
      ).toJson(),
    );
    thread.collection('messages').get();
    return thread;
  }

  Stream<List<MessageDocument>> getThreadMessages(String id,
      {DocumentSnapshot cursorDocument}) {
    var query = collection
        .doc(id)
        .collection('messages')
        .orderBy('created', descending: true);
    print(cursorDocument);
    if (cursorDocument != null) {
      query = query.startAfterDocument(cursorDocument);
    }
    query = query.limit(30);
    return query.snapshots().map(
          (snapshot) => snapshot.docs
              .map((s) => MessageDocument(s, Message.fromJson(s.data())))
              .toList(),
        );
  }

  Stream<List<Document<Message>>> getLastXMessages(String id, int count) {
    return collection
        .doc(id)
        .collection('messages')
        .orderBy('created', descending: true)
        .limit(count)
        .snapshots()
        .asListOfDocuments((s) => Message.fromJson(s.data()));
  }

  Stream<int> getUnreadCount(String userId) {
    return collection
        .where('users', arrayContains: userId)
        .snapshots()
        .asyncMap((snapshots) async {
      final unreads = await Future.wait(snapshots.docs.map((thread) async {
        final users = thread.data()['users'] as List;
        users.remove(userId);
        final otherSender = users.first;
        final messagesByOtherSender = await collection
            .doc(thread.id)
            .collection('messages')
            .where('sender_id', isEqualTo: otherSender)
            .get();
        return messagesByOtherSender.docs
            .where((element) => element.data()['seen'] == null)
            .length;
      }));
      return unreads.reduce((count1, count2) => count1 + count2);
    });
  }

  Future addMessage(
    String threadId,
    String senderId,
    String content,
    List<AttachmentPick> attachments,
  ) async {
    final message = collection.doc(threadId).collection('messages').doc();
    final attachmentsExpanded = await Future.wait<Attachment>(
      attachments.map((a) async {
        final data = await a.ref.getMetadata();
        final url = await a.ref.getDownloadURL();
        final size = ImageSizGetter.getSize(a.file);
        return Attachment(
          name: a.file.path.fileNameWithExtension,
          url: url,
          type: data.contentType,
          size: data.size,
          width: size == Size.zero ? null : size.width,
          height: size == Size.zero ? null : size.height,
          aspectRatio: size == Size.zero ? null : size.height / size.width,
          created: data.timeCreated.millisecondsSinceEpoch,
        );
      }),
    );
    return message.set(Message(
      content: content,
      created: Timestamp.now(),
      senderId: senderId,
      attachments: attachmentsExpanded ?? [],
    ).toJson());
  }

  void markMessageAsSeen(Document<Message> message) {
    final data = Map<String, dynamic>();
    data['seen'] = Timestamp.now();
    message.ref.update(data);
  }

  void updateThreadLastUpdated(String threadId) {
    collection.doc(threadId).update({'lastUpdated': Timestamp.now()});
  }
}
