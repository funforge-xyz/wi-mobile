// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'like.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Like _$LikeFromJson(Map json) {
  return Like(
    userId: json['userId'] as String,
    userImageUrl: json['userImageUrl'] as String,
    userName: json['userName'] as String,
    likedAt: TimestampSerializer.deserialize(json['likedAt']),
  );
}

Map<String, dynamic> _$LikeToJson(Like instance) => <String, dynamic>{
      'userId': instance.userId,
      'userImageUrl': instance.userImageUrl,
      'userName': instance.userName,
      'likedAt': TimestampSerializer.serialize(instance.likedAt),
    };
