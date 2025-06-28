import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/local/database.dart';
import 'package:wi/data/models/comment.dart';
import 'package:wi/data/models/document.dart';
import 'package:wi/data/models/like.dart';
import 'package:wi/data/models/post.dart';
import 'package:wi/data/models/posts.dart';
import 'package:wi/data/remote/api/api.dart';
import 'package:wi/data/remote/network_resource_db_fallback.dart';
import 'package:wi/data/remote/resource.dart';
import 'package:wi/di.dart';
import 'package:wi/exts/all.dart';
import 'package:wi/services/location.dart';
import 'package:wi/utils/rate_limiter.dart';

import 'firestore_repo.dart';

class PostsRepo with FirestoreRepo {
  final _api = getIt<Api>();
  final _credentials = getIt<Credentials>();
  final _db = getIt<Database>();
  final _rateLimiter = getIt<RateLimiter>();

  @override
  CollectionReference get collection =>
      instance.collection(CollectionType.POSTS);

  Stream<Resource<Posts>> getPosts({bool preferCache = false}) {
    return NetworkResourceDbFallback<Posts>(
      request: _api.getPosts(_credentials.userId).executeAsStream,
      saveToDb: (data) => _db.putPosts(data),
      existsInDb: () => _db.postsExist,
      getFromDb: () => _db.getPosts(),
      shouldFetch: () => _rateLimiter.shouldFetch(RateLimiterKeys.FEED_POSTS),
      preferDb: preferCache,
    ).load();
  }

  Stream<List<Document<Post>>> getPostsByUser(String userId) {
    return collection
        .where('authorId', isEqualTo: userId)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .asListOfDocuments((s) {
      return Post.fromJson(s.data());
    });
  }

  Future<Document<Post>> getPostById(String id) async {
    final doc = await collection.doc(id).get();
    return Document(data: Post.fromJson(doc.data()), snapshot: doc);
  }

  void removePost(String postId) {
    collection.doc(postId).delete();
  }

  Stream<List<Document<Like>>> getPostLikes(String postId) {
    return collection
        .doc(postId)
        .collection('likes')
        .snapshots()
        .asListOfDocuments((s) => Like.fromJson(s.data()));
  }

  Stream<List<Document<Comment>>> getPostComments(String postId) {
    return collection
        .doc(postId)
        .collection('comments')
        .orderBy('createdAt', descending: false)
        .snapshots()
        .asListOfDocuments((s) => Comment.fromJson(s.data()));
  }

  Future<Document<Comment>> getCommentById(
      String postId, String commentId) async {
    final doc = await collection
        .doc(postId)
        .collection('comments')
        .doc(commentId)
        .get();
    return Document(data: Comment.fromJson(doc.data()), snapshot: doc);
  }

  Stream<List<Document<Like>>> getCommentLikes(
    String postId,
    String commentId,
  ) {
    return collection
        .doc(postId)
        .collection('comments')
        .doc(commentId)
        .collection('likes')
        .snapshots()
        .asListOfDocuments((s) => Like.fromJson(s.data()));
  }

  Stream<List<Document<Comment>>> getCommentReplies(
    String postId,
    String commentId,
  ) {
    return collection
        .doc(postId)
        .collection('comments')
        .doc(commentId)
        .collection('replies')
        .orderBy('createdAt', descending: false)
        .snapshots()
        .asListOfDocuments((s) => Comment.fromJson(s.data()));
  }

  void addLike(String postId, String userId) {
    final profile = _db.getProfile();
    if (profile == null) throw 'Profile should never be null here!';
    collection.doc(postId).collection('likes').add({
      'userId': userId,
      'userImageUrl': profile.imageUrl,
      'userName': profile.name,
      'likedAt': Timestamp.now(),
    });
  }

  void removeLike(String postId, String userId) async {
    final docs = await collection
        .doc(postId)
        .collection('likes')
        .where('userId', isEqualTo: userId)
        .get();
    docs.docs.firstOrNull()?.reference?.delete();
  }

  void addComment(String postId, String comment, String authorId) {
    collection.doc(postId).collection('comments').add(
          Comment(
            authorId: authorId,
            content: comment,
            createdAt: Timestamp.now(),
          ).toJson(),
        );
  }

  void removeComment(String postId, String commentId) {
    collection.doc(postId).collection('comments').doc(commentId).delete();
  }

  void addCommentLike(String postId, String commentId, String userId) {
    final profile = _db.getProfile();
    if (profile == null) throw 'Profile should never be null here!';
    collection
        .doc(postId)
        .collection('comments')
        .doc(commentId)
        .collection('likes')
        .add({
      'userId': userId,
      'userImageUrl': profile.imageUrl,
      'userName': profile.name,
      'likedAt': Timestamp.now(),
    });
  }

  void removeCommentLike(String postId, String commentId, String userId) async {
    final docs = await collection
        .doc(postId)
        .collection('comments')
        .doc(commentId)
        .collection('likes')
        .where('userId', isEqualTo: userId)
        .get();
    docs.docs.firstOrNull()?.reference?.delete();
  }

  void addCommentReply(
    String postId,
    String commentId,
    String reply,
    String authorId,
  ) {
    collection
        .doc(postId)
        .collection('comments')
        .doc(commentId)
        .collection('replies')
        .add(
          Comment(
            authorId: authorId,
            content: reply,
            createdAt: Timestamp.now(),
          ).toJson(),
        );
  }

  void removeCommentReply(String postId, String commentId, String replyId) {
    collection
        .doc(postId)
        .collection('comments')
        .doc(commentId)
        .collection('replies')
        .doc(replyId)
        .delete();
  }

  Stream<List<Document<Like>>> getCommentReplyLikes(
    String postId,
    String commentId,
    String replyId,
  ) {
    return collection
        .doc(postId)
        .collection('comments')
        .doc(commentId)
        .collection('replies')
        .doc(replyId)
        .collection('likes')
        .snapshots()
        .asListOfDocuments((s) => Like.fromJson(s.data()));
  }

  void addCommentReplyLike(
    String postId,
    String commentId,
    String replyId,
    String userId,
  ) {
    final profile = _db.getProfile();
    if (profile == null) throw 'Profile should never be null here!';
    collection
        .doc(postId)
        .collection('comments')
        .doc(commentId)
        .collection('replies')
        .doc(replyId)
        .collection('likes')
        .add({
      'userId': userId,
      'userImageUrl': profile.imageUrl,
      'userName': profile.name,
      'likedAt': Timestamp.now(),
    });
  }

  void removeCommentReplyLike(
      String postId, String commentId, String replyId, String userId) async {
    final docs = await collection
        .doc(postId)
        .collection('comments')
        .doc(commentId)
        .collection('replies')
        .doc(replyId)
        .collection('likes')
        .where('userId', isEqualTo: userId)
        .get();
    docs.docs.firstOrNull()?.reference?.delete();
  }
}
