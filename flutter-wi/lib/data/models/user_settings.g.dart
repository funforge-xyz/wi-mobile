// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_settings.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

NotificationSettingsModel _$NotificationSettingsModelFromJson(Map json) {
  return NotificationSettingsModel(
    notifyMe: json['notifyMe'] as bool,
  );
}

Map<String, dynamic> _$NotificationSettingsModelToJson(
        NotificationSettingsModel instance) =>
    <String, dynamic>{
      'notifyMe': instance.notifyMe,
    };

UserSettingsModel _$UserSettingsModelFromJson(Map json) {
  return UserSettingsModel(
    notifications: json['notifications'] == null
        ? null
        : NotificationSettingsModel.fromJson(
            (json['notifications'] as Map)?.map(
            (k, e) => MapEntry(k as String, e),
          )),
  );
}

Map<String, dynamic> _$UserSettingsModelToJson(UserSettingsModel instance) =>
    <String, dynamic>{
      'notifications': instance.notifications?.toJson(),
    };
