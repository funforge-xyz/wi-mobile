import 'package:wi/data/database/base.dart';
import 'package:wi/data/models/user_settings.dart';
import 'package:wi/data/models/profile.dart';

class ProfileRepository with FirestoreRepository {
  @override
  String get collectionType => CollectionType.PROFILES;

  Future createProfileFromAuthUser(
    String documentId,
    ProfileModel profileModel,
  ) async {
    await instance
        .collection(collectionType)
        .document(documentId)
        .setData(profileModel.toJson());
  }

  Future<bool> profileExists(String profileId) async {
    final snapshot =
        await instance.collection(collectionType).document(profileId).get();

    return snapshot.exists;
  }

  Future<ProfileModel> getProfileById(String profileId) async {
    final snapshot =
        await instance.collection(collectionType).document(profileId).get();

    return snapshot.data == null ? null : ProfileModel.fromJson(snapshot.data);
  }

  Future updateProfile(String profileId, ProfileModel profileModel) async {
    await instance
        .collection(collectionType)
        .document(profileId)
        .updateData(profileModel.toJson());
  }

  Future deleteProfile(String profileId) async {
    await instance
        .collection(collectionType)
        .document(profileId)
        .updateData({'isDeleted': true});
  }
}
