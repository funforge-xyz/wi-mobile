// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notification_record.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

NotificationRecord _$NotificationRecordFromJson(Map json) {
  return NotificationRecord(
    createdAt: TimestampSerializer.deserialize(json['createdAt']),
    targetUserId: json['targetUserId'] as String,
    creatorUserId: json['creatorUserId'] as String,
    title: json['title'] as String,
    body: json['body'] as String,
    open: TimestampSerializer.deserialize(json['open']),
    read: TimestampSerializer.deserialize(json['read']),
    data: (json['data'] as Map)?.map(
      (k, e) => MapEntry(k as String, e),
    ),
  );
}

Map<String, dynamic> _$NotificationRecordToJson(NotificationRecord instance) =>
    <String, dynamic>{
      'createdAt': TimestampSerializer.serialize(instance.createdAt),
      'targetUserId': instance.targetUserId,
      'creatorUserId': instance.creatorUserId,
      'title': instance.title,
      'body': instance.body,
      'open': TimestampSerializer.serialize(instance.open),
      'read': TimestampSerializer.serialize(instance.read),
      'data': instance.data,
    };
