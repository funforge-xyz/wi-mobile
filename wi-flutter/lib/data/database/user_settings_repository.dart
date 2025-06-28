import 'package:wi/data/database/base.dart';
import 'package:wi/data/models/user_settings.dart';

class UserSettingsRepository with FirestoreRepository {
  @override
  String get collectionType => CollectionType.USER_SETTINGS;

  Future<UserSettingsModel> getUserSettings(
    String profileId,
  ) async {
    final snapshot =
        await instance.collection(collectionType).document(profileId).get();

    if (!snapshot.exists) {
      await instance
          .collection(collectionType)
          .document(profileId)
          .setData(UserSettingsModel().toJson());

      return UserSettingsModel();
    }

    return UserSettingsModel.fromJson(snapshot.data);
  }

  Future updateUserSettings(
    String profileId,
    UserSettingsModel model,
  ) async {
    await instance
        .collection(collectionType)
        .document(profileId)
        .updateData(model.toJson());
  }
}
