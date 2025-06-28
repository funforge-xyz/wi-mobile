part of 'user_settings.dart';

NotificationSettingsModel _$NotificationSettingsModelFromJson(
    Map<String, dynamic> json) {
  return NotificationSettingsModel(
    notifyMe: json['notifyMe'] as bool,
  );
}

Map<String, dynamic> _$NotificationSettingsModelToJson(
        NotificationSettingsModel instance) =>
    <String, dynamic>{
      'notifyMe': instance.notifyMe,
    };

UserSettingsModel _$UserSettingsModelFromJson(Map<String, dynamic> json) {
  return UserSettingsModel(
    notifications: NotificationSettingsModel.fromJson(
      Map<String, dynamic>.from(json['notifications']),
    ),
  );
}

Map<String, dynamic> _$UserSettingsModelToJson(UserSettingsModel instance) =>
    <String, dynamic>{
      'notifications': instance.notifications.toJson(),
    };
