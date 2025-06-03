import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:json_annotation/json_annotation.dart';

import 'serializers/timestamp_serializer.dart';

part 'notification_record.g.dart';

@JsonSerializable()
class NotificationRecord {
  @JsonKey(
    fromJson: TimestampSerializer.deserialize,
    toJson: TimestampSerializer.serialize,
  )
  final Timestamp createdAt;
  final String targetUserId;
  final String creatorUserId;
  final String title;
  final String body;
  @JsonKey(
    fromJson: TimestampSerializer.deserialize,
    toJson: TimestampSerializer.serialize,
  )
  final Timestamp open;
  @JsonKey(
    fromJson: TimestampSerializer.deserialize,
    toJson: TimestampSerializer.serialize,
  )
  final Timestamp read;
  final Map<String, dynamic> data;

  NotificationRecord({
    this.createdAt,
    this.targetUserId,
    this.creatorUserId,
    this.title,
    this.body,
    this.open,
    this.read,
    this.data,
  });

  factory NotificationRecord.fromJson(Map<String, dynamic> json) =>
      _$NotificationRecordFromJson(json);
  Map<String, dynamic> toJson() => _$NotificationRecordToJson(this);
}
