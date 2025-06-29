import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:json_annotation/json_annotation.dart';

import 'serializers/timestamp_serializer.dart';

part 'comment.g.dart';

@JsonSerializable()
class Comment {
  @JsonKey(
    fromJson: TimestampSerializer.deserialize,
    toJson: TimestampSerializer.serialize,
  )
  final Timestamp createdAt;
  final String authorId;
  final String content;
  final String parentCommentId;

  Comment({
    this.authorId,
    this.content,
    this.createdAt,
    this.parentCommentId,
  });

  factory Comment.fromJson(Map<String, dynamic> json) =>
      _$CommentFromJson(json);
  Map<String, dynamic> toJson() => _$CommentToJson(this);
}
