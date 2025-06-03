// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'thread.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Thread _$ThreadFromJson(Map json) {
  return Thread(
    created: TimestampSerializer.deserialize(json['created']),
    lastUpdated: TimestampSerializer.deserialize(json['lastUpdated']),
    createdOnNetwork: json['created_on_network'] as String,
    users: (json['users'] as List)?.map((e) => e as String)?.toList(),
  );
}

Map<String, dynamic> _$ThreadToJson(Thread instance) => <String, dynamic>{
      'created': TimestampSerializer.serialize(instance.created),
      'lastUpdated': TimestampSerializer.serialize(instance.lastUpdated),
      'created_on_network': instance.createdOnNetwork,
      'users': instance.users,
    };
