// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'message.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Message _$MessageFromJson(Map json) {
  return Message(
    content: json['content'] as String,
    created: TimestampSerializer.deserialize(json['created']),
    delivered: TimestampSerializer.deserialize(json['delivered']),
    seen: TimestampSerializer.deserialize(json['seen']),
    attachments: (json['attachments'] as List)
        ?.map((e) => e == null
            ? null
            : Attachment.fromJson((e as Map)?.map(
                (k, e) => MapEntry(k as String, e),
              )))
        ?.toList(),
    senderId: json['sender_id'] as String,
  );
}

Map<String, dynamic> _$MessageToJson(Message instance) => <String, dynamic>{
      'created': TimestampSerializer.serialize(instance.created),
      'delivered': TimestampSerializer.serialize(instance.delivered),
      'seen': TimestampSerializer.serialize(instance.seen),
      'content': instance.content,
      'attachments': instance.attachments?.map((e) => e?.toJson())?.toList(),
      'sender_id': instance.senderId,
    };
