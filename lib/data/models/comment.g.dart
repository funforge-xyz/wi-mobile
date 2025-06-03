// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'comment.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Comment _$CommentFromJson(Map json) {
  return Comment(
    authorId: json['authorId'] as String,
    content: json['content'] as String,
    createdAt: TimestampSerializer.deserialize(json['createdAt']),
  );
}

Map<String, dynamic> _$CommentToJson(Comment instance) => <String, dynamic>{
      'createdAt': TimestampSerializer.serialize(instance.createdAt),
      'authorId': instance.authorId,
      'content': instance.content,
    };
