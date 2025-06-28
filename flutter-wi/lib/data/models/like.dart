import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:json_annotation/json_annotation.dart';
import 'package:wi/data/models/serializers/timestamp_serializer.dart';

part 'like.g.dart';

@JsonSerializable()
class Like {
  final String userId;
  final String userImageUrl;
  final String userName;
  @JsonKey(
    toJson: TimestampSerializer.serialize,
    fromJson: TimestampSerializer.deserialize,
  )
  final Timestamp likedAt;

  Like({
    this.userId,
    this.userImageUrl,
    this.userName,
    this.likedAt,
  });

  factory Like.fromJson(Map<String, dynamic> json) => _$LikeFromJson(json);
  Map<String, dynamic> toJson() => _$LikeToJson(this);
}

extension LikeIterableExts on Iterable<Like> {
  /// Checks whether user with given [id] exists in this collection of likers.
  bool containsUser(String id) {
    final search = firstWhere((like) => like.userId == id, orElse: () => null);
    return search != null;
  }
}
