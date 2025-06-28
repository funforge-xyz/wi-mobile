import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:json_annotation/json_annotation.dart';

import 'serializers/timestamp_serializer.dart';

part 'thread.g.dart';

@JsonSerializable()
class Thread {
  @JsonKey(
    fromJson: TimestampSerializer.deserialize,
    toJson: TimestampSerializer.serialize,
  )
  final Timestamp created;
  @JsonKey(
    fromJson: TimestampSerializer.deserialize,
    toJson: TimestampSerializer.serialize,
  )
  final Timestamp lastUpdated;
  @JsonKey(name: 'created_on_network')
  final String createdOnNetwork;
  final List<String> users;

  Thread({
    this.created,
    this.lastUpdated,
    this.createdOnNetwork,
    this.users,
  });

  factory Thread.fromJson(Map<String, dynamic> json) => _$ThreadFromJson(json);
  Map<String, dynamic> toJson() => _$ThreadToJson(this);
}
