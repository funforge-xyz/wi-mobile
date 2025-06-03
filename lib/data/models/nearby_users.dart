import 'package:hive/hive.dart';
import 'package:json_annotation/json_annotation.dart';
import 'package:wi/data/local/hive.dart';

part 'nearby_users.g.dart';

@HiveType(typeId: HiveIds.NEARBY_USERS)
@JsonSerializable()
class NearbyUsers {
  @HiveField(0)
  @JsonKey(name: 'resultList')
  final List<NearbyUser> data;

  NearbyUsers({this.data});

  factory NearbyUsers.fromJson(Map<String, dynamic> json) =>
      _$NearbyUsersFromJson(json);
  Map<String, dynamic> toJson() => _$NearbyUsersToJson(this);
}

@HiveType(typeId: HiveIds.NEARBY_USER)
@JsonSerializable()
class NearbyUser {
  @HiveField(0)
  final String name;
  @HiveField(1)
  final String email;
  @HiveField(2)
  final String externalUserId;
  @HiveField(3)
  final String currentNetworkId;
  @HiveField(4)
  final String imageUrl;
  @HiveField(5)
  final String about;
  @HiveField(6)
  final bool sameWiFi;

  NearbyUser({
    this.name,
    this.email,
    this.externalUserId,
    this.currentNetworkId,
    this.imageUrl,
    this.about,
    this.sameWiFi,
  });

  factory NearbyUser.fromJson(Map<String, dynamic> json) =>
      _$NearbyUserFromJson(json);
  Map<String, dynamic> toJson() => _$NearbyUserToJson(this);
}
