import 'package:hive/hive.dart';
import 'package:json_annotation/json_annotation.dart';
import 'package:wi/data/local/hive.dart';
import 'package:wi/exts/all.dart';

part 'posts.g.dart';

@HiveType(typeId: HiveIds.POSTS)
@JsonSerializable()
class Posts {
  @HiveField(0)
  @JsonKey(name: 'resultList')
  final List<PostInfo> data;

  Posts({this.data});

  factory Posts.fromJson(Map<String, dynamic> json) => _$PostsFromJson(json);
  Map<String, dynamic> toJson() => _$PostsToJson(this);
}

@HiveType(typeId: HiveIds.POST)
@JsonSerializable()
class PostInfo {
  @HiveField(0)
  @JsonKey(name: 'externalPostId')
  final String id;
  @HiveField(1)
  final DateTime createdAt;

  PostInfo({this.id, this.createdAt});

  factory PostInfo.fromJson(Map<String, dynamic> json) =>
      _$PostInfoFromJson(json);
  Map<String, dynamic> toJson() => _$PostInfoToJson(this);
}
