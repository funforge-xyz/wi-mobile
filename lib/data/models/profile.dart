import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:hive/hive.dart';
import 'package:json_annotation/json_annotation.dart';
import 'package:wi/data/local/hive.dart';
import 'package:wi/data/models/serializers/timestamp_serializer.dart';
import 'package:wi/services/location.dart';

part 'profile.g.dart';

enum ActivityStatus {
  unknown,
  online,
  offline,
}

@JsonSerializable()
class UserActivityStatus {
  @JsonKey(
    fromJson: TimestampSerializer.deserialize,
    toJson: TimestampSerializer.serialize,
  )
  Timestamp lastTimeSeen;
  ActivityStatus status;

  UserActivityStatus({
    this.lastTimeSeen,
    this.status = ActivityStatus.unknown,
  });

  factory UserActivityStatus.onlineNow() {
    return UserActivityStatus(
      status: ActivityStatus.online,
      lastTimeSeen: Timestamp.now(),
    );
  }

  factory UserActivityStatus.offline() {
    return UserActivityStatus(status: ActivityStatus.offline);
  }

  factory UserActivityStatus.fromJson(Map<String, dynamic> json) =>
      _$UserActivityStatusFromJson(json);
  Map<String, dynamic> toJson() => _$UserActivityStatusToJson(this);

  setOnline() {
    status = ActivityStatus.online;
    lastTimeSeen = Timestamp.now();
  }

  setOffline() {
    status = ActivityStatus.offline;
    lastTimeSeen = Timestamp.now();
  }
}

@HiveType(typeId: HiveIds.PROFILE)
@JsonSerializable()
class ProfileModel {
  @HiveField(0)
  String imageUrl;
  @HiveField(1)
  String name;
  @HiveField(2)
  String about;
  @HiveField(3)
  String phone;
  @HiveField(4)
  String email;
  @HiveField(5)
  String currentNetworkId;
  Location lastKnownLocation;
  bool isDeleted;
  UserActivityStatus userActivityStatus;

  ProfileModel({
    this.imageUrl,
    this.name,
    this.about,
    this.phone,
    this.email,
    this.lastKnownLocation,
    this.isDeleted = false,
    UserActivityStatus userActivityStatus,
  }) : userActivityStatus = userActivityStatus ?? UserActivityStatus();

  factory ProfileModel.fromJson(Map<String, dynamic> json) =>
      _$ProfileModelFromJson(json);
  Map<String, dynamic> toJson() => _$ProfileModelToJson(this);
}
