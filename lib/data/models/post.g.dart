// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'post.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Post _$PostFromJson(Map json) {
  return Post(
    authorId: json['authorId'] as String,
    content: json['content'] as String,
    mediaURL: json['mediaURL'] as String,
    thumbURL: json['thumbURL'] as String,
    createdAt: TimestampSerializer.deserialize(json['createdAt']),
    wifiId: json['wifiId'] as String,
    allowComments: json['allowComments'] as bool,
    allowLikes: json['allowLikes'] as bool,
  );
}

Map<String, dynamic> _$PostToJson(Post instance) => <String, dynamic>{
      'createdAt': TimestampSerializer.serialize(instance.createdAt),
      'authorId': instance.authorId,
      'content': instance.content,
      'mediaURL': instance.mediaURL,
      'thumbURL': instance.thumbURL,
      'wifiId': instance.wifiId,
      'allowComments': instance.allowComments,
      'allowLikes': instance.allowLikes,
    };
