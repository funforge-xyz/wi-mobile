// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'nearby_users.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class NearbyUsersAdapter extends TypeAdapter<NearbyUsers> {
  @override
  final int typeId = 2;

  @override
  NearbyUsers read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return NearbyUsers(
      data: (fields[0] as List)?.cast<NearbyUser>(),
    );
  }

  @override
  void write(BinaryWriter writer, NearbyUsers obj) {
    writer
      ..writeByte(1)
      ..writeByte(0)
      ..write(obj.data);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is NearbyUsersAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class NearbyUserAdapter extends TypeAdapter<NearbyUser> {
  @override
  final int typeId = 3;

  @override
  NearbyUser read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return NearbyUser(
      name: fields[0] as String,
      email: fields[1] as String,
      externalUserId: fields[2] as String,
      currentNetworkId: fields[3] as String,
      imageUrl: fields[4] as String,
      about: fields[5] as String,
      sameWiFi: fields[6] as bool,
    );
  }

  @override
  void write(BinaryWriter writer, NearbyUser obj) {
    writer
      ..writeByte(7)
      ..writeByte(0)
      ..write(obj.name)
      ..writeByte(1)
      ..write(obj.email)
      ..writeByte(2)
      ..write(obj.externalUserId)
      ..writeByte(3)
      ..write(obj.currentNetworkId)
      ..writeByte(4)
      ..write(obj.imageUrl)
      ..writeByte(5)
      ..write(obj.about)
      ..writeByte(6)
      ..write(obj.sameWiFi);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is NearbyUserAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

NearbyUsers _$NearbyUsersFromJson(Map json) {
  return NearbyUsers(
    data: (json['resultList'] as List)
        ?.map((e) => e == null
            ? null
            : NearbyUser.fromJson((e as Map)?.map(
                (k, e) => MapEntry(k as String, e),
              )))
        ?.toList(),
  );
}

Map<String, dynamic> _$NearbyUsersToJson(NearbyUsers instance) =>
    <String, dynamic>{
      'resultList': instance.data?.map((e) => e?.toJson())?.toList(),
    };

NearbyUser _$NearbyUserFromJson(Map json) {
  return NearbyUser(
    name: json['name'] as String,
    email: json['email'] as String,
    externalUserId: json['externalUserId'] as String,
    currentNetworkId: json['currentNetworkId'] as String,
    imageUrl: json['imageUrl'] as String,
    about: json['about'] as String,
    sameWiFi: json['sameWiFi'] as bool,
  );
}

Map<String, dynamic> _$NearbyUserToJson(NearbyUser instance) =>
    <String, dynamic>{
      'name': instance.name,
      'email': instance.email,
      'externalUserId': instance.externalUserId,
      'currentNetworkId': instance.currentNetworkId,
      'imageUrl': instance.imageUrl,
      'about': instance.about,
      'sameWiFi': instance.sameWiFi,
    };
