import 'package:cloud_firestore/cloud_firestore.dart' hide Settings;
import 'package:wi/data/local/permissions.dart';
import 'package:wi/data/local/settings.dart';
import 'package:wi/data/models/document.dart';
import 'package:wi/data/models/user_settings.dart';
import 'package:wi/di.dart';
import 'package:wi/exts/all.dart';

import 'firestore_repo.dart';

class UserSettingsRepo with FirestoreRepo {
  final _permissions = getIt<Permissions>();
  final _settings = getIt<Settings>();

  @override
  CollectionReference get collection =>
      instance.collection(CollectionType.USER_SETTINGS);

  Future<UserSettingsModel> getUserSettings(
    String profileId,
  ) async {
    final snapshot = await collection.doc(profileId).get();

    if (!snapshot.exists) {
      await collection.doc(profileId).set(UserSettingsModel().toJson());

      return UserSettingsModel();
    }

    return UserSettingsModel.fromJson(snapshot.data());
  }

  Future createIfNotExists(String userId) async {
    final doc = await collection.doc(userId).get();
    if (!doc.exists) {
      collection.doc(userId).set({});
    }
  }

  Stream<Document<UserSettingsModel>> getUserSettingsLive(String userId) {
    return collection.doc(userId).snapshots().asDocument(
          (json) => UserSettingsModel.fromJson(json),
        );
  }

  Future toggleNotifications(String profileId, bool enabled) async {
    await createIfNotExists(profileId);
    collection.doc(profileId).update(
      {
        'notifications': {'notifyMe': enabled}
      },
    );
  }

  Future updateBackgroundTrackingStatus(String profileId) async {
    await createIfNotExists(profileId);
    final status = await _permissions.locationAlwaysStatus();
    collection.doc(profileId).update({
      'backgroundTrackingEnabled': status.isGranted(),
    });
  }

  Future updateTimezoneInfoIfNeeded(String userId) async {
    final timezone = DateTime.now().timeZoneName;
    final offset = DateTime.now().timeZoneOffset;

    final offsetInMinutes = offset.inMinutes.abs();
    final offsetHoursPart = offsetInMinutes ~/ 60;
    final offsetMinutesPart = offsetInMinutes - offsetHoursPart * 60;
    final hoursString =
        offsetHoursPart < 10 ? '0$offsetHoursPart' : offsetHoursPart;
    final minutesString =
        offsetMinutesPart < 10 ? '0$offsetMinutesPart' : offsetMinutesPart;
    final offsetString =
        '${offset.isNegative ? '-' : ''}$hoursString:$minutesString';

    if (_settings.lastTimezoneNameUpdate != timezone &&
        _settings.lastTimezoneOffsetUpdate != offsetString) {
      collection.doc(userId).update({
        'tzSettings': {
          'tzAbbrev': timezone,
          'tzOffset': offsetString,
        },
      });
      _settings.lastTimezoneNameUpdate = timezone;
      _settings.lastTimezoneOffsetUpdate = offsetString;
    }
  }
}
