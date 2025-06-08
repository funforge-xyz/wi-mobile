import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:json_annotation/json_annotation.dart';
import 'package:wi/exts/all.dart';

import 'serializers/timestamp_serializer.dart';

part 'post.g.dart';

@JsonSerializable()
class Post {
  @JsonKey(
    fromJson: TimestampSerializer.deserialize,
    toJson: TimestampSerializer.serialize,
  )
  final Timestamp createdAt;
  final String authorId;
  final String content;
  final String mediaURL;
  final String thumbURL;
  final String wifiId;
  final bool allowComments;
  final bool allowLikes;

  bool get isImage => mediaURL?.isImage == true;
  bool get isVideo => !isImage;

  Post({
    this.authorId,
    this.content,
    this.mediaURL,
    this.thumbURL,
    this.createdAt,
    this.wifiId,
    this.allowComments,
    this.allowLikes,
  });

  factory Post.fromJson(Map<String, dynamic> json) => _$PostFromJson(json);
  Map<String, dynamic> toJson() => _$PostToJson(this);
}
