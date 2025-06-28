import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:json_annotation/json_annotation.dart';

part 'attachment.g.dart';

const _kSuppertedImageMimeTypes = [
  'image/png',
  'image/jpeg',
  'image/bmp',
  'image/gif',
  'image/webp',
  'image/vnd.wap.wbmp',
];

@JsonSerializable()
class Attachment {
  final String name;
  final String url;
  final String type;
  final int size;
  final int created;
  final int width;
  final int height;
  final double aspectRatio;

  Attachment({
    @required this.name,
    @required this.url,
    @required this.type,
    @required this.size,
    @required this.created,
    this.width,
    this.height,
    this.aspectRatio,
  });

  bool get isImage => _kSuppertedImageMimeTypes.contains(type);

  factory Attachment.fromJson(Map<String, dynamic> json) =>
      _$AttachmentFromJson(json);
  Map<String, dynamic> toJson() => _$AttachmentToJson(this);
}
