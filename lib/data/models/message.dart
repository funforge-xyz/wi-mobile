import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:json_annotation/json_annotation.dart';
import 'package:wi/data/models/serializers/timestamp_serializer.dart';
import 'package:wi/exts/all.dart';

import 'attachment.dart';
import 'document.dart';

part 'message.g.dart';

@JsonSerializable()
class Message {
  @JsonKey(
    fromJson: TimestampSerializer.deserialize,
    toJson: TimestampSerializer.serialize,
  )
  final Timestamp created;
  @JsonKey(
    fromJson: TimestampSerializer.deserialize,
    toJson: TimestampSerializer.serialize,
  )
  final Timestamp delivered;
  @JsonKey(
    fromJson: TimestampSerializer.deserialize,
    toJson: TimestampSerializer.serialize,
  )
  final Timestamp seen;
  final String content;
  final List<Attachment> attachments;
  @JsonKey(name: 'sender_id')
  final String senderId;

  List<Attachment> get images =>
      attachments?.where((a) => a.isImage)?.toList() ?? [];

  List<Attachment> get files =>
      attachments?.where((a) => !a.isImage)?.toList() ?? [];

  DateTime get createdDay => created?.toDate()?.startOfDay();

  Message({
    this.content,
    this.created,
    this.delivered,
    this.seen,
    this.attachments,
    this.senderId,
  });

  factory Message.fromJson(Map<String, dynamic> json) =>
      _$MessageFromJson(json);
  Map<String, dynamic> toJson() => _$MessageToJson(this);
}

class MessageDocument extends Document<Message>
    implements Comparable<Document<Message>> {
  MessageDocument(DocumentSnapshot snapshot, Message data)
      : super(
          snapshot: snapshot,
          data: data,
        );

  @override
  int compareTo(other) {
    return data?.created?.toDate()?.compareTo(other?.data?.created?.toDate());
  }
}
