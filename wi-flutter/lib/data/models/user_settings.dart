import 'package:json_annotation/json_annotation.dart';

part 'user_settings.g.dart';

@JsonSerializable()
class NotificationSettingsModel {
  bool notifyMe;

  NotificationSettingsModel({
    this.notifyMe = true,
  });

  factory NotificationSettingsModel.fromJson(Map<String, dynamic> json) =>
      _$NotificationSettingsModelFromJson(json);
  Map<String, dynamic> toJson() => _$NotificationSettingsModelToJson(this);
}

@JsonSerializable()
class UserSettingsModel {
  NotificationSettingsModel notifications;

  UserSettingsModel({NotificationSettingsModel notifications})
      : notifications = notifications ?? NotificationSettingsModel();

  factory UserSettingsModel.fromJson(Map<String, dynamic> json) =>
      _$UserSettingsModelFromJson(json);
  Map<String, dynamic> toJson() => _$UserSettingsModelToJson(this);
}
