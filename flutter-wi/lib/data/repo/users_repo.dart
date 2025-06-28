import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:wi/data/local/blocked_info.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/local/database.dart';
import 'package:wi/data/models/document.dart';
import 'package:wi/data/models/nearby_users.dart';
import 'package:wi/data/models/profile.dart';
import 'package:wi/data/remote/api/api.dart';
import 'package:wi/data/remote/network_resource_db_fallback.dart';
import 'package:wi/data/remote/resource.dart';
import 'package:wi/di.dart';
import 'package:wi/exts/all.dart';
import 'package:wi/utils/rate_limiter.dart';

import 'firestore_repo.dart';

class UsersRepo with FirestoreRepo {
  final _api = getIt<Api>();
  final _credentials = getIt<Credentials>();
  final _db = getIt<Database>();
  final _rateLimiter = getIt<RateLimiter>();

  @override
  CollectionReference get collection =>
      instance.collection(CollectionType.USERS);

  Future createProfileFromAuthUser(
    String documentId,
    ProfileModel profileModel,
  ) async {
    await collection.doc(documentId).set(profileModel.toJson());
  }

  Future<bool> profileExists(String profileId) async {
    final snapshot = await collection.doc(profileId).get();

    return snapshot.exists;
  }

  Future<ProfileModel> getProfileById(String profileId) async {
    final snapshot = await collection.doc(profileId).get();

    return snapshot.data == null
        ? null
        : ProfileModel.fromJson(snapshot.data() ?? {});
  }

  void updateProfile(String profileId, ProfileModel profileModel) {
    collection.doc(profileId).update(profileModel.toJson());
  }

  void setUserOnline(String profileId) {
    collection.doc(profileId).update({
      'userActivityStatus': UserActivityStatus.onlineNow().toJson(),
    });
  }

  void setUserOffline(String profileId) {
    collection.doc(profileId).update({
      'userActivityStatus': UserActivityStatus.offline().toJson(),
    });
  }

  void deleteProfile(String profileId) {
    collection.doc(profileId).update({'isDeleted': true});
  }

  Stream<Document<ProfileModel>> getProfileByIdLive(String id) {
    return collection
        .doc(id)
        .snapshots()
        .asDocument((json) => ProfileModel.fromJson(json));
  }

  Stream<Resource<BlockedInfo>> getBlockedInfo() {
    return _api.getBlockedInfo(_credentials.userId).executeAsStream();
  }

  Future<void> blockUser(String userId) async {
    await _api.blockUser(_credentials.userId, userId).execute();
  }

  Future<void> unblockUser(String userId) async {
    await _api.unblockUser(_credentials.userId, userId).execute();
  }

  Stream<Resource<NearbyUsers>> getNearbyUsers() {
    return NetworkResourceDbFallback<NearbyUsers>(
      request: _api.getNearbyUsers(_credentials.userId).executeAsStream,
      saveToDb: (data) => _db.putNearbyUsers(data),
      existsInDb: () => _db.nearbyUsersExist,
      getFromDb: () => _db.getNearbyUsers(),
      shouldFetch: () => _rateLimiter.shouldFetch(RateLimiterKeys.NEARBY_USERS),
    ).load();
  }

  void updateCurrentNetworkId(String profileId, String networkId) {
    if (profileId == null) return;
    collection.doc(profileId).update({'currentNetworkId': networkId});
  }

  Future addNotificationToken(String profileId, String token) async {
    final existingRecordsForThisToken = await collection
        .doc(profileId)
        .collection('notifTokens')
        .where('token', isEqualTo: token)
        .get();
    final length = existingRecordsForThisToken.size;
    if (length == 0) {
      collection.doc(profileId).collection('notifTokens').add({'token': token});
    }
  }

  Future removeNotificationToken(String profileId, String token) async {
    final docs = await collection
        .doc(profileId)
        .collection('notifTokens')
        .where('token', isEqualTo: token)
        .get();
    await docs.docs.firstOrNull()?.reference?.delete();
  }
}
