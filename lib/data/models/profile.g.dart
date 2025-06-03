// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'profile.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class ProfileModelAdapter extends TypeAdapter<ProfileModel> {
  @override
  final int typeId = 4;

  @override
  ProfileModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ProfileModel(
      imageUrl: fields[0] as String,
      name: fields[1] as String,
      about: fields[2] as String,
      phone: fields[3] as String,
      email: fields[4] as String,
    )..currentNetworkId = fields[5] as String;
  }

  @override
  void write(BinaryWriter writer, ProfileModel obj) {
    writer
      ..writeByte(6)
      ..writeByte(0)
      ..write(obj.imageUrl)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.about)
      ..writeByte(3)
      ..write(obj.phone)
      ..writeByte(4)
      ..write(obj.email)
      ..writeByte(5)
      ..write(obj.currentNetworkId);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ProfileModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserActivityStatus _$UserActivityStatusFromJson(Map json) {
  return UserActivityStatus(
    lastTimeSeen: TimestampSerializer.deserialize(json['lastTimeSeen']),
    status: _$enumDecodeNullable(_$ActivityStatusEnumMap, json['status']),
  );
}

Map<String, dynamic> _$UserActivityStatusToJson(UserActivityStatus instance) =>
    <String, dynamic>{
      'lastTimeSeen': TimestampSerializer.serialize(instance.lastTimeSeen),
      'status': _$ActivityStatusEnumMap[instance.status],
    };

T _$enumDecode<T>(
  Map<T, dynamic> enumValues,
  dynamic source, {
  T unknownValue,
}) {
  if (source == null) {
    throw ArgumentError('A value must be provided. Supported values: '
        '${enumValues.values.join(', ')}');
  }

  final value = enumValues.entries
      .singleWhere((e) => e.value == source, orElse: () => null)
      ?.key;

  if (value == null && unknownValue == null) {
    throw ArgumentError('`$source` is not one of the supported values: '
        '${enumValues.values.join(', ')}');
  }
  return value ?? unknownValue;
}

T _$enumDecodeNullable<T>(
  Map<T, dynamic> enumValues,
  dynamic source, {
  T unknownValue,
}) {
  if (source == null) {
    return null;
  }
  return _$enumDecode<T>(enumValues, source, unknownValue: unknownValue);
}

const _$ActivityStatusEnumMap = {
  ActivityStatus.unknown: 'unknown',
  ActivityStatus.online: 'online',
  ActivityStatus.offline: 'offline',
};

ProfileModel _$ProfileModelFromJson(Map json) {
  return ProfileModel(
    imageUrl: json['imageUrl'] as String,
    name: json['name'] as String,
    about: json['about'] as String,
    phone: json['phone'] as String,
    email: json['email'] as String,
    lastKnownLocation: json['lastKnownLocation'] == null
        ? null
        : Location.fromJson((json['lastKnownLocation'] as Map)?.map(
            (k, e) => MapEntry(k as String, e),
          )),
    isDeleted: json['isDeleted'] as bool,
    userActivityStatus: json['userActivityStatus'] == null
        ? null
        : UserActivityStatus.fromJson((json['userActivityStatus'] as Map)?.map(
            (k, e) => MapEntry(k as String, e),
          )),
  )..currentNetworkId = json['currentNetworkId'] as String;
}

Map<String, dynamic> _$ProfileModelToJson(ProfileModel instance) =>
    <String, dynamic>{
      'imageUrl': instance.imageUrl,
      'name': instance.name,
      'about': instance.about,
      'phone': instance.phone,
      'email': instance.email,
      'currentNetworkId': instance.currentNetworkId,
      'lastKnownLocation': instance.lastKnownLocation?.toJson(),
      'isDeleted': instance.isDeleted,
      'userActivityStatus': instance.userActivityStatus?.toJson(),
    };
